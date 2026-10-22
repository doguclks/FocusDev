import React, { useState, useEffect } from 'react';
import { WindowInfo } from '../types';
import { Pin, X, Maximize2 } from 'lucide-react';
import { SmoothDigit } from './SmoothDigit';

interface ZenClockWidgetProps {
  currentWindow: WindowInfo | null;
  isPinned: boolean;
  onTogglePin: () => void;
  onExpand: () => void;
}

export const ZenClockWidget: React.FC<ZenClockWidgetProps> = ({
  currentWindow,
  isPinned,
  onTogglePin,
  onExpand,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const secondsNum = time.getSeconds();

  const isYouTube = currentWindow?.isYouTube ?? false;
  const isProductive = currentWindow?.isProductive ?? false;

  const glowColor = isYouTube
    ? 'rgba(239, 68, 68, 0.35)'
    : isProductive
    ? 'rgba(16, 185, 129, 0.35)'
    : 'rgba(139, 92, 246, 0.25)';

  const borderHighlight = isYouTube
    ? 'border-rose-500/70 shadow-rose-950/60'
    : isProductive
    ? 'border-emerald-500/70 shadow-emerald-950/60'
    : 'border-brand-500/50 shadow-slate-950/60';

  return (
    <div
      className={`h-screen w-screen relative flex flex-col justify-between p-3 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-900 text-slate-100 select-none overflow-hidden border ${borderHighlight} rounded-2xl transition-all duration-300`}
      style={{
        boxShadow: `0 10px 30px -5px ${glowColor}, inset 0 0 25px ${glowColor}`,
      }}
    >
      {/* Floating Ambient Glow */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl pointer-events-none animate-pulse-glow"
        style={{ backgroundColor: glowColor }}
      />

      {/* Top Drag Bar (Drag Region for window movement) */}
      <div className="flex items-center justify-between z-10 w-full drag-region pb-1 border-b border-slate-800/60">
        {/* Status Dot & Live Label */}
        <div className="flex items-center space-x-1.5 no-drag-region">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isYouTube ? 'bg-rose-400' : isProductive ? 'bg-emerald-400' : 'bg-brand-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isYouTube ? 'bg-rose-500' : isProductive ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
            />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold truncate max-w-[140px]">
            {isYouTube
              ? 'YouTube Sayaç'
              : isProductive
              ? 'Kodlama'
              : 'Focus Dev'}
          </span>
        </div>

        {/* Action Buttons (Explicitly no-drag so clicks ALWAYS register!) */}
        <div className="flex items-center space-x-1 no-drag-region">
          {/* Always on top Pin button */}
          <button
            onClick={onTogglePin}
            title={isPinned ? 'Sabitlemeyi Kaldır' : 'Her Zaman Üstte Tut (Pin)'}
            className={`p-1 rounded-md text-[10px] transition-colors ${
              isPinned
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Pin className={`h-3 w-3 ${isPinned ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Expand to Dashboard */}
          <button
            onClick={onExpand}
            title="Dashboard Ekranını Aç (Tam Ekran)"
            className="p-1 rounded-md bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 transition-colors flex items-center space-x-0.5"
          >
            <Maximize2 className="h-3 w-3" />
          </button>

          {/* Close / Send to tray */}
          <button
            onClick={() => window.electronAPI?.closeToTray()}
            title="Sistem Tepsisine Gönder"
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Center Digital Clock Area (no-drag-region + click expands to Dashboard) */}
      <div
        onClick={onExpand}
        title="Dashboard Ekranına Genişletmek İçin Tıklayın"
        className="no-drag-region cursor-pointer flex-1 flex items-center justify-center space-x-1 my-auto z-10 hover:scale-[1.02] transition-transform duration-200"
      >
        {/* Hours */}
        <div className="flex items-center font-mono font-black text-4xl sm:text-5xl text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]">
          <SmoothDigit value={hours[0]} />
          <SmoothDigit value={hours[1]} />
        </div>

        {/* Pulsing Colon */}
        <span className="text-3xl sm:text-4xl font-mono font-bold text-brand-400/80 animate-pulse pb-1 select-none">
          :
        </span>

        {/* Minutes */}
        <div className="flex items-center font-mono font-black text-4xl sm:text-5xl text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]">
          <SmoothDigit value={minutes[0]} />
          <SmoothDigit value={minutes[1]} />
        </div>

        {/* Pulsing Colon */}
        <span className="text-3xl sm:text-4xl font-mono font-bold text-brand-400/80 animate-pulse pb-1 select-none">
          :
        </span>

        {/* Smooth Digits Seconds (e.g. 5 to 6 glides softly into place) */}
        <div className={`flex items-center font-mono font-black text-4xl sm:text-5xl ${
          isYouTube
            ? 'text-rose-400 drop-shadow-[0_0_16px_rgba(244,63,94,0.5)]'
            : isProductive
            ? 'text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.5)]'
            : 'text-brand-300 drop-shadow-[0_0_16px_rgba(167,139,250,0.4)]'
        }`}>
          <SmoothDigit value={seconds[0]} />
          <SmoothDigit value={seconds[1]} />
        </div>
      </div>

      {/* Bottom Bar: 60s Flow Bar + Click Hint (no-drag-region) */}
      <div
        onClick={onExpand}
        title="Dashboard Ekranına Genişletmek İçin Tıklayın"
        className="no-drag-region cursor-pointer z-10 flex flex-col space-y-1 pt-1"
      >
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isYouTube
                ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                : isProductive
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                : 'bg-brand-500 shadow-[0_0_8px_#8b5cf6]'
            }`}
            style={{ width: `${(secondsNum / 60) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span className="text-brand-400/90 hover:text-brand-300 transition-colors font-medium flex items-center space-x-1">
            <span>⛶ Dashboard'a Dön</span>
          </span>
          <span>{secondsNum}s</span>
        </div>
      </div>
    </div>
  );
};
