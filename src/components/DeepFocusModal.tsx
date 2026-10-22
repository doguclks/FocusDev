import React, { useState } from 'react';
import { Flame, Play, Square, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DeepFocusState } from '../types';
import { formatTimeDigital } from '../utils/timeUtils';

interface DeepFocusModalProps {
  deepFocus: DeepFocusState;
  onStart: (minutes: number, sessionName: string) => void;
  onStop: () => void;
  violationTitle: string | null;
  onClearViolation: () => void;
}

export const DeepFocusModal: React.FC<DeepFocusModalProps> = ({
  deepFocus,
  onStart,
  onStop,
  violationTitle,
  onClearViolation,
}) => {
  const [customMinutes, setCustomMinutes] = useState(25);
  const [taskName, setTaskName] = useState('Antigravity Kod Geliştirme');

  const presets = [15, 25, 45, 60, 90];

  const totalSecs = (deepFocus.totalDurationMinutes || customMinutes) * 60;
  const currentRemaining = deepFocus.isActive ? deepFocus.remainingSeconds : customMinutes * 60;
  const progressPercent = deepFocus.isActive
    ? Math.max(0, Math.min(100, ((totalSecs - currentRemaining) / totalSecs) * 100))
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Violation Alert Banner if YouTube was opened */}
      {violationTitle && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center space-x-3 text-rose-300">
            <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Derin Odak Koruma Kalkanı Devrede! 🛡️
              </p>
              <p className="text-xs text-rose-200 mt-0.5 truncate max-w-md">
                Oturum esnasında YouTube algılandı: "{violationTitle.replace(/ - YouTube.*/i, '')}"
              </p>
            </div>
          </div>
          <button
            onClick={onClearViolation}
            className="text-xs bg-rose-500 hover:bg-rose-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto"
          >
            Anladım, Kapatıyorum
          </button>
        </div>
      )}

      {/* Main Focus Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Glow ambient background */}
        <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          deepFocus.isActive ? 'bg-amber-500/15' : 'bg-brand-500/10'
        }`} />

        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
          <Flame className={`h-4 w-4 ${deepFocus.isActive ? 'animate-pulse text-amber-400' : 'text-slate-400'}`} />
          <span>{deepFocus.isActive ? deepFocus.sessionName : 'Özelleştirilmiş Pomodoro'}</span>
        </div>

        {/* Circular / Digital Countdown */}
        <div className="my-4 sm:my-6 relative flex items-center justify-center">
          <svg className="w-52 h-52 sm:w-64 sm:h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="112"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r="112"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 112}
              strokeDashoffset={2 * Math.PI * 112 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                deepFocus.isActive ? 'text-amber-500' : 'text-brand-500'
              }`}
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white drop-shadow-md">
              {formatTimeDigital(currentRemaining)}
            </span>
            <span className="text-xs text-slate-400 mt-2 font-medium">
              {deepFocus.isActive ? `%${Math.round(progressPercent)} Tamamlandı` : 'Hedef Süre'}
            </span>
          </div>
        </div>

        {/* Setup Controls (if inactive) */}
        {!deepFocus.isActive ? (
          <div className="w-full space-y-4 sm:space-y-5">
            {/* Task Name input */}
            <div className="w-full">
              <label className="text-xs font-medium text-slate-300 block text-left mb-1.5">
                Oturum Hedefi / Görev Adı:
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Örn: Cloud Code ile API Refactoring"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {presets.map((m) => (
                <button
                  key={m}
                  onClick={() => setCustomMinutes(m)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    customMinutes === m
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {m} dk
                </button>
              ))}
            </div>

            {/* Slider for custom minute selection */}
            <div className="space-y-1.5 px-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Özel Süre Seçimi</span>
                <span className="font-mono text-white font-semibold">{customMinutes} Dakika</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Start Button */}
            <button
              onClick={() => onStart(customMinutes, taskName || 'Derin Odak')}
              className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Derin Odak Oturumunu Başlat ({customMinutes} Dakika)</span>
            </button>
          </div>
        ) : (
          /* Active Controls */
          <div className="space-y-4 w-full">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-around text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>YouTube Kalkanı Aktif</span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                <span>Bildirimler Sessizde</span>
              </div>
            </div>

            <button
              onClick={onStop}
              className="w-full bg-rose-600/90 hover:bg-rose-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <Square className="h-4 w-4 fill-white" />
              <span>Oturumu Sonlandır</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
