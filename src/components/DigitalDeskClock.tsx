import React, { useState, useEffect } from 'react';
import { DailyStats, WindowInfo, DeepFocusState } from '../types';
import { YoutubeIcon } from './YoutubeIcon';
import { Code2, Clock, Activity, Flame, Minimize2, Sparkles } from 'lucide-react';
import { SmoothDigit } from './SmoothDigit';

interface DigitalDeskClockProps {
  stats: DailyStats;
  currentWindow: WindowInfo | null;
  deepFocus: DeepFocusState;
  onToggleMiniMode?: () => void;
  onToggleZenMode?: () => void;
}

type DisplayMode = 'live-clock' | 'youtube-counter' | 'coding-counter';

export const DigitalDeskClock: React.FC<DigitalDeskClockProps> = ({
  stats,
  currentWindow,
  deepFocus,
  onToggleMiniMode,
  onToggleZenMode,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<DisplayMode>('live-clock');

  // Realtime live tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format real-time wall clock
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const secondsNum = currentTime.getSeconds();

  // Format YouTube timer
  const ytHours = String(Math.floor(stats.youtubeSeconds / 3600)).padStart(2, '0');
  const ytMinutes = String(Math.floor((stats.youtubeSeconds % 3600) / 60)).padStart(2, '0');
  const ytSeconds = String(stats.youtubeSeconds % 60).padStart(2, '0');

  // Format Coding timer
  const codeHours = String(Math.floor(stats.productiveSeconds / 3600)).padStart(2, '0');
  const codeMinutes = String(Math.floor((stats.productiveSeconds % 3600) / 60)).padStart(2, '0');
  const codeSeconds = String(stats.productiveSeconds % 60).padStart(2, '0');

  // Active status color schemes
  const isYouTube = currentWindow?.isYouTube ?? false;
  const isProductive = currentWindow?.isProductive ?? false;
  const isIdle = currentWindow?.isIdle ?? false;

  const glowColor = isYouTube
    ? 'rgba(239, 68, 68, 0.25)' // red glow
    : isProductive
    ? 'rgba(16, 185, 129, 0.25)' // green glow
    : isIdle
    ? 'rgba(245, 158, 11, 0.2)' // amber glow
    : 'rgba(139, 92, 246, 0.2)'; // purple/brand glow

  const borderColor = isYouTube
    ? 'border-rose-500/50'
    : isProductive
    ? 'border-emerald-500/50'
    : 'border-slate-800';

  // Work hours calculation (09:00 - 18:00)
  const nowH = currentTime.getHours();
  const nowM = currentTime.getMinutes();
  const currentWorkMinutes = Math.max(0, Math.min(9 * 60, (nowH - 9) * 60 + nowM));
  const workDayPercent = Math.round((currentWorkMinutes / (9 * 60)) * 100);

  // Active primary numbers according to displayMode
  let primaryH = hours;
  let primaryM = minutes;
  let primaryS = seconds;
  let modeBadge = 'Masa Saati';
  let badgeColor = 'bg-brand-500/20 text-brand-300 border-brand-500/40';

  if (displayMode === 'youtube-counter') {
    primaryH = ytHours;
    primaryM = ytMinutes;
    primaryS = ytSeconds;
    modeBadge = 'YouTube Sayacı';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if (displayMode === 'coding-counter') {
    primaryH = codeHours;
    primaryM = codeMinutes;
    primaryS = codeSeconds;
    modeBadge = 'Kodlama Sayacı';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border ${borderColor} p-4 sm:p-7 shadow-2xl transition-all duration-500 overflow-hidden`}
      style={{
        boxShadow: `0 20px 50px -10px ${glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
      }}
    >
      {/* Ambient background light beam */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: glowColor }}
      />

      {/* Top Header of the Clock */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 mb-4 sm:mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isYouTube
                    ? 'bg-rose-400'
                    : isProductive
                    ? 'bg-emerald-400'
                    : 'bg-brand-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 ${
                  isYouTube
                    ? 'bg-rose-500'
                    : isProductive
                    ? 'bg-emerald-500'
                    : 'bg-brand-500'
                }`}
              />
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-200">
              {isYouTube
                ? '🔴 YouTube İzleniyor'
                : isProductive
                ? '🟢 Kodlama Akışı'
                : isIdle
                ? '⚪ Boşta / Mola'
                : '🟣 Sistem Dinleniyor'}
            </span>
          </div>

          <span className={`text-[10px] sm:text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded-lg border ${badgeColor}`}>
            {modeBadge}
          </span>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setDisplayMode('live-clock')}
            className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center space-x-1 ${
              displayMode === 'live-clock'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Güncel Dijital Saat"
          >
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Saat</span>
          </button>

          <button
            onClick={() => setDisplayMode('youtube-counter')}
            className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center space-x-1 ${
              displayMode === 'youtube-counter'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="YouTube Sayacı"
          >
            <YoutubeIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>YT ({stats.youtubeSeconds}s)</span>
          </button>

          <button
            onClick={() => setDisplayMode('coding-counter')}
            className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center space-x-1 ${
              displayMode === 'coding-counter'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Kodlama Sayacı"
          >
            <Code2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Kod ({stats.productiveSeconds}s)</span>
          </button>

          {onToggleMiniMode && (
            <button
              onClick={onToggleMiniMode}
              className="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-all flex items-center justify-center space-x-1"
              title="Kare Mini Masa Saati Moduna Geç"
            >
              <Minimize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Kare Widget</span>
            </button>
          )}

          {onToggleZenMode && (
            <button
              onClick={onToggleZenMode}
              className="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center justify-center space-x-1"
              title="Saf Masa Saati Modu (Sadece Saat)"
            >
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Saf Saat</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Digital Desk Clock LED Display */}
      <div className="relative z-10 flex flex-col items-center justify-center my-2 sm:my-3">
        {/* Glow Numbers Container */}
        <div className="flex items-center space-x-1.5 sm:space-x-4 bg-slate-950/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl px-3 sm:px-8 py-3 sm:py-5 shadow-2xl backdrop-blur-md max-w-full">
          {/* Hours Card */}
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-5xl md:text-7xl font-mono font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.15)] select-none flex items-center">
              <SmoothDigit value={primaryH[0]} />
              <SmoothDigit value={primaryH[1]} />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5 sm:mt-1">
              Saat
            </span>
          </div>

          {/* Pulsing Colon Separator */}
          <div className="text-2xl sm:text-4xl md:text-6xl font-mono font-bold text-brand-400/80 animate-pulse pb-2 sm:pb-4 select-none">
            :
          </div>

          {/* Minutes Card */}
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-5xl md:text-7xl font-mono font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.15)] select-none flex items-center">
              <SmoothDigit value={primaryM[0]} />
              <SmoothDigit value={primaryM[1]} />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5 sm:mt-1">
              Dakika
            </span>
          </div>

          {/* Pulsing Colon Separator */}
          <div className="text-2xl sm:text-4xl md:text-6xl font-mono font-bold text-brand-400/80 animate-pulse pb-2 sm:pb-4 select-none">
            :
          </div>

          {/* Seconds Card (Glowing, animated) */}
          <div className="flex flex-col items-center">
            <div
              className={`text-3xl sm:text-5xl md:text-7xl font-mono font-black tracking-tight select-none flex items-center ${
                isYouTube
                  ? 'text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : isProductive
                  ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'text-brand-300 drop-shadow-[0_0_20px_rgba(167,139,250,0.3)]'
              }`}
            >
              <SmoothDigit value={primaryS[0]} />
              <SmoothDigit value={primaryS[1]} />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5 sm:mt-1">
              Saniye
            </span>
          </div>
        </div>

        {/* 60-Second Flow Bar (Smooth flowing progress) */}
        <div className="w-full max-w-xl mt-3 sm:mt-4 px-1 sm:px-2">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <Activity className="h-3 w-3 text-brand-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Canlı Akış</span>
            </span>
            <span>{secondsNum} / 60 sn</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isYouTube
                  ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                  : isProductive
                  ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                  : 'bg-brand-500 shadow-[0_0_10px_#8b5cf6]'
              }`}
              style={{ width: `${(secondsNum / 60) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Running Status Ticker (saatin altındaki dinamik bilgi şeridi) */}
      <div className="relative z-10 mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center space-x-2 truncate w-full sm:w-auto max-w-full sm:max-w-md">
          <span className="text-slate-500 font-medium flex-shrink-0">Algılanan:</span>
          <span className="text-slate-200 font-medium truncate">
            {currentWindow?.title || 'Ön plan penceresi bekleniyor...'}
          </span>
        </div>

        {/* Mesai Saati Durumu */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto flex-shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 text-[11px] sm:text-xs">Mesai (09:00 - 18:00):</span>
            <span className="font-mono text-white font-semibold text-[11px] sm:text-xs">%{workDayPercent}</span>
          </div>

          {deepFocus.isActive && (
            <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg">
              <Flame className="h-3 w-3 animate-pulse" />
              <span className="font-mono text-[10px] sm:text-[11px] font-bold">
                Odak: {Math.floor(deepFocus.remainingSeconds / 60)}:
                {String(deepFocus.remainingSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
