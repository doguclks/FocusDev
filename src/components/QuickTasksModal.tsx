import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Flame,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import { DailyTodo } from '../types';

export const QuickTasksModal: React.FC = () => {
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);

  // Quick inline add state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'high' | 'low'>('normal');

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const todayKey = new Date().toISOString().split('T')[0];

  const todayDateString = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

  const loadTodos = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.getTodosByDate(todayKey);
        setTodos(data || []);
      } catch (err) {
        console.error('Failed to load todos for quick tasks HUD:', err);
      }
    }
  };

  useEffect(() => {
    loadTodos();

    if (window.electronAPI?.onQuickTasksFocus) {
      const unsub = window.electronAPI.onQuickTasksFocus(() => {
        loadTodos();
        setSelectedIndex(0);
        setIsAddingNew(false);
      });
      return unsub;
    }
  }, []);

  // Listen for realtime updates from other windows
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    if (window.electronAPI?.onTodosChanged) {
      unsubs.push(
        window.electronAPI.onTodosChanged((updatedTodo) => {
          if (updatedTodo.date === todayKey) {
            setTodos((prev) => {
              const idx = prev.findIndex((t) => t.id === updatedTodo.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedTodo;
                return next;
              }
              return [...prev, updatedTodo];
            });
          }
        })
      );
    }

    if (window.electronAPI?.onTodoDeleted) {
      unsubs.push(
        window.electronAPI.onTodoDeleted((id) => {
          setTodos((prev) => prev.filter((t) => t.id !== id));
        })
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [todayKey]);

  const handleClose = () => {
    window.electronAPI?.hideQuickTasks();
  };

  const handleToggle = async (todoId: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : null }
          : t
      )
    );
    if (window.electronAPI) {
      try {
        await window.electronAPI.toggleTodo(todoId);
      } catch (err) {
        console.error('Failed to toggle todo:', err);
      }
    }
  };

  const handleDelete = async (todoId: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    if (window.electronAPI) {
      try {
        await window.electronAPI.deleteTodo(todoId);
      } catch (err) {
        console.error('Failed to delete todo:', err);
      }
    }
  };

  const handleAddNew = async () => {
    if (!newText.trim() || !window.electronAPI) return;
    try {
      const created = await window.electronAPI.createTodo(todayKey, newText.trim(), newPriority);
      setTodos((prev) => [...prev, created]);
      setNewText('');
      setIsAddingNew(false);
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  };

  // Filtered list
  const filteredTodos = todos.filter((t) => {
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  const pendingCount = todos.filter((t) => !t.isCompleted).length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const totalCount = todos.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Auto-scroll selected item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, filteredTodos.length]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Instant Close on Ctrl+Q or Ctrl+W
      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q' || e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // If user is currently typing in the inline input
      if (isAddingNew) {
        if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
          e.preventDefault();
          setIsAddingNew(false);
          setNewText('');
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddNew();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          setNewPriority((prev) => (prev === 'normal' ? 'high' : prev === 'high' ? 'low' : 'normal'));
          return;
        }
        return;
      }

      // --- NORMAL HUD NAVIGATION MODE ---
      if (e.key === 'Escape' || (e.ctrlKey && e.key === '[') || e.key === 'q') {
        e.preventDefault();
        handleClose();
        return;
      }

      // j / ArrowDown -> next task
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(Math.max(0, filteredTodos.length - 1), prev + 1));
        return;
      }

      // k / ArrowUp -> previous task
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      // x / Space / Enter -> Toggle complete
      if (e.key === 'x' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const target = filteredTodos[selectedIndex];
        if (target) {
          handleToggle(target.id);
        }
        return;
      }

      // e -> Toggle accordion detail
      if (e.key === 'e') {
        e.preventDefault();
        const target = filteredTodos[selectedIndex];
        if (target) {
          setExpandedTodoId((prev) => (prev === target.id ? null : target.id));
        }
        return;
      }

      // o / n -> Quick Add inline
      if (e.key === 'o' || e.key === 'n') {
        e.preventDefault();
        setIsAddingNew(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 30);
        return;
      }

      // d -> Delete task
      if (e.key === 'd') {
        e.preventDefault();
        const target = filteredTodos[selectedIndex];
        if (target) {
          handleDelete(target.id);
        }
        return;
      }

      // Tab -> Cycle filter
      if (e.key === 'Tab') {
        e.preventDefault();
        setFilter((prev) => (prev === 'all' ? 'pending' : prev === 'pending' ? 'completed' : 'all'));
        setSelectedIndex(0);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isAddingNew, filteredTodos, selectedIndex, newText, newPriority]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950 p-2 select-none overflow-hidden font-sans drag-region">
      <div className="w-full h-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col justify-between relative overflow-hidden">
        {/* Glow Ambient Effect */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="p-3.5 pb-2 border-b border-slate-800/80 no-drag-region">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Bugünün Görevleri</h3>
                  <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Alt+Shift+M
                  </kbd>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span>{todayDateString}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Progress Pill */}
              <div className="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono font-bold flex items-center space-x-1.5">
                <span className="text-emerald-400">{completedCount}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-300">{totalCount}</span>
                <span className="text-[10px] text-slate-400 font-sans">(%{completionPct})</span>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Kapat (q / Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-1 mt-2.5 overflow-hidden border border-slate-800/60">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/40"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* Filter Pills & Add Button */}
          <div className="flex items-center justify-between mt-2.5 pt-1 text-[11px]">
            <div className="flex items-center space-x-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  setFilter('all');
                  setSelectedIndex(0);
                }}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filter === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tümü ({totalCount})
              </button>
              <button
                onClick={() => {
                  setFilter('pending');
                  setSelectedIndex(0);
                }}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filter === 'pending' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Yapılacak ({pendingCount})
              </button>
              <button
                onClick={() => {
                  setFilter('completed');
                  setSelectedIndex(0);
                }}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filter === 'completed' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tamamlandı ({completedCount})
              </button>
            </div>

            <button
              onClick={() => {
                setIsAddingNew(true);
                setTimeout(() => inputRef.current?.focus(), 30);
              }}
              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center space-x-1 transition-all shadow-sm"
              title="Yeni Görev Ekle (Kısayol: 'o')"
            >
              <Plus className="h-3 w-3" />
              <span>Ekle (o)</span>
            </button>
          </div>
        </div>

        {/* Inline Add Input Drawer */}
        {isAddingNew && (
          <div className="px-3.5 py-2 bg-slate-950 border-b border-brand-500/30 flex items-center space-x-2 no-drag-region animate-in slide-in-from-top-2 duration-150">
            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Yeni görevi yazın... (Enter: Ekle, Tab: Öncelik, Esc: İptal)"
              className="flex-1 bg-slate-900 border border-brand-500/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              onClick={() =>
                setNewPriority((prev) => (prev === 'normal' ? 'high' : prev === 'high' ? 'low' : 'normal'))
              }
              className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                newPriority === 'high'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : newPriority === 'low'
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-brand-500/20 text-brand-300 border-brand-500/40'
              }`}
            >
              {newPriority === 'high' ? 'Yüksek 🔥' : newPriority === 'low' ? 'Düşük' : 'Normal'}
            </button>
            <button
              onClick={handleAddNew}
              disabled={!newText.trim()}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewText('');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Task List (Scrollable) */}
        <div
          ref={listContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar no-drag-region"
        >
          {filteredTodos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Sparkles className="h-8 w-8 text-slate-600 mb-2 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-400">
                {filter === 'completed'
                  ? 'Henüz tamamlanan görev yok.'
                  : filter === 'pending'
                  ? 'Harika! Bekleyen tüm görevleri tamamladınız.'
                  : 'Bugün için henüz görev eklenmedi.'}
              </p>
              <button
                onClick={() => {
                  setIsAddingNew(true);
                  setTimeout(() => inputRef.current?.focus(), 30);
                }}
                className="mt-3 text-xs text-brand-400 hover:text-brand-300 underline font-medium flex items-center space-x-1"
              >
                <span>Hemen görev ekle</span>
                <kbd className="font-mono text-[10px] bg-slate-800 px-1 py-0.5 rounded border border-slate-700">o</kbd>
              </button>
            </div>
          ) : (
            filteredTodos.map((todo, idx) => {
              const isSelected = idx === selectedIndex;
              const isExpanded = expandedTodoId === todo.id;

              return (
                <div
                  key={todo.id}
                  ref={(el) => (itemRefs.current[idx] = el)}
                  onClick={() => setSelectedIndex(idx)}
                  className={`group rounded-xl border transition-all text-xs select-none ${
                    isSelected
                      ? 'bg-slate-800/90 border-brand-500/80 shadow-md ring-1 ring-brand-500/30'
                      : 'bg-slate-950/50 border-slate-800/70 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="p-2.5 flex items-start space-x-2.5">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(todo.id);
                      }}
                      className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none flex-shrink-0"
                      title="Tamamla (x veya Space)"
                    >
                      {todo.isCompleted ? (
                        <div className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-600 hover:border-emerald-400 flex items-center justify-center transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-0.5">
                        {/* Priority Badge */}
                        {todo.priority === 'high' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-0.5">
                            <Flame className="h-2.5 w-2.5" />
                            <span>Yüksek</span>
                          </span>
                        )}
                        {todo.priority === 'low' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Düşük
                          </span>
                        )}

                        {/* Text */}
                        <span
                          className={`font-medium transition-all break-words ${
                            todo.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {todo.text}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTodoId((prev) => (prev === todo.id ? null : todo.id));
                        }}
                        className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-700/50 transition-colors"
                        title="Detay (e)"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(todo.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Sil (d)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Accordion Detail Drawer */}
                  {isExpanded && (
                    <div className="px-3 pb-2.5 pt-1 border-t border-slate-800/80 bg-slate-950/60 rounded-b-xl text-[11px] text-slate-400 space-y-1 animate-in fade-in duration-150">
                      <div className="whitespace-pre-wrap break-words text-slate-300 py-1">{todo.text}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                        <span>Oluşturulma: {new Date(todo.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {todo.completedAt && (
                          <span className="text-emerald-500">
                            Tamamlanma: {new Date(todo.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Live Vim Shortcut Hints */}
        <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/80 no-drag-region flex items-center justify-between text-[10px] text-slate-400 font-sans">
          <div className="flex items-center space-x-2">
            <span>
              <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">j/k</kbd> Gezin
            </span>
            <span>
              <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">x / Space</kbd> Tikle
            </span>
            <span>
              <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">e</kbd> Detay
            </span>
            <span>
              <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">o</kbd> Ekle
            </span>
            <span>
              <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Tab</kbd> Filtre
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span>
              <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">d</kbd> Sil
            </span>
            <span>
              <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">q / Esc</kbd> Kapat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};