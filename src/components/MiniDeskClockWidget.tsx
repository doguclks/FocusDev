import React, { useState, useEffect } from 'react';
import { DailyStats, WindowInfo, DeepFocusState } from '../types';
import { YoutubeIcon } from './YoutubeIcon';
import { Code2, Clock, Flame, Pin, Maximize2, Minus, X, Play, Square, Activity, Sparkles } from 'lucide-react';
import { SmoothDigit } from './SmoothDigit';

interface MiniDeskClockWidgetProps {
  stats: DailyStats;
  currentWindow: WindowInfo | null;
  deepFocus: DeepFocusState;
  isPinned: boolean;
  onTogglePin: () => void;
  onExpand: () => void;
  onSwitchToZen?: () => void;
  onStartDeepFocus: (minutes: number, sessionName: string) => void;
  onStopDeepFocus: () => void;
}

type MiniMode = 'clock' | 'youtube' | 'coding' | 'pomodoro';

export const MiniDeskClockWidget: React.FC<MiniDeskClockWidgetProps> = ({
  stats,
  currentWindow,
  deepFocus,
  isPinned,
  onTogglePin,
  onExpand,
  onSwitchToZen,
  onStartDeepFocus,
  onStopDeepFocus,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeMode, setActiveMode] = useState<MiniMode>('clock');

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

  // Format Pomodoro timer
  const pomoMinutes = String(Math.floor(deepFocus.remainingSeconds / 60)).padStart(2, '0');
  const pomoSeconds = String(deepFocus.remainingSeconds % 60).padStart(2, '0');

  const isYouTube = currentWindow?.isYouTube ?? false;
  const isProductive = currentWindow?.isProductive ?? false;

  let displayH = hours;
  let displayM = minutes;
  let displayS = seconds;
  let modeTitle = 'Masa Saati';

  if (activeMode === 'youtube') {
    displayH = ytHours;
    displayM = ytMinutes;
    displayS = ytSeconds;
    modeTitle = 'YouTube Sayacı';
  } else if (activeMode === 'coding') {
    displayH = codeHours;
    displayM = codeMinutes;
    displayS = codeSeconds;
    modeTitle = 'Kodlama Sayacı';
  } else if (activeMode === 'pomodoro') {
    displayH = '00';
    displayM = pomoMinutes;
    displayS = pomoSeconds;
    modeTitle = 'Derin Odak';
  }

  const glowColor = isYouTube
    ? 'rgba(239, 68, 68, 0.3)'
    : isProductive
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(139, 92, 246, 0.25)';

  const borderHighlight = isYouTube
    ? 'border-rose-500/60 shadow-rose-950/50'
    : isProductive
    ? 'border-emerald-500/60 shadow-emerald-950/50'
    : 'border-slate-800 shadow-slate-950/50';

  return (
    <div
      className={`h-screen w-screen flex flex-col justify-between p-3.5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 select-none overflow-hidden border ${borderHighlight} transition-all duration-300 drag-region`}
      style={{
        boxShadow: `inset 0 0 40px ${glowColor}`,
      }}
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-1.5 no-drag-region">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isYouTube ? 'bg-rose-400' : isProductive ? 'bg-emerald-400' : 'bg-brand-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isYouTube ? 'bg-rose-500' : isProductive ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold text-white tracking-tight">Focus Dev</span>
          <span className="text-[10px] text-slate-400 font-mono">Mini</span>
        </div>

        {/* Window action buttons */}
        <div className="flex items-center space-x-1 no-drag-region">
          {/* Always on top Pin button */}
          <button
            onClick={onTogglePin}
            title={isPinned ? 'Sabitlemeyi Kaldır' : 'Her Zaman Üstte Tut (Pin)'}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isPinned
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Switch to Zen Clock */}
          {onSwitchToZen && (
            <button
              onClick={onSwitchToZen}
              title="Saf Masa Saati Modu (Sadece Saat)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Expand to Full Dashboard */}
          <button
            onClick={onExpand}
            title="Tam Boyut Dashboard Moduna Dön"
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => window.electronAPI?.minimizeWindow()}
            title="Simge Durumuna Küçült"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => window.electronAPI?.closeToTray()}
            title="Sistem Tepsisine Gönder"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between bg-slate-950/80 p-1 rounded-xl border border-slate-800 my-1 no-drag-region">
        <button
          onClick={() => setActiveMode('clock')}
          className={`flex-1 flex items-center justify-center py-1 rounded-lg text-[11px] font-medium transition-all ${
            activeMode === 'clock'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Güncel Saat"
        >
          <Clock className="h-3 w-3 mr-1" />
          <span>Saat</span>
        </button>

        <button
          onClick={() => setActiveMode('youtube')}
          className={`flex-1 flex items-center justify-center py-1 rounded-lg text-[11px] font-medium transition-all ${
            activeMode === 'youtube'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="YouTube Sayacı"
        >
          <YoutubeIcon className="h-3 w-3 mr-1" />
          <span>YT</span>
        </button>

        <button
          onClick={() => setActiveMode('coding')}
          className={`flex-1 flex items-center justify-center py-1 rounded-lg text-[11px] font-medium transition-all ${
            activeMode === 'coding'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Kodlama Sayacı"
        >
          <Code2 className="h-3 w-3 mr-1" />
          <span>Kod</span>
        </button>

        <button
          onClick={() => setActiveMode('pomodoro')}
          className={`flex-1 flex items-center justify-center py-1 rounded-lg text-[11px] font-medium transition-all ${
            activeMode === 'pomodoro'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Derin Odak / Pomodoro"
        >
          <Flame className="h-3 w-3 mr-1" />
          <span>Odak</span>
        </button>
      </div>

      {/* Centerpiece Digital Clock Display */}
      <div className="flex flex-col items-center justify-center my-2 bg-slate-950/80 rounded-2xl border border-slate-800/90 py-3.5 px-2 relative overflow-hidden">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold mb-1">
          {modeTitle}
        </span>

        {/* LED Digital Display */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center text-4xl font-mono font-black tracking-tight text-white drop-shadow-md">
            <SmoothDigit value={displayH[0]} />
            <SmoothDigit value={displayH[1]} />
          </div>
          <span className="text-3xl font-mono font-bold text-brand-400/80 animate-pulse pb-1">
            :
          </span>
          <div className="flex items-center text-4xl font-mono font-black tracking-tight text-white drop-shadow-md">
            <SmoothDigit value={displayM[0]} />
            <SmoothDigit value={displayM[1]} />
          </div>
          <span className="text-3xl font-mono font-bold text-brand-400/80 animate-pulse pb-1">
            :
          </span>
          <div className={`flex items-center text-4xl font-mono font-black tracking-tight ${
            isYouTube
              ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : isProductive
              ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'text-brand-300 drop-shadow-[0_0_12px_rgba(167,139,250,0.3)]'
          }`}>
            <SmoothDigit value={displayS[0]} />
            <SmoothDigit value={displayS[1]} />
          </div>
        </div>

        {/* Seconds Flow Bar */}
        <div className="w-full max-w-[240px] mt-2.5 px-2">
          <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isYouTube ? 'bg-rose-500' : isProductive ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
              style={{ width: `${(secondsNum / 60) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Active Status Banner */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1.5 truncate max-w-[200px]">
          <Activity className="h-3 w-3 text-brand-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-slate-300 truncate font-medium">
            {currentWindow?.isYouTube
              ? '🔴 YouTube İzleniyor'
              : currentWindow?.isProductive
              ? '🟢 Kodlama Aktif'
              : currentWindow?.title || 'Beklemede...'}
          </span>
        </div>

        <span className={`text-[10px] font-mono font-bold ${
          isYouTube ? 'text-rose-400' : isProductive ? 'text-emerald-400' : 'text-slate-400'
        }`}>
          {isYouTube ? 'Sayaç +' : isProductive ? 'Akış +' : '09-18'}
        </span>
      </div>

      {/* Quick Action Footer */}
      <div className="pt-1 no-drag-region">
        {deepFocus.isActive ? (
          <button
            onClick={onStopDeepFocus}
            className="w-full bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-rose-600/20"
          >
            <Square className="h-3.5 w-3.5 fill-white" />
            <span>Odak Bitir ({Math.floor(deepFocus.remainingSeconds / 60)}m)</span>
          </button>
        ) : (
          <button
            onClick={() => onStartDeepFocus(25, 'Hızlı Derin Odak')}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-brand-600/20"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>25 dk Derin Odak Başlat</span>
          </button>
        )}
      </div>
    </div>
  );
};
