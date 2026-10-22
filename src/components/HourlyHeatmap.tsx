import React from 'react';
import { DailyStats } from '../types';
import { formatDuration, formatHourBadge } from '../utils/timeUtils';
import { BarChart2, AlertCircle, Sparkles } from 'lucide-react';

interface HourlyHeatmapProps {
  stats: DailyStats;
  workStartHour?: number;
  workEndHour?: number;
}

export const HourlyHeatmap: React.FC<HourlyHeatmapProps> = ({
  stats,
  workStartHour = 9,
  workEndHour = 18,
}) => {
  // Generate list of hours 9..18
  const hours: number[] = [];
  for (let h = workStartHour; h <= workEndHour; h++) {
    hours.push(h);
  }

  // Find max YouTube distraction hour and max productive hour
  let peakDistractionHour = -1;
  let maxYouTubeSecs = 0;
  let peakProductiveHour = -1;
  let maxProductiveSecs = 0;

  hours.forEach((h) => {
    const hStat = stats.hourly[h];
    if (hStat) {
      if (hStat.youtubeSeconds > maxYouTubeSecs) {
        maxYouTubeSecs = hStat.youtubeSeconds;
        peakDistractionHour = h;
      }
      if (hStat.productiveSeconds > maxProductiveSecs) {
        maxProductiveSecs = hStat.productiveSeconds;
        peakProductiveHour = h;
      }
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Insights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
            <BarChart2 className="h-5 w-5 text-brand-400 flex-shrink-0" />
            <span>Mesai Saatleri Analizi (09:00 - 18:00)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Günün her saati için kodlama süresi ve YouTube dikkat dağınıklığı dağılımı
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
            <span>Kodlama</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded bg-rose-500" />
            <span>YouTube</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded bg-slate-700" />
            <span>Diğer</span>
          </div>
        </div>
      </div>

      {/* Hourly Bars Matrix (Scrollable container on very narrow widths so columns are always readable) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm overflow-x-auto">
        <div className="min-w-[540px] grid grid-cols-10 gap-2 sm:gap-3">
          {hours.map((h) => {
            const hStat = stats.hourly[h] || { youtubeSeconds: 0, productiveSeconds: 0, otherSeconds: 0 };
            const total = hStat.productiveSeconds + hStat.youtubeSeconds + hStat.otherSeconds;
            const productivePct = Math.min(100, Math.round((hStat.productiveSeconds / 3600) * 100));
            const youtubePct = Math.min(100, Math.round((hStat.youtubeSeconds / 3600) * 100));
            const otherPct = Math.min(100, Math.round((hStat.otherSeconds / 3600) * 100));

            const isPeakYt = h === peakDistractionHour && maxYouTubeSecs > 180;
            const isPeakProd = h === peakProductiveHour && maxProductiveSecs > 600;

            return (
              <div
                key={h}
                className={`flex flex-col items-center bg-slate-950/60 rounded-xl p-2 sm:p-2.5 border transition-all ${
                  isPeakYt
                    ? 'border-rose-500/50 bg-rose-950/10 shadow-sm'
                    : isPeakProd
                    ? 'border-emerald-500/50 bg-emerald-950/10 shadow-sm'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Hour Label */}
                <span className="text-[11px] font-mono font-semibold text-slate-300">
                  {formatHourBadge(h)}
                </span>

                {/* Vertical Stacked Bar Chart */}
                <div className="h-32 sm:h-40 w-full max-w-[28px] bg-slate-900 rounded-lg flex flex-col-reverse p-1 my-2 border border-slate-800 relative overflow-hidden">
                  {/* Productive green block */}
                  <div
                    style={{ height: `${productivePct}%` }}
                    className="w-full bg-emerald-500 rounded-sm transition-all duration-300"
                    title={`${h}:00 - Kodlama: ${formatDuration(hStat.productiveSeconds)}`}
                  />

                  {/* YouTube red block */}
                  <div
                    style={{ height: `${youtubePct}%` }}
                    className="w-full bg-rose-500 rounded-sm transition-all duration-300 mt-0.5"
                    title={`${h}:00 - YouTube: ${formatDuration(hStat.youtubeSeconds)}`}
                  />

                  {/* Other gray block */}
                  <div
                    style={{ height: `${otherPct}%` }}
                    className="w-full bg-slate-700 rounded-sm transition-all duration-300 mt-0.5"
                    title={`${h}:00 - Diğer: ${formatDuration(hStat.otherSeconds)}`}
                  />
                </div>

                {/* Subtext info */}
                <div className="text-center w-full">
                  {hStat.productiveSeconds > 0 ? (
                    <span className="text-[10px] font-mono text-emerald-400 block truncate">
                      {Math.round(hStat.productiveSeconds / 60)}d
                    </span>
                  ) : null}

                  {hStat.youtubeSeconds > 0 ? (
                    <span className="text-[10px] font-mono text-rose-400 block truncate font-medium">
                      {Math.round(hStat.youtubeSeconds / 60)}d YT
                    </span>
                  ) : null}

                  {total === 0 && (
                    <span className="text-[10px] text-slate-600 block">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {peakProductiveHour !== -1 && maxProductiveSecs > 0 ? (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Zirve Kodlama Saati</span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                Saat {formatHourBadge(peakProductiveHour)} ({formatDuration(maxProductiveSecs)})
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Bugünün en derin ve kesintisiz geliştirme performansı bu saat aralığında gerçekleşti.
              </p>
            </div>
          </div>
        ) : null}

        {peakDistractionHour !== -1 && maxYouTubeSecs > 180 ? (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Dikkat Dağılma Pik Noktası</span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                Saat {formatHourBadge(peakDistractionHour)} ({formatDuration(maxYouTubeSecs)})
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Bu saatte YouTube izleme eğilimi arttı. Bu saatlerde derin odak başlatmanızı öneririz.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
