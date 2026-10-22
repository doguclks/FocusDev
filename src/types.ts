export type ActivityCategory = 'youtube' | 'productive' | 'other' | 'idle';

export interface WindowInfo {
  title: string;
  processName: string;
  pid: number;
  category: ActivityCategory;
  isYouTube: boolean;
  isProductive: boolean;
  isIdle: boolean;
  timestamp: number;
}

export interface HourlyStat {
  hour: number;
  youtubeSeconds: number;
  productiveSeconds: number;
  otherSeconds: number;
}

export interface DailyStats {
  date: string;
  youtubeSeconds: number;
  productiveSeconds: number;
  otherSeconds: number;
  idleSeconds: number;
  focusScore: number;
  hourly: Record<number, HourlyStat>;
}

export interface AppSettings {
  workStartTime: string;
  workEndTime: string;
  nudgeThresholdMinutes: number;
  deepFocusBlockLevel: 'soft' | 'strict';
  trackWeekends: boolean;
  whitelistKeywords: string[];
}

export interface DeepFocusState {
  isActive: boolean;
  totalDurationMinutes: number;
  remainingSeconds: number;
  startTime: number | null;
  targetEndTime: number | null;
  sessionName: string;
}

export interface NudgeEvent {
  consecutiveYouTubeSeconds: number;
  thresholdMinutes: number;
  videoTitle: string;
  timestamp: number;
}

export type ViewMode = 'full' | 'widget' | 'zen';

export interface DailyTodo {
  id: string;
  date: string;
  text: string;
  isCompleted: boolean;
  completedAt?: string | null;
  priority: 'low' | 'normal' | 'high';
  orderIndex: number;
  createdAt: string;
}

export interface DailyLog {
  date: string;
  content: string;
  standupSummary?: string;
  updatedAt: string;
}

export interface GeneralNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IElectronAPI {
  onWindowUpdate: (callback: (info: WindowInfo) => void) => () => void;
  onNudgeAlert: (callback: (event: NudgeEvent) => void) => () => void;
  onDeepFocusTick: (callback: (state: DeepFocusState) => void) => () => void;
  onDeepFocusViolation: (callback: (title: string) => void) => () => void;
  getTodayStats: () => Promise<DailyStats>;
  getHistory: (days?: number) => Promise<DailyStats[]>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  startDeepFocus: (minutes: number, sessionName?: string) => Promise<DeepFocusState>;
  stopDeepFocus: () => Promise<DeepFocusState>;
  snoozeNudge: (minutes?: number) => Promise<void>;
  minimizeWindow: () => void;
  toggleMaximize: () => void;
  closeToTray: () => void;
  setViewMode: (mode: ViewMode) => Promise<{ mode: ViewMode; isPinned: boolean }>;
  togglePin: () => Promise<boolean>;
  getViewState: () => Promise<{ mode: ViewMode; isPinned: boolean }>;
  triggerVoiceTyping: () => Promise<boolean>;
  hideQuickCapture: () => Promise<void>;
  toggleQuickCapture: () => Promise<void>;
  onQuickCaptureFocus: (callback: () => void) => () => void;
  onTodosChanged: (callback: (todo: DailyTodo) => void) => () => void;
  onDailyLogChanged: (callback: (log: DailyLog) => void) => () => void;
  onNotesChanged: (callback: (note: GeneralNote) => void) => () => void;

  // --- SQLite Notes & Todos API ---
  getTodosByDate: (date: string) => Promise<DailyTodo[]>;
  createTodo: (date: string, text: string, priority?: string) => Promise<DailyTodo>;
  toggleTodo: (id: string) => Promise<DailyTodo | null>;
  updateTodo: (id: string, text: string, priority?: string) => Promise<DailyTodo | null>;
  deleteTodo: (id: string) => Promise<boolean>;
  rolloverTodos: (fromDate: string, toDate: string) => Promise<number>;

  getDailyLog: (date: string) => Promise<DailyLog>;
  saveDailyLog: (date: string, content: string, standupSummary?: string) => Promise<DailyLog>;

  getGeneralNotes: () => Promise<GeneralNote[]>;
  createGeneralNote: (title: string, content: string, tags?: string) => Promise<GeneralNote>;
  updateGeneralNote: (id: string, title: string, content: string, tags?: string) => Promise<GeneralNote | null>;
  deleteGeneralNote: (id: string) => Promise<boolean>;
  togglePinGeneralNote: (id: string) => Promise<GeneralNote | null>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
