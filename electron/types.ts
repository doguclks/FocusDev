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
  hour: number; // 0..23
  youtubeSeconds: number;
  productiveSeconds: number;
  otherSeconds: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  youtubeSeconds: number;
  productiveSeconds: number;
  otherSeconds: number;
  idleSeconds: number;
  focusScore: number; // 0..100
  hourly: Record<number, HourlyStat>;
}

export interface AppSettings {
  workStartTime: string; // "09:00"
  workEndTime: string;   // "18:00"
  nudgeThresholdMinutes: number; // 5
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
