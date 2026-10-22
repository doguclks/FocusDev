import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, CheckCircle2, Circle, Plus, Trash2, Mic, MicOff,
  Sparkles, Pin, Search, Tag, ArrowRight, ArrowLeft, RotateCcw,
  BookOpen, ListTodo, Keyboard, FileText, ChevronDown, ChevronRight, Copy, Check
} from 'lucide-react';
import { DailyTodo, DailyLog, GeneralNote, DailyStats } from '../types';
import { formatDuration } from '../utils/timeUtils';
import { VimCheatSheetModal } from './VimCheatSheetModal';

interface NotesViewProps {
  stats: DailyStats;
}

export const NotesView: React.FC<NotesViewProps> = ({ stats }) => {
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'general'>('daily');
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  // Daily Todos & Log state
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'normal' | 'high' | 'low'>('normal');
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    date: currentDate,
    content: '',
    updatedAt: '',
  });
  const [selectedTodoIndex, setSelectedTodoIndex] = useState<number>(0);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState('');
  const [expandedTodoIds, setExpandedTodoIds] = useState<Set<string>>(new Set());
  const [copiedTodoId, setCopiedTodoId] = useState<string | null>(null);

  // Derived pending & completed todos
  const pendingTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);
  const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  const toggleExpandTodo = (id: string) => {
    setExpandedTodoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyTodoText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTodoId(id);
    setTimeout(() => setCopiedTodoId(null), 2000);
  };

  // General Notes state
  const [generalNotes, setGeneralNotes] = useState<GeneralNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(0);

  // Vim & Voice Recognition state
  const [vimMode, setVimMode] = useState<'NORMAL' | 'INSERT' | 'RECORDING'>('NORMAL');
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<'todo' | 'log' | 'note'>('todo');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [rolloverToast, setRolloverToast] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dailyLogTextareaRef = useRef<HTMLTextAreaElement>(null);
  const noteContentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Today key
  const todayKey = new Date().toISOString().split('T')[0];
  const isToday = currentDate === todayKey;

  // Load Todos & Log when date changes
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getTodosByDate(currentDate).then((data) => {
        setTodos(data || []);
        setSelectedTodoIndex(0);
      });
      window.electronAPI.getDailyLog(currentDate).then((log) => {
        if (log) setDailyLog(log);
      });
    }
  }, [currentDate]);

  // Listen for realtime updates from Quick Capture
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    if (window.electronAPI?.onTodosChanged) {
      unsubs.push(
        window.electronAPI.onTodosChanged((newTodo: any) => {
          if (newTodo.date === currentDate) {
            setTodos((prev) => {
              if (prev.some((t) => t.id === newTodo.id)) return prev;
              return [...prev, newTodo];
            });
          }
        })
      );
    }

    if (window.electronAPI?.onDailyLogChanged) {
      unsubs.push(
        window.electronAPI.onDailyLogChanged((log: any) => {
          if (log.date === currentDate) {
            setDailyLog(log);
          }
        })
      );
    }

    if (window.electronAPI?.onNotesChanged) {
      unsubs.push(
        window.electronAPI.onNotesChanged((newNote: any) => {
          setGeneralNotes((prev) => {
            if (prev.some((n) => n.id === newNote.id)) return prev;
            return [newNote, ...prev];
          });
        })
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [currentDate]);

  // Load General Notes
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getGeneralNotes().then((notes) => {
        setGeneralNotes(notes || []);
        if (notes && notes.length > 0 && !selectedNoteId) {
          setSelectedNoteId(notes[0].id);
        }
      });
    }
  }, []);

  // Initialize Speech Recognition fallback (in browser environment without Electron)
  useEffect(() => {
    if ((window as any).electronAPI) return; // In Electron app, native Windows Voice Typing (Win + H) is used
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript.trim()) {
          if (voiceTarget === 'todo') {
            setNewTodoText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else if (voiceTarget === 'log') {
            setDailyLog((prev) => ({
              ...prev,
              content: prev.content ? `${prev.content}\n${transcript}` : transcript,
            }));
          } else if (voiceTarget === 'note') {
            setGeneralNotes((prev) =>
              prev.map((n) =>
                n.id === selectedNoteId ? { ...n, content: n.content ? `${n.content}\n${transcript}` : transcript } : n
              )
            );
          }
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('WebSpeech note:', err?.error);
      };

      recognitionRef.current = recognition;
    }
  }, [voiceTarget, selectedNoteId]);

  const toggleVoice = (target: 'todo' | 'log' | 'note' = 'todo') => {
    setVoiceTarget(target);

    if (isListening) {
      setIsListening(false);
      setVimMode('NORMAL');
      try {
        recognitionRef.current?.stop();
      } catch {}
      return;
    }

    // 1. Immediately focus the target input/textarea so typing lands in the right field
    if (target === 'todo') {
      newTodoInputRef.current?.focus();
    } else if (target === 'log') {
      dailyLogTextareaRef.current?.focus();
    } else if (target === 'note') {
      noteContentTextareaRef.current?.focus();
    }

    // 2. Set active recording mode & visual feedback
    setIsListening(true);
    setVimMode('RECORDING');

    // 3. Trigger Windows Native Voice Typing (Win + H) after brief delay to assure input focus
    setTimeout(() => {
      if (target === 'todo') {
        newTodoInputRef.current?.focus();
      } else if (target === 'log') {
        dailyLogTextareaRef.current?.focus();
      } else if (target === 'note') {
        noteContentTextareaRef.current?.focus();
      }

      if (window.electronAPI?.triggerVoiceTyping) {
        window.electronAPI.triggerVoiceTyping();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }, 120);
  };

  // Vim Keyboard Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an active input/textarea
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      // Support both Escape and Vim's Ctrl + [
      const isEsc = e.key === 'Escape' || (e.ctrlKey && e.key === '[');

      if (isEsc) {
        e.preventDefault();
        if (isInput) {
          (activeEl as HTMLElement).blur();
        }
        setVimMode('NORMAL');
        setEditingTodoId(null);
        if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
        }
        setShowCheatSheet(false);
        return;
      }

      if (isInput) {
        setVimMode('INSERT');
        return;
      }

      // --- NORMAL MODE SHORTCUTS ---
      if (e.key === '?') {
        e.preventDefault();
        setShowCheatSheet((prev) => !prev);
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setActiveSubTab((prev) => (prev === 'daily' ? 'general' : 'daily'));
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setVimMode('INSERT');
        return;
      }

      if (e.key === 'v') {
        e.preventDefault();
        toggleVoice(activeSubTab === 'daily' ? 'todo' : 'note');
        return;
      }

      // Date navigation (h / l / t)
      if (activeSubTab === 'daily') {
        if (e.key === 'h' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handleShiftDate(-1);
          return;
        }
        if (e.key === 'l' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleShiftDate(1);
          return;
        }
        if (e.key === 't') {
          e.preventDefault();
          setCurrentDate(todayKey);
          return;
        }

        // Todos navigation (j / k)
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedTodoIndex((prev) => Math.min(Math.max(0, pendingTodos.length - 1), prev + 1));
          return;
        }
        if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedTodoIndex((prev) => Math.max(0, prev - 1));
          return;
        }

        // Toggle expand detail (Enter / Space)
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const target = pendingTodos[selectedTodoIndex];
          if (target) {
            toggleExpandTodo(target.id);
          }
          return;
        }

        // Toggle todo completion (x)
        if (e.key === 'x') {
          e.preventDefault();
          const target = pendingTodos[selectedTodoIndex];
          if (target) {
            handleToggleTodo(target.id);
          }
          return;
        }

        // Insert new todo (o)
        if (e.key === 'o') {
          e.preventDefault();
          newTodoInputRef.current?.focus();
          setVimMode('INSERT');
          return;
        }

        // Edit todo (i / e)
        if (e.key === 'i' || e.key === 'e') {
          e.preventDefault();
          const target = pendingTodos[selectedTodoIndex];
          if (target) {
            setEditingTodoId(target.id);
            setEditingTodoText(target.text);
            setVimMode('INSERT');
          }
          return;
        }

        // Delete todo (d)
        if (e.key === 'd') {
          e.preventDefault();
          const target = pendingTodos[selectedTodoIndex];
          if (target) {
            handleDeleteTodo(target.id);
          }
          return;
        }
      } else {
        // General Notes Navigation (j / k)
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIdx = Math.min(filteredNotes.length - 1, selectedNoteIndex + 1);
          setSelectedNoteIndex(nextIdx);
          if (filteredNotes[nextIdx]) {
            setSelectedNoteId(filteredNotes[nextIdx].id);
          }
          return;
        }
        if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIdx = Math.max(0, selectedNoteIndex - 1);
          setSelectedNoteIndex(prevIdx);
          if (filteredNotes[prevIdx]) {
            setSelectedNoteId(filteredNotes[prevIdx].id);
          }
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          noteContentTextareaRef.current?.focus();
          setVimMode('INSERT');
          return;
        }
        if (e.key === 'o') {
          e.preventDefault();
          handleCreateNote();
          return;
        }
        if (e.key === 'd') {
          e.preventDefault();
          if (selectedNoteId) {
            handleDeleteNote(selectedNoteId);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, todos, pendingTodos, selectedTodoIndex, filteredNotesMemo, selectedNoteIndex, selectedNoteId, isListening, todayKey, expandedTodoIds]);

  // Date Shift helper
  const handleShiftDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  // Add Todo
  const handleAddTodo = async () => {
    if (!newTodoText.trim() || !window.electronAPI) return;
    const created = await window.electronAPI.createTodo(currentDate, newTodoText.trim(), newTodoPriority);
    setTodos((prev) => [...prev, created]);
    setNewTodoText('');
    setVimMode('NORMAL');
    if (isListening) {
      setIsListening(false);
    }
  };

  // Toggle Todo
  const handleToggleTodo = async (id: string) => {
    if (!window.electronAPI) return;
    const updated = await window.electronAPI.toggleTodo(id);
    if (updated) {
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  // Delete Todo
  const handleDeleteTodo = async (id: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // Save edited todo
  const handleSaveEditTodo = async (id: string) => {
    if (!window.electronAPI || !editingTodoText.trim()) return;
    const updated = await window.electronAPI.updateTodo(id, editingTodoText.trim());
    if (updated) {
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    setEditingTodoId(null);
    setVimMode('NORMAL');
  };

  // Rollover Incomplete Todos
  const handleRollover = async () => {
    if (!window.electronAPI) return;
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const toDate = tomorrow.toISOString().split('T')[0];

    const count = await window.electronAPI.rolloverTodos(currentDate, toDate);
    if (count > 0) {
      setRolloverToast(`${count} tamamlanmamış görev ${toDate} tarihine başarıyla aktarıldı! 🚀`);
      setTimeout(() => setRolloverToast(null), 3500);
    } else {
      setRolloverToast('Aktarılacak tamamlanmamış görev bulunamadı.');
      setTimeout(() => setRolloverToast(null), 2500);
    }
  };

  // Save Daily Log
  const handleSaveDailyLog = async (content: string) => {
    setDailyLog((prev) => ({ ...prev, content }));
    if (window.electronAPI) {
      await window.electronAPI.saveDailyLog(currentDate, content);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    }
  };

  // Inject Focus Metrics into Daily Log
  const handleInjectMetrics = () => {
    const metricsSnippet = `\n\n### ⏱️ Focus Dev Mesai Özeti (${currentDate})
- 🟢 **Kodlama & Araçlar**: ${formatDuration(stats.productiveSeconds)}
- 🔴 **YouTube Süresi**: ${formatDuration(stats.youtubeSeconds)}
- 🎯 **Odak Skoru**: %${stats.focusScore}
- ⚪ **Boşta / Mola**: ${formatDuration(stats.idleSeconds)}
- ✅ **Tamamlanan Görev Sayısı**: ${todos.filter((t) => t.isCompleted).length} / ${todos.length}`;

    const updated = (dailyLog.content || '') + metricsSnippet;
    handleSaveDailyLog(updated);
  };

  // General Notes handlers
  const handleCreateNote = async () => {
    if (!window.electronAPI) return;
    const newNote = await window.electronAPI.createGeneralNote('Yeni Geliştirici Notu', '', selectedTag || '');
    setGeneralNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setVimMode('INSERT');
  };

  const handleUpdateNote = async (id: string, title: string, content: string, tags: string) => {
    if (!window.electronAPI) return;
    const updated = await window.electronAPI.updateGeneralNote(id, title, content, tags);
    if (updated) {
      setGeneralNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.deleteGeneralNote(id);
    const remaining = generalNotes.filter((n) => n.id !== id);
    setGeneralNotes(remaining);
    setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
  };

  const handleTogglePinNote = async (id: string) => {
    if (!window.electronAPI) return;
    const updated = await window.electronAPI.togglePinGeneralNote(id);
    if (updated) {
      setGeneralNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
  };

  // Filter notes
  const filteredNotes = generalNotes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? n.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  function filteredNotesMemo() {
    return filteredNotes;
  }

  const selectedNote = generalNotes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null;

  // Collect all unique tags
  const allTags = Array.from(new Set(generalNotes.flatMap((n) => n.tags || [])));

  return (
    <div className="space-y-4">
      {/* Top Bar: Subtabs + Date Navigator / Search + Vim Badge */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-sm">
        {/* Subtabs: Daily Flow vs Knowledge Hub */}
        <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'daily'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Günlük Akış (Daily)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('general')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'general'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Genel Notlar & Bilgi</span>
          </button>
        </div>

        {/* Date Navigator (if daily) or Search (if general) */}
        {activeSubTab === 'daily' ? (
          <div className="flex items-center space-x-2 justify-between sm:justify-end">
            <button
              onClick={() => handleShiftDate(-1)}
              title="Önceki Gün (Vim: h)"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
              <Calendar className="h-4 w-4 text-brand-400" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-semibold text-white focus:outline-none cursor-pointer"
              />
              {isToday && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Bugün
                </span>
              )}
            </div>

            <button
              onClick={() => handleShiftDate(1)}
              title="Sonraki Gün (Vim: l)"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </button>

            {!isToday && (
              <button
                onClick={() => setCurrentDate(todayKey)}
                title="Bugüne Dön (Vim: t)"
                className="text-xs bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 px-2.5 py-1.5 rounded-lg border border-brand-500/30 font-medium transition-colors"
              >
                Bugün (t)
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Notlarda ara... (Vim: /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
                    e.preventDefault();
                    (e.target as HTMLElement).blur();
                    setVimMode('NORMAL');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              onClick={handleCreateNote}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Yeni Not (o)</span>
            </button>
          </div>
        )}

        {/* Vim Status Badge & Cheat Sheet Trigger */}
        <div className="flex items-center space-x-2 justify-end">
          <div
            className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border flex items-center space-x-1 ${
              vimMode === 'RECORDING'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : vimMode === 'INSERT'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {vimMode === 'RECORDING' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping mr-1" />}
            <span>-- {vimMode} --</span>
          </div>

          <button
            onClick={() => setShowCheatSheet(true)}
            title="Vim Kısayolları Rehberi (Vim: ?)"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Rollover Notification Toast */}
      {rolloverToast && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-300 animate-in fade-in duration-200">
          <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{rolloverToast}</span>
        </div>
      )}

      {/* Voice Dictation Active Banner */}
      {isListening && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-3 flex items-center justify-between text-xs text-rose-200 animate-in fade-in duration-200 shadow-lg shadow-rose-950/50">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <p className="font-bold text-white flex items-center space-x-1.5">
                <span>🎙️ Sesle Yazma Aktif (Windows Sesle Yazma / Win + H)</span>
              </p>
              <p className="text-[11px] text-rose-300/90 mt-0.5">
                Mikrofonunuza konuşun; Türkçe kelimeler anında imlecin olduğu alana yazılacaktır.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsListening(false);
              setVimMode('NORMAL');
              try { recognitionRef.current?.stop(); } catch {}
            }}
            className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1.5 rounded-xl border border-rose-500/40 font-semibold transition-colors"
          >
            Tamamla (Esc)
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY DEV PLANNER & STANDUP                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (Todos & Tasks) - 7 cols on large screens */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Metrics & Progress Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">Günün Görev İlerlemesi</span>
                <span className="font-mono font-bold text-white">
                  {completedTodos.length}/{todos.length} ({completionRate}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Todo Input Area with Voice Button */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-sm flex items-center space-x-2">
              <input
                ref={newTodoInputRef}
                type="text"
                placeholder="Yeni bir görev ekle... (Vim: o tuşu)"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTodo();
                  if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
                    e.preventDefault();
                    (e.target as HTMLElement).blur();
                    setVimMode('NORMAL');
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              {/* Priority Selector */}
              <select
                value={newTodoPriority}
                onChange={(e: any) => setNewTodoPriority(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-[11px] text-slate-300 focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="high">Yüksek 🔥</option>
                <option value="low">Düşük</option>
              </select>

              {/* Voice-to-Text Button */}
              <button
                onClick={() => toggleVoice('todo')}
                title="Sesle Görev Söyle (Vim: v)"
                className={`p-2 rounded-xl border transition-all ${
                  isListening && voiceTarget === 'todo'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                {isListening && voiceTarget === 'todo' ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={handleAddTodo}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Incomplete Tasks List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Yapılacaklar ({pendingTodos.length})
                </span>
                {pendingTodos.length > 0 && (
                  <button
                    onClick={handleRollover}
                    title="Tamamlanmayan görevleri sonraki güne kopyala"
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Yarına Aktar (Rollover)</span>
                  </button>
                )}
              </div>

              {pendingTodos.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Henüz bir görev eklenmedi. Klavyeden <kbd className="text-slate-300 font-mono">o</kbd> tuşuna basarak hemen ekleyin.
                </div>
              ) : (
                pendingTodos.map((todo, idx) => {
                  const isSelected = selectedTodoIndex === idx;
                  const isEditing = editingTodoId === todo.id;
                  const isExpanded = expandedTodoIds.has(todo.id);

                  return (
                    <div
                      key={todo.id}
                      onClick={() => setSelectedTodoIndex(idx)}
                      className={`flex flex-col p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-brand-500/80 bg-brand-950/20 shadow-md ring-1 ring-brand-500/20'
                          : 'border-slate-800/80 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTodo(todo.id);
                            }}
                            className="text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                            title="Tamamlandı olarak işaretle (Vim: x)"
                          >
                            <Circle className="h-4 w-4" />
                          </button>

                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTodoText}
                              onChange={(e) => setEditingTodoText(e.target.value)}
                              onBlur={() => handleSaveEditTodo(todo.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditTodo(todo.id);
                                if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
                                  e.preventDefault();
                                  setEditingTodoId(null);
                                  setVimMode('NORMAL');
                                }
                              }}
                              autoFocus
                              className="flex-1 bg-slate-900 border border-brand-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <div
                              onClick={() => toggleExpandTodo(todo.id)}
                              className="flex items-center space-x-1.5 flex-1 min-w-0 cursor-pointer select-none"
                            >
                              <span
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTodoId(todo.id);
                                  setEditingTodoText(todo.text);
                                }}
                                className={`text-xs text-slate-200 font-medium ${
                                  isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
                                }`}
                                title="Detayı görüntülemek için tıkla (veya Vim: Space/Enter)"
                              >
                                {todo.text}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandTodo(todo.id);
                                }}
                                title={isExpanded ? "Detayı daralt (Space/Enter)" : "Detayı göster (Space/Enter)"}
                                className="text-slate-500 hover:text-brand-400 p-0.5 rounded transition-colors flex-shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-brand-400" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                          {todo.priority === 'high' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Önemli
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTodo(todo.id);
                            }}
                            title="Görevi Sil (Vim: d)"
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Detail View */}
                      {isExpanded && !isEditing && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
                            <div className="text-xs text-slate-100 whitespace-pre-wrap break-words font-sans leading-relaxed selection:bg-brand-500/30">
                              {todo.text}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                              <div className="flex items-center space-x-3">
                                <span className="font-mono text-[10px] text-slate-500">
                                  Eklenme: {new Date(todo.createdAt || Date.now()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                  todo.priority === 'high'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : todo.priority === 'low'
                                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                                    : 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                                }`}>
                                  {todo.priority === 'high' ? 'Yüksek 🔥' : todo.priority === 'low' ? 'Düşük' : 'Normal'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyTodoText(todo.id, todo.text);
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-[10px] transition-colors"
                                  title="Metni Panoya Kopyala"
                                >
                                  {copiedTodoId === todo.id ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-400" />
                                      <span className="text-emerald-400 font-semibold">Kopyalandı!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Kopyala</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTodoId(todo.id);
                                    setEditingTodoText(todo.text);
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 rounded-lg border border-brand-500/30 text-[10px] transition-colors"
                                  title="Görevi Düzenle (Vim: i)"
                                >
                                  <span>Düzenle (i)</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandTodo(todo.id);
                                  }}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 text-[10px] transition-colors"
                                  title="Daralt (Enter/Space)"
                                >
                                  Daralt
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Completed Tasks List */}
            {completedTodos.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 space-y-2 opacity-85">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Tamamlananlar ({completedTodos.length})
                </span>
                {completedTodos.map((todo) => {
                  const isExpanded = expandedTodoIds.has(todo.id);
                  return (
                    <div
                      key={todo.id}
                      className="p-2.5 rounded-xl bg-slate-950/30 border border-slate-800/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          onClick={() => toggleExpandTodo(todo.id)}
                          className="flex items-center space-x-2.5 flex-1 min-w-0 cursor-pointer select-none"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTodo(todo.id);
                            }}
                            className="text-emerald-400 hover:text-slate-400 transition-colors flex-shrink-0"
                            title="Geri al (tamamlanmadı yap)"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <span
                            className={`text-xs text-slate-400 line-through ${
                              isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'
                            }`}
                          >
                            {todo.text}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandTodo(todo.id);
                            }}
                            className="text-slate-600 hover:text-slate-400 p-0.5 flex-shrink-0"
                            title="Detayı aç/kapat"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTodo(todo.id);
                          }}
                          className="p-1 text-slate-600 hover:text-rose-400 rounded transition-colors ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-800/50 text-xs text-slate-400 whitespace-pre-wrap break-words font-sans bg-slate-950/50 p-2.5 rounded-lg space-y-1.5 animate-in fade-in duration-150">
                          <p>{todo.text}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px] font-mono text-slate-500">
                            {todo.completedAt ? (
                              <span>Tamamlandı: {new Date(todo.completedAt).toLocaleString('tr-TR')}</span>
                            ) : (
                              <span>Tarih: {todo.date}</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTodoText(todo.id, todo.text);
                              }}
                              className="text-brand-400 hover:text-brand-300"
                            >
                              {copiedTodoId === todo.id ? 'Kopyalandı!' : 'Metni Kopyala'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (Daily Standup Log & Metrics) - 5 cols on large screens */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-brand-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Günün Notu & Standup Özeti
                  </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleInjectMetrics}
                    title="Focus Dev çalışma sürelerini nota ekle"
                    className="text-[11px] bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 px-2 py-1 rounded-lg border border-brand-500/30 transition-colors flex items-center space-x-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Süreleri Ekle</span>
                  </button>

                  <button
                    onClick={() => toggleVoice('log')}
                    title="Sesle Standup Notu Yaz (Vim: v)"
                    className={`p-1.5 rounded-lg border transition-all ${
                      isListening && voiceTarget === 'log'
                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                ref={dailyLogTextareaRef}
                value={dailyLog.content}
                onChange={(e) => handleSaveDailyLog(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
                    e.preventDefault();
                    (e.target as HTMLElement).blur();
                    setVimMode('NORMAL');
                  }
                }}
                placeholder="Bugün neler yaptınız, nerede takıldınız? Notunuzu buraya yazın veya sesli dikte ile konuşun..."
                rows={14}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none font-mono"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                <span>{savedToast ? 'Otomatik kaydedildi ✓' : 'Her harfte SQLite\'a kaydedilir'}</span>
                <span>{dailyLog.content.length} karakter</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GENERAL NOTES & KNOWLEDGE HUB                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Notes List Column - 4 cols */}
          <div className="lg:col-span-4 space-y-3">
            {/* Tag Pills Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                    selectedTag === null ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors flex items-center space-x-1 ${
                      selectedTag === tag ? 'bg-brand-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Notes Cards */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-500">
                  Not bulunamadı. "Yeni Not" butonuna tıklayarak ilk genel notunuzu oluşturun.
                </div>
              ) : (
                filteredNotes.map((note, idx) => {
                  const isSelected = selectedNote?.id === note.id || selectedNoteIndex === idx;

                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        setSelectedNoteIndex(idx);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 bg-brand-950/20 shadow-md'
                          : 'border-slate-800/80 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white truncate max-w-[180px]">
                          {note.title || 'Başlıksız Not'}
                        </span>
                        {note.isPinned && (
                          <Pin className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {note.content || 'İçerik boş...'}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Note Editor Column - 8 cols */}
          <div className="lg:col-span-8">
            {selectedNote ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Title & Actions Bar */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) =>
                      handleUpdateNote(
                        selectedNote.id,
                        e.target.value,
                        selectedNote.content,
                        selectedNote.tags.join(',')
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
                        e.preventDefault();
                        (e.target as HTMLElement).blur();
                        setVimMode('NORMAL');
                      }
                    }}
                    placeholder="Not Başlığı..."
                    className="flex-1 bg-transparent text-base font-bold text-white focus:outline-none"
                  />

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleVoice('note')}
                      title="Sesle Nota Yaz (Vim: v)"
                      className={`p-2 rounded-xl border transition-all ${
                        isListening && voiceTarget === 'note'
                          ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                      }`}
                    >
                      <Mic className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleTogglePinNote(selectedNote.id)}
                      title={selectedNote.isPinned ? 'Sabitlemeyi Kaldır' : 'Başa Sabitle'}
                      className={`p-2 rounded-xl border transition-colors ${
                        selectedNote.isPinned
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      <Pin className={`h-4 w-4 ${selectedNote.isPinned ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      title="Notu Sil (Vim: d)"
                      className="p-2 bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tags input */}
                <div className="flex items-center space-x-2">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={selectedNote.tags.join(', ')}
                    onChange={(e) =>
                      handleUpdateNote(
                        selectedNote.id,
                        selectedNote.title,
                        selectedNote.content,
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
                        e.preventDefault();
                        (e.target as HTMLElement).blur();
                        setVimMode('NORMAL');
                      }
                    }}
                    placeholder="Etiketler (virgülle ayırın, örn: backend, docker, mimari)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Content Textarea */}
                <textarea
                  ref={noteContentTextareaRef}
                  value={selectedNote.content}
                  onChange={(e) =>
                    handleUpdateNote(
                      selectedNote.id,
                      selectedNote.title,
                      e.target.value,
                      selectedNote.tags.join(',')
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
                      e.preventDefault();
                      (e.target as HTMLElement).blur();
                      setVimMode('NORMAL');
                    }
                  }}
                  placeholder="Notunuzu Markdown formatında yazın..."
                  rows={16}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 resize-none font-mono"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>SQLite `focus_dev.db` veritabanında saklanır</span>
                  <span>Son güncelleme: {new Date(selectedNote.updatedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
                Lütfen sol taraftan bir not seçin veya yeni bir not oluşturun.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vim Cheat Sheet Modal */}
      <VimCheatSheetModal
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
      />
    </div>
  );
};
