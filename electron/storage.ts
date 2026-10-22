import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppSettings, DailyStats, HourlyStat } from './types';
import { AppDatabase } from './database';

const DEFAULT_SETTINGS: AppSettings = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  nudgeThresholdMinutes: 5,
  deepFocusBlockLevel: 'soft',
  trackWeekends: false,
  whitelistKeywords: ['tutorial', 'ders', 'egitim', 'docker', 'course', 'lofi', 'chillhop', 'instrumental'],
};

export class StorageManager {
  private dataDir: string;
  private currentStats: DailyStats | null = null;
  private settings: AppSettings = DEFAULT_SETTINGS;
  public db: AppDatabase;

  constructor() {
    const userData = app.getPath('userData');
    this.dataDir = path.join(userData, 'focus-data');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.db = new AppDatabase();
    this.loadSettings();
    this.loadTodayStats();
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.db.saveSettings(this.settings);
    return this.getSettings();
  }

  private loadSettings(): void {
    const fromDb = this.db.getSettings();
    if (fromDb) {
      this.settings = { ...DEFAULT_SETTINGS, ...fromDb };
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
      this.db.saveSettings(this.settings);
    }
  }

  private getTodayDateKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getTodayStats(): DailyStats {
    const todayKey = this.getTodayDateKey();
    if (!this.currentStats || this.currentStats.date !== todayKey) {
      this.loadTodayStats();
    }
    return this.currentStats!;
  }

  private createEmptyStats(date: string): DailyStats {
    const hourly: Record<number, HourlyStat> = {};
    for (let h = 0; h < 24; h++) {
      hourly[h] = {
        hour: h,
        youtubeSeconds: 0,
        productiveSeconds: 0,
        otherSeconds: 0,
      };
    }

    return {
      date,
      youtubeSeconds: 0,
      productiveSeconds: 0,
      otherSeconds: 0,
      idleSeconds: 0,
      focusScore: 100,
      hourly,
    };
  }

  private loadTodayStats(): void {
    const dateKey = this.getTodayDateKey();
    const fromDb = this.db.getDailyStats(dateKey);

    if (fromDb) {
      this.currentStats = fromDb;
    } else {
      this.currentStats = this.createEmptyStats(dateKey);
      this.saveCurrentStats();
    }
  }

  public recordSecond(category: 'youtube' | 'productive' | 'other' | 'idle'): DailyStats {
    const stats = this.getTodayStats();
    const currentHour = new Date().getHours();

    if (!stats.hourly[currentHour]) {
      stats.hourly[currentHour] = {
        hour: currentHour,
        youtubeSeconds: 0,
        productiveSeconds: 0,
        otherSeconds: 0,
      };
    }

    switch (category) {
      case 'youtube':
        stats.youtubeSeconds += 1;
        stats.hourly[currentHour].youtubeSeconds += 1;
        break;
      case 'productive':
        stats.productiveSeconds += 1;
        stats.hourly[currentHour].productiveSeconds += 1;
        break;
      case 'idle':
        stats.idleSeconds += 1;
        break;
      case 'other':
      default:
        stats.otherSeconds += 1;
        stats.hourly[currentHour].otherSeconds += 1;
        break;
    }

    // Calculate Focus Score
    const totalEngaged = stats.productiveSeconds + stats.youtubeSeconds;
    if (totalEngaged > 0) {
      stats.focusScore = Math.round((stats.productiveSeconds / totalEngaged) * 100);
    } else {
      stats.focusScore = 100;
    }

    return stats;
  }

  public saveCurrentStats(): void {
    if (!this.currentStats) return;
    this.db.saveDailyStats(this.currentStats);
  }

  public getHistory(days = 7): DailyStats[] {
    const results: DailyStats[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (dateKey === this.getTodayDateKey() && this.currentStats) {
        results.push(this.currentStats);
        continue;
      }

      const fromDb = this.db.getDailyStats(dateKey);
      if (fromDb) {
        results.push(fromDb);
      }
    }

    return results;
  }
}
