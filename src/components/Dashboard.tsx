import React, { useState } from 'react';
import { Code2, Award, Flame, Play, Clock, TrendingUp } from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';
import { DailyStats, DeepFocusState, WindowInfo } from '../types';
import { formatDuration, getScoreColor } from '../utils/timeUtils';
import { LiveTrackerBar } from './LiveTrackerBar';
import { DigitalDeskClock } from './DigitalDeskClock';

interface DashboardProps {
  stats: DailyStats;
  currentWindow: WindowInfo | null;
  deepFocus: DeepFocusState;
  onStartDeepFocus: (minutes: number, sessionName: string) => void;
  onStopDeepFocus: () => void;
  onOpenReport: () => void;
  onToggleMiniMode?: () => void;
  onToggleZenMode?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  currentWindow,
  deepFocus,
  onStartDeepFocus,
  onStopDeepFocus,
  onOpenReport,
  onToggleMiniMode,
  onToggleZenMode,
}) => {
  const [quickMinutes, setQuickMinutes] = useState(25);
  const [sessionTitle] = useState('Yazılım Geliştirme');

  const totalTrackedSeconds = stats.productiveSeconds + stats.youtubeSeconds + stats.otherSeconds;
  const productivePct = totalTrackedSeconds > 0 ? Math.round((stats.productiveSeconds / totalTrackedSeconds) * 100) : 0;
  const youtubePct = totalTrackedSeconds > 0 ? Math.round((stats.youtubeSeconds / totalTrackedSeconds) * 100) : 0;
  const otherPct = totalTrackedSeconds > 0 ? Math.max(0, 100 - productivePct - youtubePct) : 0;

  const scoreTheme = getScoreColor(stats.focusScore);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Interactive Digital Desk Clock & Live Counter */}
      <DigitalDeskClock
        stats={stats}
        currentWindow={currentWindow}
        deepFocus={deepFocus}
        onToggleMiniMode={onToggleMiniMode}
        onToggleZenMode={onToggleZenMode}
      />

      {/* Real-time active window banner */}
      <LiveTrackerBar currentWindow={currentWindow} />

      {/* Hero Stats Grid (Responsive 1 -> 2 -> 4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* YouTube Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden shadow-sm group hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">YouTube Süresi</span>
            <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <YoutubeIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {formatDuration(stats.youtubeSeconds)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
            <span>Mesai içi dikkat süresi</span>
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/30">
            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${Math.min(100, (stats.youtubeSeconds / 3600) * 100)}%` }} />
          </div>
        </div>

        {/* Productive Coding Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden shadow-sm group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kodlama & İş</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Code2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {formatDuration(stats.productiveSeconds)}
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 inline" />
            <span>Cloud Code / Antigravity / IDE</span>
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/30">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, (stats.productiveSeconds / (7 * 3600)) * 100)}%` }} />
          </div>
        </div>

        {/* Focus Score Card */}
        <div className={`bg-slate-900/80 border ${scoreTheme.border} rounded-2xl p-3.5 sm:p-4 relative overflow-hidden shadow-sm`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Odak Skoru</span>
            <div className={`h-7 w-7 rounded-lg ${scoreTheme.bg} ${scoreTheme.text} flex items-center justify-center border ${scoreTheme.border}`}>
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${scoreTheme.text}`}>
            %{stats.focusScore}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.focusScore >= 85 ? 'Harika derin akış seviyesi 🚀' : stats.focusScore >= 70 ? 'İyi seviyede, mola zamanı ☕' : 'YouTube uyarısı devrede 🎯'}
          </p>
        </div>

        {/* Idle Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Boşta / Mola</span>
            <div className="h-7 w-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {formatDuration(stats.idleSeconds)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Klavye/fare hareketsizliği
          </p>
        </div>
      </div>

      {/* Ratio breakdown bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-sm font-semibold text-white">Günün Zaman Dağılımı</h3>
            <p className="text-xs text-slate-400">Mesai saatleri içindeki aktif odak oranı</p>
          </div>
          <button
            onClick={onOpenReport}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>Detaylı Raporu Gör</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="h-3.5 sm:h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${productivePct}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Üretken Kodlama: %${productivePct}`}
          />
          <div
            style={{ width: `${youtubePct}%` }}
            className="bg-rose-500 h-full transition-all duration-500"
            title={`YouTube: %${youtubePct}`}
          />
          <div
            style={{ width: `${otherPct}%` }}
            className="bg-slate-600 h-full transition-all duration-500"
            title={`Diğer İşler: %${otherPct}`}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400 pt-1">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span>Kodlama & Araçlar (%{productivePct})</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 flex-shrink-0" />
            <span>YouTube (%{youtubePct})</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600 flex-shrink-0" />
            <span>Diğer Sistem / Tarayıcı (%{otherPct})</span>
          </div>
        </div>
      </div>

      {/* Quick Deep Focus Launcher */}
      <div className="bg-gradient-to-r from-brand-950/70 via-slate-900 to-indigo-950/70 border border-brand-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-white">Derin Odak (Custom Pomodoro)</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-lg">
              Süresini kendin belirle. Oturum esnasında YouTube açıldığında anında uyarı veya koruma kalkanı devreye girer.
            </p>
          </div>

          {deepFocus.isActive ? (
            <div className="flex items-center justify-between sm:justify-end space-x-3 w-full md:w-auto">
              <div className="text-left sm:text-right">
                <span className="text-[10px] sm:text-[11px] text-amber-400 font-semibold uppercase tracking-wider block">Kalan Süre</span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                  {Math.floor(deepFocus.remainingSeconds / 60)}:
                  {String(deepFocus.remainingSeconds % 60).padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={onStopDeepFocus}
                className="bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-lg shadow-rose-600/30 transition-colors"
              >
                Oturumu Bitir
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex bg-slate-950/70 p-1 rounded-xl border border-slate-800 flex-1 sm:flex-initial justify-between">
                {[15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => setQuickMinutes(m)}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      quickMinutes === m
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m} dk
                  </button>
                ))}
              </div>

              <button
                onClick={() => onStartDeepFocus(quickMinutes, sessionTitle)}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-1.5"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Odak Başlat ({quickMinutes} dk)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
