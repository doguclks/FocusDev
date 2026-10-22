import React from 'react';
import { Flame, BarChart3, Settings, Minus, Square, X, Radio, Minimize2, Sparkles, FileText, BookOpen } from 'lucide-react';
import { WindowInfo, DeepFocusState } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'deepfocus' | 'analytics' | 'notes' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'deepfocus' | 'analytics' | 'notes' | 'settings') => void;
  currentWindow: WindowInfo | null;
  deepFocus: DeepFocusState;
  onOpenReport: () => void;
  onToggleMiniMode: () => void;
  onToggleZenMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentWindow,
  deepFocus,
  onOpenReport,
  onToggleMiniMode,
  onToggleZenMode,
}) => {
  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleToggleMaximize = () => {
    window.electronAPI?.toggleMaximize();
  };

  const handleCloseToTray = () => {
    window.electronAPI?.closeToTray();
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between gap-2 select-none drag-region">
      {/* Brand & Live status indicator */}
      <div className="flex items-center space-x-2.5 no-drag-region flex-shrink-0">
        <img
          src="./icon.png"
          alt="Focus Dev"
          className="h-7 w-7 rounded-lg shadow-md shadow-brand-500/20 object-cover border border-white/10 flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-white whitespace-nowrap">Focus Dev</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Pro
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-[10px] text-slate-400">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                currentWindow?.isYouTube ? 'bg-rose-400' : currentWindow?.isProductive ? 'bg-emerald-400' : 'bg-slate-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                currentWindow?.isYouTube ? 'bg-rose-500' : currentWindow?.isProductive ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </span>
            <span className="truncate max-w-[110px]">
              {currentWindow?.isYouTube
                ? 'YouTube'
                : currentWindow?.isProductive
                ? 'Kodlama'
                : 'Boşta'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Compact Icons on windowed/small screen, text on large screen) */}
      <nav className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 no-drag-region flex-shrink-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          title="Dashboard (Genel Bakış)"
          className={`flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="h-4 w-4 flex-shrink-0" />
          <span className="hidden xl:inline text-xs">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('deepfocus')}
          title="Derin Odak (Pomodoro & YouTube Engelleyici)"
          className={`relative flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'deepfocus'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Flame className={`h-4 w-4 flex-shrink-0 ${deepFocus.isActive ? 'text-amber-400 animate-pulse' : ''}`} />
          <span className="hidden xl:inline text-xs">Derin Odak</span>
          {deepFocus.isActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          title="Saatlik Analiz & Odak Metrikleri"
          className={`flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'analytics'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="h-4 w-4 flex-shrink-0" />
          <span className="hidden xl:inline text-xs">Saatlik Analiz</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          title="Notlar & Ajanda (Vim Kısayolları)"
          className={`flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'notes'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="h-4 w-4 flex-shrink-0" />
          <span className="hidden xl:inline text-xs">Notlar & Ajanda</span>
          <span className="hidden 2xl:inline text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-emerald-400 font-bold">
            Vim
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          title="Ayarlar & Yapılandırma"
          className={`flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          <span className="hidden xl:inline text-xs">Ayarlar</span>
        </button>
      </nav>

      {/* Action buttons & Window controls (Always on a single sleek row) */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 no-drag-region flex-shrink-0">
        <button
          onClick={onToggleZenMode}
          title="Saf Masa Saati Modu (Sadece Saat)"
          className="p-1.5 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 transition-colors flex items-center space-x-1"
        >
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden 2xl:inline text-xs font-medium">Saf Saat</span>
        </button>

        <button
          onClick={onToggleMiniMode}
          title="Kare Mini Widget Modu"
          className="p-1.5 text-xs bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 rounded-lg border border-brand-500/30 transition-colors flex items-center space-x-1"
        >
          <Minimize2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden 2xl:inline text-xs font-medium">Widget</span>
        </button>

        <button
          onClick={onOpenReport}
          title="Gün Sonu Raporu"
          className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/80 transition-colors flex items-center space-x-1"
        >
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden 2xl:inline text-xs font-medium">Rapor</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={handleMinimize}
          title="Simge Durumuna Küçült"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handleToggleMaximize}
          title="Ekranı Kapla / Geri Yükle"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <Square className="h-3 w-3" />
        </button>

        <button
          onClick={handleCloseToTray}
          title="Sistem Tepsisine Gönder (Arka Planda Çalışmaya Devam Eder)"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
