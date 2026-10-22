import React from 'react';
import { Code2, Monitor, Moon } from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';
import { WindowInfo } from '../types';

interface LiveTrackerBarProps {
  currentWindow: WindowInfo | null;
}

export const LiveTrackerBar: React.FC<LiveTrackerBarProps> = ({ currentWindow }) => {
  if (!currentWindow) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
        <span>Masaüstü izleyici başlatılıyor...</span>
      </div>
    );
  }

  const { title, processName, isYouTube, isProductive, isIdle } = currentWindow;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
      <div className="flex items-center space-x-2.5 sm:space-x-3 overflow-hidden min-w-0 flex-1">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isYouTube
            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            : isProductive
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : isIdle
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {isYouTube ? (
            <YoutubeIcon className="h-4 w-4" />
          ) : isProductive ? (
            <Code2 className="h-4 w-4" />
          ) : isIdle ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </div>

        <div className="overflow-hidden min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">
              {processName || 'Aktif Pencere'}
            </span>
            <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-medium flex-shrink-0 ${
              isYouTube
                ? 'bg-rose-500/20 text-rose-300'
                : isProductive
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {isYouTube ? 'Dikkat Dağıtan' : isProductive ? 'Üretken Kodlama' : 'Diğer'}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200 truncate mt-0.5" title={title || ''}>
            {title || 'Pencere başlığı bekleniyor...'}
          </p>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center flex-shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-3">
        <span className="text-[10px] sm:text-[11px] text-slate-400">Odak Durumu</span>
        <span className={`text-xs font-bold ${
          isYouTube ? 'text-rose-400' : isProductive ? 'text-emerald-400' : 'text-slate-300'
        }`}>
          {isYouTube ? 'YouTube Sayacı Aktif' : isProductive ? 'Derin Akış' : 'Beklemede'}
        </span>
      </div>
    </div>
  );
};
