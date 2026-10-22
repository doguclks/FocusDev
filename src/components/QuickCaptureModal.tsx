import React, { useState, useEffect, useRef } from 'react';
import { Zap, Check, X, Mic, MicOff, ListTodo, FileText, BookOpen } from 'lucide-react';

export const QuickCaptureModal: React.FC = () => {
  const [mode, setMode] = useState<'NORMAL' | 'INSERT'>('NORMAL');
  const modeRef = useRef<'NORMAL' | 'INSERT'>('NORMAL');

  const [text, setText] = useState('');
  const [target, setTarget] = useState<'todo' | 'log' | 'note'>('todo');
  const [priority, setPriority] = useState<'normal' | 'high' | 'low'>('normal');
  const [isSaved, setIsSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isSubmittingRef = useRef(false);

  const todayKey = new Date().toISOString().split('T')[0];

  const switchMode = (newMode: 'NORMAL' | 'INSERT') => {
    modeRef.current = newMode;
    setMode(newMode);
  };

  // Start in NORMAL mode, do NOT auto-focus input
  useEffect(() => {
    switchMode('NORMAL');
    inputRef.current?.blur();

    if (window.electronAPI?.onQuickCaptureFocus) {
      const unsub = window.electronAPI.onQuickCaptureFocus(() => {
        setText('');
        switchMode('NORMAL');
        setIsSaved(false);
        setIsListening(false);
        inputRef.current?.blur();
      });
      return unsub;
    }
  }, []);

  // WebSpeech API fallback (for browser testing environment)
  useEffect(() => {
    if ((window as any).electronAPI) return; // Native Win+H in Electron
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
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleClose = () => {
    window.electronAPI?.hideQuickCapture();
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}
      return;
    }

    switchMode('INSERT');
    setIsListening(true);
    inputRef.current?.focus();

    setTimeout(() => {
      inputRef.current?.focus();
      if (window.electronAPI?.triggerVoiceTyping) {
        window.electronAPI.triggerVoiceTyping();
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }, 120);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || !window.electronAPI || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setText('');
      if (target === 'todo') {
        await window.electronAPI.createTodo(todayKey, trimmed, priority);
      } else if (target === 'log') {
        const existing = await window.electronAPI.getDailyLog(todayKey);
        const newContent = existing?.content
          ? `${existing.content}\n- ${trimmed}`
          : `- ${trimmed}`;
        await window.electronAPI.saveDailyLog(todayKey, newContent);
      } else if (target === 'note') {
        await window.electronAPI.createGeneralNote(trimmed, '', 'hızlı-not');
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        switchMode('NORMAL');
        handleClose();
      }, 250);
    } catch (err) {
      console.error('Failed to quick-capture:', err);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Global Keyboard Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Universal Instant Cancel & Close: Ctrl + Q or Ctrl + W
      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q' || e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      const isInput = document.activeElement === inputRef.current;
      const isEsc = e.key === 'Escape' || (e.ctrlKey && e.key === '[');

      // If in INSERT mode: Esc or Ctrl + [ ONLY returns to NORMAL mode, never closes the window!
      if (modeRef.current === 'INSERT' || isInput) {
        if (isEsc) {
          e.preventDefault();
          e.stopPropagation();
          switchMode('NORMAL');
          inputRef.current?.blur();
          if (isListening) setIsListening(false);
          return;
        }
        return;
      }

      // --- NORMAL MODE SHORTCUTS ---
      // Close window on Esc, Ctrl+[, or q when strictly in NORMAL mode
      if (isEsc || e.key === 'q') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // 'o' or 'i' or 'a' -> Enter INSERT mode and focus input
      if (e.key === 'o' || e.key === 'i' || e.key === 'a') {
        e.preventDefault();
        switchMode('INSERT');
        setTimeout(() => {
          inputRef.current?.focus();
        }, 30);
        return;
      }

      // 'v' -> Voice typing
      if (e.key === 'v') {
        e.preventDefault();
        handleVoiceToggle();
        return;
      }

      // Target selection via numbers 1, 2, 3
      if (e.key === '1') {
        e.preventDefault();
        setTarget('todo');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        setTarget('log');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        setTarget('note');
        return;
      }

      // Target cycling via 't' or 'h' / 'l'
      if (e.key === 't' || e.key === 'l' || e.key === 'ArrowRight') {
        e.preventDefault();
        setTarget((prev) => (prev === 'todo' ? 'log' : prev === 'log' ? 'note' : 'todo'));
        return;
      }
      if (e.key === 'h' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setTarget((prev) => (prev === 'note' ? 'log' : prev === 'log' ? 'todo' : 'note'));
        return;
      }

      // Priority cycling via 'p' or 'Tab'
      if (e.key === 'p' || e.key === 'Tab') {
        e.preventDefault();
        if (target === 'todo') {
          setPriority((prev) => (prev === 'normal' ? 'high' : prev === 'high' ? 'low' : 'normal'));
        } else {
          setTarget((prev) => (prev === 'todo' ? 'log' : prev === 'log' ? 'note' : 'todo'));
        }
        return;
      }

      // Enter in NORMAL mode: save if text exists, else focus input
      if (e.key === 'Enter') {
        e.preventDefault();
        if (text.trim()) {
          handleSubmit();
        } else {
          switchMode('INSERT');
          setTimeout(() => {
            inputRef.current?.focus();
          }, 30);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [target, priority, text, isListening]);

  // Handler while inside the text input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl + Q or Ctrl + W instant close
    if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q' || e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      e.stopPropagation();
      handleClose();
      return;
    }

    if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
      e.preventDefault();
      e.stopPropagation();
      switchMode('NORMAL');
      inputRef.current?.blur();
      if (isListening) setIsListening(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (target === 'todo') {
        setPriority((prev) => (prev === 'normal' ? 'high' : prev === 'high' ? 'low' : 'normal'));
      } else {
        setTarget((prev) => (prev === 'todo' ? 'log' : prev === 'log' ? 'note' : 'todo'));
      }
      return;
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950 p-2 select-none overflow-hidden font-sans drag-region">
      <div className="w-full h-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 flex flex-col justify-between relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Bar: Title, Mode Indicator & Target Switchers */}
        <div className="flex items-center justify-between no-drag-region">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide flex items-center space-x-1.5">
              <span>Hızlı Yakalama</span>
            </span>

            {/* Vim Mode Badge */}
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border transition-all ${
                mode === 'NORMAL'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              }`}
            >
              {mode}
            </span>
          </div>

          {/* Target Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setTarget('todo')}
              className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center space-x-1 ${
                target === 'todo' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Kısayol: 1"
            >
              <ListTodo className="h-3 w-3" />
              <span><span className="text-[10px] text-brand-300 mr-0.5 font-mono">1:</span>Todo</span>
            </button>
            <button
              onClick={() => setTarget('log')}
              className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center space-x-1 ${
                target === 'log' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Kısayol: 2"
            >
              <FileText className="h-3 w-3" />
              <span><span className="text-[10px] text-brand-300 mr-0.5 font-mono">2:</span>Standup</span>
            </button>
            <button
              onClick={() => setTarget('note')}
              className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center space-x-1 ${
                target === 'note' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Kısayol: 3"
            >
              <BookOpen className="h-3 w-3" />
              <span><span className="text-[10px] text-brand-300 mr-0.5 font-mono">3:</span>Not</span>
            </button>
          </div>

          <button
            onClick={handleClose}
            className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            title="Kapat (Ctrl+Q / Esc / q)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Input Area */}
        <div className="my-1.5 relative flex items-center no-drag-region">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => switchMode('INSERT')}
            onKeyDown={handleInputKeyDown}
            placeholder={
              mode === 'NORMAL'
                ? "Yazmak için 'o' veya 'i'ye basın (Dikte: 'v', Hedef: 1-3/t)"
                : target === 'todo'
                ? 'Yeni görevi yazın... (Enter: Kaydet, Ctrl+[: Normal Mod)'
                : target === 'log'
                ? 'Standup notunu yazın... (Enter: Standup\'a ekle)'
                : 'Genel not yazın... (Enter: Kaydet)'
            }
            className={`w-full rounded-xl pl-3 pr-10 py-2.5 text-xs placeholder-slate-500 transition-all font-sans shadow-inner ${
              mode === 'INSERT'
                ? 'bg-slate-950 text-white border border-brand-500 ring-2 ring-brand-500/30'
                : 'bg-slate-950/70 text-slate-300 border border-slate-800 hover:border-slate-700 cursor-pointer'
            }`}
          />

          <button
            onClick={handleVoiceToggle}
            title={isListening ? 'Dikteyi Durdur' : "Sesli Dikte (Kısayol: 'v')"}
            className={`absolute right-2 p-1.5 rounded-lg border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-md shadow-rose-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Priority Pills & Action Buttons */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 no-drag-region">
          <div className="flex items-center space-x-2">
            {target === 'todo' && (
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-500 font-mono">Öncelik (p):</span>
                <button
                  onClick={() => setPriority('normal')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                    priority === 'normal'
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setPriority('high')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                    priority === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  Yüksek 🔥
                </button>
                <button
                  onClick={() => setPriority('low')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                    priority === 'low'
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  Düşük
                </button>
              </div>
            )}

            {target !== 'todo' && (
              <span className="text-[10px] text-slate-500">
                {target === 'log' ? 'Bugünün standup ajandasına madde olarak eklenir' : 'Genel not defterine (#hızlı-not) kaydedilir'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isSaved ? (
              <span className="text-emerald-400 font-bold flex items-center space-x-1 text-xs animate-in fade-in duration-150">
                <Check className="h-3.5 w-3.5" />
                <span>Kaydedildi!</span>
              </span>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  text.trim()
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="h-3 w-3" />
                <span>Ekle (Enter)</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer: Live Vim Shortcut Hints */}
        <div className="pt-1.5 border-t border-slate-800/80 no-drag-region">
          {mode === 'NORMAL' ? (
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <div className="flex items-center space-x-2">
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">o</kbd> Yaz
                </span>
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">v</kbd> Dikte
                </span>
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">1-3</kbd> Hedef
                </span>
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Tab</kbd>/<kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">p</kbd> Öncelik
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Enter</kbd> Kaydet
                </span>
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">q / Esc</kbd> Kapat
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Yazma Modu (INSERT)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Enter</kbd> Kaydet
                </span>
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Tab</kbd> Öncelik
                </span>
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Ctrl+[</kbd> Normal Mod
                </span>
                <span>
                  <kbd className="font-mono text-slate-300 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">Ctrl+Q</kbd> İptal
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};