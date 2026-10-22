import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DeepFocusModal } from './components/DeepFocusModal';
import { HourlyHeatmap } from './components/HourlyHeatmap';
import { SettingsView } from './components/SettingsView';
import { DailyReportModal } from './components/DailyReportModal';
import { NudgeNotification } from './components/NudgeNotification';
import { MiniDeskClockWidget } from './components/MiniDeskClockWidget';
import { ZenClockWidget } from './components/ZenClockWidget';
import { NotesView } from './components/NotesView';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { QuickTasksModal } from './components/QuickTasksModal';
import { WindowInfo, DailyStats, AppSettings, DeepFocusState, NudgeEvent, ViewMode } from './types';

const INITIAL_STATS: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  youtubeSeconds: 0,
  productiveSeconds: 0,
  otherSeconds: 0,
  idleSeconds: 0,
  focusScore: 100,
  hourly: {},
};

const INITIAL_SETTINGS: AppSettings = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  nudgeThresholdMinutes: 5,
  deepFocusBlockLevel: 'soft',
  trackWeekends: false,
  whitelistKeywords: ['tutorial', 'ders', 'egitim', 'docker', 'course', 'lofi'],
};

const INITIAL_DEEP_FOCUS: DeepFocusState = {
  isActive: false,
  totalDurationMinutes: 0,
  remainingSeconds: 0,
  startTime: null,
  targetEndTime: null,
  sessionName: '',
};

