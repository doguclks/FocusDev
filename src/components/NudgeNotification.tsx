import React from 'react';
import { Coffee, BookOpen, Check } from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';
import { NudgeEvent } from '../types';

interface NudgeNotificationProps {
  nudge: NudgeEvent | null;
  onDismiss: () => void;
  onSnooze: (mins: number) => void;
  onWhitelistVideo: (keyword: string) => void;
}

export const NudgeNotification: React.FC<NudgeNotificationProps> = ({
  nudge,
  onDismiss,
  onSnooze,
  onWhitelistVideo,
}) => {
  if (!nudge) return null;

  const minutesPassed = Math.round(nudge.consecutiveYouTubeSeconds / 60);

  const handleWhitelist = () => {
    // Extract a 2-word keyword from video title
    const words = nudge.videoTitle
      .replace(/ - YouTube.*/i, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    onWhitelistVideo(words || 'Egitim');
    onDismiss();
  };

  return (
    <div className="fixed bottom-6 right-6 max-w-md w-full bg-slate-900/95 border border-rose-500/40 rounded-2xl p-4 shadow-2xl shadow-rose-950/50 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start space-x-3.5">
        <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
          <YoutubeIcon className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Gentle Nudge • Dikkat Uyarısı
            </span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
              {minutesPassed} Dakikadır
            </span>
          </div>

          <h4 className="text-sm font-semibold text-white mt-1">
            YouTube'da vakit geçiriyorsun, kodun hazır mı? 🎯
          </h4>

          <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
            "{nudge.videoTitle.replace(/ - YouTube.*/i, '')}"
          </p>

          <div className="flex items-center space-x-2 mt-3.5">
            <button
              onClick={onDismiss}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Kapatıyorum 🚀</span>
            </button>

            <button
              onClick={() => onSnooze(5)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-1.5 px-2.5 rounded-lg flex items-center space-x-1 transition-colors border border-slate-700"
              title="5 dakika mola ver"
            >
              <Coffee className="h-3.5 w-3.5" />
              <span>+5 dk Mola</span>
            </button>

            <button
              onClick={handleWhitelist}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium py-1.5 px-2.5 rounded-lg flex items-center space-x-1 transition-colors border border-slate-700"
              title="Bu teknik/öğretici bir video, istisna say"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Eğitim</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
