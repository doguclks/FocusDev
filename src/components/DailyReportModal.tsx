import React, { useState } from 'react';
import { X, Award, Code2, Copy, Check, Calendar } from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';
import { DailyStats } from '../types';
import { formatDuration } from '../utils/timeUtils';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DailyStats;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate grade
  let grade = 'A+';
  let gradeDesc = 'Mükemmel Odak';
  let gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  if (stats.focusScore < 70) {
    grade = 'C';
    gradeDesc = 'Dikkat Dağılması Yüksek';
    gradeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else if (stats.focusScore < 85) {
    grade = 'B+';
    gradeDesc = 'İyi Denge';
    gradeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }

  const handleCopyMarkdown = () => {
    const reportMd = `### 📊 FocusDev Günlük Odak Raporu (${stats.date})
- 🟢 **Kodlama & İş**: ${formatDuration(stats.productiveSeconds)}
- 🔴 **YouTube Süresi**: ${formatDuration(stats.youtubeSeconds)}
- 🎯 **Odak Skoru**: %${stats.focusScore} (Derece: ${grade})
- ⚪ **Boşta / Mola**: ${formatDuration(stats.idleSeconds)}
- 🕒 **Mesai Aralığı**: 09:00 - 18:00
*FocusDev ile kaydedildi.*`;

    navigator.clipboard.writeText(reportMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
          <Calendar className="h-4 w-4" />
          <span>Günlük Mühendis Raporu • {stats.date}</span>
        </div>

        <h3 className="text-xl font-bold text-white mt-1">
          09:00 - 18:00 Mesai Özeti
        </h3>

        {/* Score & Grade Banner */}
        <div className={`mt-5 p-4 rounded-2xl border ${gradeColor} flex items-center justify-between`}>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">Günün Odak Notu</span>
            <div className="text-3xl font-black font-mono tracking-tight mt-0.5">{grade}</div>
            <p className="text-xs opacity-90">{gradeDesc}</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold tracking-wider opacity-80">Odak Skoru</span>
            <div className="text-3xl font-black font-mono tracking-tight mt-0.5">%{stats.focusScore}</div>
            <p className="text-xs opacity-90">Verimlilik İndeksi</p>
          </div>
        </div>

        {/* Stats Table */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-2.5 text-xs text-slate-300">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Code2 className="h-4 w-4" />
              </div>
              <span className="font-medium">Kodlama & Geliştirme (Cloud Code / Antigravity / WebStorm)</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {formatDuration(stats.productiveSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-2.5 text-xs text-slate-300">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <YoutubeIcon className="h-4 w-4" />
              </div>
              <span className="font-medium">Mesai İçi YouTube Süresi</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              {formatDuration(stats.youtubeSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-2.5 text-xs text-slate-300">
              <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                <Award className="h-4 w-4" />
              </div>
              <span className="font-medium">Boşta / Mola Süresi</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {formatDuration(stats.idleSeconds)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center space-x-3">
          <button
            onClick={handleCopyMarkdown}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Rapor Kopyalandı!' : 'Markdown Olarak Kopyala'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-md shadow-brand-500/20"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