export const App: React.FC = () => {
  const isQuickCapture =
    window.location.search.includes('quickCapture=1') ||
    window.location.hash === '#quick-capture';

  if (isQuickCapture) {
    return <QuickCaptureModal />;
  }

  const isQuickTasks =
    window.location.search.includes('quickTasks=1') ||
    window.location.hash === '#quick-tasks';

  if (isQuickTasks) {
    return <QuickTasksModal />;
  }

  const [activeTab, setActiveTab] = useState<'dashboard' | 'deepfocus' | 'analytics' | 'notes' | 'settings'>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [isPinned, setIsPinned] = useState(false);
  const [currentWindow, setCurrentWindow] = useState<WindowInfo | null>(null);
  const [stats, setStats] = useState<DailyStats>(INITIAL_STATS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [deepFocus, setDeepFocus] = useState<DeepFocusState>(INITIAL_DEEP_FOCUS);
  const [nudgeAlert, setNudgeAlert] = useState<NudgeEvent | null>(null);
  const [violationTitle, setViolationTitle] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Load initial data & wire electron events
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getTodayStats().then((data) => {
        if (data) setStats(data);
      });

      window.electronAPI.getSettings().then((data) => {
        if (data) setSettings(data);
      });

      window.electronAPI.getViewState().then((state) => {
        if (state) {
          setViewMode(state.mode);
          setIsPinned(state.isPinned);
        }
      });

      const unsubWindow = window.electronAPI.onWindowUpdate((info) => {
        setCurrentWindow(info);
        // Refresh today stats smoothly
        window.electronAPI?.getTodayStats().then((data) => {
          if (data) setStats(data);
        });
      });

      const unsubNudge = window.electronAPI.onNudgeAlert((event) => {
        setNudgeAlert(event);
      });

      const unsubDeepFocus = window.electronAPI.onDeepFocusTick((state) => {
        setDeepFocus(state);
      });

      const unsubViolation = window.electronAPI.onDeepFocusViolation((title) => {
        setViolationTitle(title);
      });

      return () => {
        unsubWindow();
        unsubNudge();
        unsubDeepFocus();
        unsubViolation();
      };
    } else {
      // Demo / browser mockup fallback
      const timer = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          productiveSeconds: prev.productiveSeconds + 1,
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  const handleStartDeepFocus = (minutes: number, sessionName: string) => {
    if (window.electronAPI) {
      window.electronAPI.startDeepFocus(minutes, sessionName);
    } else {
      setDeepFocus({
        isActive: true,
        totalDurationMinutes: minutes,
        remainingSeconds: minutes * 60,
        startTime: Date.now(),
        targetEndTime: Date.now() + minutes * 60 * 1000,
        sessionName,
      });
    }
    setActiveTab('deepfocus');
  };

  const handleStopDeepFocus = () => {
    if (window.electronAPI) {
      window.electronAPI.stopDeepFocus();
    } else {
      setDeepFocus(INITIAL_DEEP_FOCUS);
    }
    setViolationTitle(null);
  };

  const handleSnoozeNudge = (mins: number) => {
    if (window.electronAPI) {
      window.electronAPI.snoozeNudge(mins);
    }
    setNudgeAlert(null);
  };

  const handleSetMode = async (targetMode: ViewMode) => {
    if (window.electronAPI) {
      const res = await window.electronAPI.setViewMode(targetMode);
      setViewMode(res.mode);
      setIsPinned(res.isPinned);
    } else {
      setViewMode(targetMode);
    }
  };

  const handleTogglePin = async () => {
    if (window.electronAPI) {
      const pinned = await window.electronAPI.togglePin();
      setIsPinned(pinned);
    } else {
      setIsPinned((prev) => !prev);
    }
  };

  const handleWhitelistVideo = (kw: string) => {
    const updated = {
      ...settings,
      whitelistKeywords: [...settings.whitelistKeywords, kw.toLowerCase()],
    };
    handleSaveSettings(updated);
  };

  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    if (window.electronAPI) {
      window.electronAPI.updateSettings(newSettings).then((saved) => {
        setSettings(saved);
      });
    } else {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    }
  };

  if (viewMode === 'zen') {
    return (
      <ZenClockWidget
        currentWindow={currentWindow}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        onExpand={() => handleSetMode('full')}
      />
    );
  }

  if (viewMode === 'widget') {
    return (
      <MiniDeskClockWidget
        stats={stats}
        currentWindow={currentWindow}
        deepFocus={deepFocus}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        onExpand={() => handleSetMode('full')}
        onSwitchToZen={() => handleSetMode('zen')}
        onStartDeepFocus={handleStartDeepFocus}
        onStopDeepFocus={handleStopDeepFocus}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentWindow={currentWindow}
        deepFocus={deepFocus}
        onOpenReport={() => setShowReportModal(true)}
        onToggleMiniMode={() => handleSetMode('widget')}
        onToggleZenMode={() => handleSetMode('zen')}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 max-w-6xl w-full mx-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            currentWindow={currentWindow}
            deepFocus={deepFocus}
            onStartDeepFocus={handleStartDeepFocus}
            onStopDeepFocus={handleStopDeepFocus}
            onOpenReport={() => setShowReportModal(true)}
            onToggleMiniMode={() => handleSetMode('widget')}
            onToggleZenMode={() => handleSetMode('zen')}
          />
        )}

        {activeTab === 'deepfocus' && (
          <DeepFocusModal
            deepFocus={deepFocus}
            onStart={handleStartDeepFocus}
            onStop={handleStopDeepFocus}
            violationTitle={violationTitle}
            onClearViolation={() => setViolationTitle(null)}
          />
        )}

        {activeTab === 'analytics' && (
          <HourlyHeatmap
            stats={stats}
            workStartHour={Number(settings.workStartTime.split(':')[0]) || 9}
            workEndHour={Number(settings.workEndTime.split(':')[0]) || 18}
          />
        )}

        {activeTab === 'notes' && (
          <NotesView stats={stats} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSave={handleSaveSettings}
          />
        )}
      </main>

      {/* Gentle Nudge Toast */}
      <NudgeNotification
        nudge={nudgeAlert}
        onDismiss={() => setNudgeAlert(null)}
        onSnooze={handleSnoozeNudge}
        onWhitelistVideo={handleWhitelistVideo}
      />

      {/* Daily Report Modal (09:00 - 18:00 summary) */}
      <DailyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        stats={stats}
      />
    </div>
  );
};
