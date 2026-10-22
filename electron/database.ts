import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { DailyStats, HourlyStat, AppSettings } from './types';

export interface DailyTodoRow {
  id: string;
  date: string;
  text: string;
  is_completed: number;
  completed_at: string | null;
  priority: string;
  order_index: number;
  created_at: string;
}

export interface DailyLogRow {
  date: string;
  content: string;
  standup_summary: string | null;
  updated_at: string;
}

export interface GeneralNoteRow {
  id: string;
  title: string;
  content: string;
  tags: string;
  is_pinned: number;
  created_at: string;
  updated_at: string;
}

export class AppDatabase {
  private db: Database | null = null;
  private dbPath: string;
  private isReady: boolean = false;
  private readyPromise: Promise<void>;

  constructor() {
    const userData = app?.getPath ? app.getPath('userData') : process.cwd();
    const dataDir = path.join(userData, 'focus-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'focus_dev.db');
    this.readyPromise = this.init(dataDir);
  }

  private async init(dataDir: string): Promise<void> {
    try {
      const SQL = await initSqlJs({
        locateFile: (file) => {
          const localWasm = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file);
          if (fs.existsSync(localWasm)) return localWasm;
          const resWasm = path.join(process.resourcesPath || '', file);
          if (fs.existsSync(resWasm)) return resWasm;
          return localWasm;
        },
      });

      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } else {
        this.db = new SQL.Database();
      }

      this.initTables();
      this.migrateFromJsonIfAvailable(dataDir);
      this.saveToDisk();
      this.isReady = true;
    } catch (err) {
      console.error('Failed to initialize SQLite database:', err);
    }
  }

  public async whenReady(): Promise<void> {
    await this.readyPromise;
  }

  private initTables(): void {
    if (!this.db) return;
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        youtube_seconds INTEGER DEFAULT 0,
        productive_seconds INTEGER DEFAULT 0,
        other_seconds INTEGER DEFAULT 0,
        idle_seconds INTEGER DEFAULT 0,
        focus_score INTEGER DEFAULT 100,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS hourly_stats (
        date TEXT,
        hour INTEGER,
        youtube_seconds INTEGER DEFAULT 0,
        productive_seconds INTEGER DEFAULT 0,
        other_seconds INTEGER DEFAULT 0,
        PRIMARY KEY (date, hour)
      );

      CREATE TABLE IF NOT EXISTS daily_todos (
        id TEXT PRIMARY KEY,
        date TEXT,
        text TEXT,
        is_completed INTEGER DEFAULT 0,
        completed_at TEXT,
        priority TEXT DEFAULT 'normal',
        order_index INTEGER DEFAULT 0,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS daily_logs (
        date TEXT PRIMARY KEY,
        content TEXT DEFAULT '',
        standup_summary TEXT DEFAULT '',
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS general_notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        tags TEXT DEFAULT '',
        is_pinned INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );
    `);
  }

  private saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Failed to export SQLite database to disk:', err);
    }
  }

  private migrateFromJsonIfAvailable(dataDir: string): void {
    try {
      const settingsFile = path.join(dataDir, 'settings.json');
      if (fs.existsSync(settingsFile)) {
        const existing = this.getSettings();
        if (!existing) {
          const raw = fs.readFileSync(settingsFile, 'utf-8');
          this.saveSettings(JSON.parse(raw));
        }
      }

      const files = fs.readdirSync(dataDir);
      for (const f of files) {
        if (f.startsWith('stats-') && f.endsWith('.json')) {
          const filePath = path.join(dataDir, f);
          try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const data: DailyStats = JSON.parse(raw);
            if (data && data.date) {
              const existing = this.getDailyStats(data.date);
              if (!existing) {
                this.saveDailyStats(data);
              }
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    stmt.bind(['app_settings']);
    let result: AppSettings | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject() as { value: string };
      try {
        result = JSON.parse(row.value);
      } catch {
        result = null;
      }
    }
    stmt.free();
    return result;
  }

  public saveSettings(settings: AppSettings): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      ['app_settings', JSON.stringify(settings), now]
    );
    this.saveToDisk();
  }

  // --- DAILY & HOURLY STATS ---
  public getDailyStats(date: string): DailyStats | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM daily_stats WHERE date = ?');
    stmt.bind([date]);
    let statRow: any = null;
    if (stmt.step()) {
      statRow = stmt.getAsObject();
    }
    stmt.free();
    if (!statRow) return null;

    const hourlyStmt = this.db.prepare('SELECT * FROM hourly_stats WHERE date = ?');
    hourlyStmt.bind([date]);
    const hourly: Record<number, HourlyStat> = {};
    for (let h = 0; h < 24; h++) {
      hourly[h] = { hour: h, youtubeSeconds: 0, productiveSeconds: 0, otherSeconds: 0 };
    }

    while (hourlyStmt.step()) {
      const r = hourlyStmt.getAsObject() as any;
      hourly[r.hour] = {
        hour: r.hour,
        youtubeSeconds: r.youtube_seconds || 0,
        productiveSeconds: r.productive_seconds || 0,
        otherSeconds: r.other_seconds || 0,
      };
    }
    hourlyStmt.free();

    return {
      date: statRow.date,
      youtubeSeconds: statRow.youtube_seconds || 0,
      productiveSeconds: statRow.productive_seconds || 0,
      otherSeconds: statRow.other_seconds || 0,
      idleSeconds: statRow.idle_seconds || 0,
      focusScore: statRow.focus_score ?? 100,
      hourly,
    };
  }

  public saveDailyStats(stats: DailyStats): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      `INSERT OR REPLACE INTO daily_stats (date, youtube_seconds, productive_seconds, other_seconds, idle_seconds, focus_score, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        stats.date,
        stats.youtubeSeconds,
        stats.productiveSeconds,
        stats.otherSeconds,
        stats.idleSeconds,
        stats.focusScore,
        now,
      ]
    );

    if (stats.hourly) {
      for (let h = 0; h < 24; h++) {
        const hStat = stats.hourly[h];
        if (hStat && (hStat.youtubeSeconds > 0 || hStat.productiveSeconds > 0 || hStat.otherSeconds > 0)) {
          this.db.run(
            `INSERT OR REPLACE INTO hourly_stats (date, hour, youtube_seconds, productive_seconds, other_seconds)
             VALUES (?, ?, ?, ?, ?)`,
            [stats.date, h, hStat.youtubeSeconds, hStat.productiveSeconds, hStat.otherSeconds]
          );
        }
      }
    }

    this.saveToDisk();
  }

  // --- DAILY TODOS ---
  public getTodosByDate(date: string): DailyTodoRow[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT * FROM daily_todos 
      WHERE date = ? 
      ORDER BY is_completed ASC, order_index ASC, created_at ASC
    `);
    stmt.bind([date]);
    const list: DailyTodoRow[] = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject() as any);
    }
    stmt.free();
    return list;
  }

  public createTodo(date: string, text: string, priority: string = 'normal'): DailyTodoRow {
    const id = 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const now = new Date().toISOString();

    let nextOrder = 1;
    if (this.db) {
      const stmt = this.db.prepare('SELECT MAX(order_index) as max_ord FROM daily_todos WHERE date = ?');
      stmt.bind([date]);
      if (stmt.step()) {
        const obj = stmt.getAsObject() as any;
        nextOrder = (obj?.max_ord ?? 0) + 1;
      }
      stmt.free();

      this.db.run(
        `INSERT INTO daily_todos (id, date, text, is_completed, priority, order_index, created_at)
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
        [id, date, text, priority, nextOrder, now]
      );
      this.saveToDisk();
    }

    return {
      id,
      date,
      text,
      is_completed: 0,
      completed_at: null,
      priority,
      order_index: nextOrder,
      created_at: now,
    };
  }

  public toggleTodo(id: string): DailyTodoRow | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM daily_todos WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const current = stmt.getAsObject() as any;
    stmt.free();

    const nextCompleted = current.is_completed ? 0 : 1;
    const completedAt = nextCompleted ? new Date().toISOString() : null;

    this.db.run(
      `UPDATE daily_todos SET is_completed = ?, completed_at = ? WHERE id = ?`,
      [nextCompleted, completedAt, id]
    );
    this.saveToDisk();

    return {
      ...current,
      is_completed: nextCompleted,
      completed_at: completedAt,
    };
  }

  public updateTodo(id: string, text: string, priority?: string): DailyTodoRow | null {
    if (!this.db) return null;
    if (priority) {
      this.db.run(`UPDATE daily_todos SET text = ?, priority = ? WHERE id = ?`, [text, priority, id]);
    } else {
      this.db.run(`UPDATE daily_todos SET text = ? WHERE id = ?`, [text, id]);
    }
    this.saveToDisk();

    const stmt = this.db.prepare('SELECT * FROM daily_todos WHERE id = ?');
    stmt.bind([id]);
    let row: any = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }

  public deleteTodo(id: string): boolean {
    if (!this.db) return false;
    this.db.run(`DELETE FROM daily_todos WHERE id = ?`, [id]);
    this.saveToDisk();
    return true;
  }

  public rolloverIncompleteTodos(fromDate: string, toDate: string): number {
    const incomplete = this.getTodosByDate(fromDate).filter((t) => !t.is_completed);
    if (incomplete.length === 0 || !this.db) return 0;

    let count = 0;
    for (const t of incomplete) {
      const newId = 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      this.db.run(
        `INSERT INTO daily_todos (id, date, text, is_completed, priority, order_index, created_at)
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
        [newId, toDate, t.text, t.priority, t.order_index, new Date().toISOString()]
      );
      count++;
    }

    this.saveToDisk();
    return count;
  }

  // --- DAILY LOGS ---
  public getDailyLog(date: string): DailyLogRow {
    if (!this.db) {
      return { date, content: '', standup_summary: '', updated_at: new Date().toISOString() };
    }
    const stmt = this.db.prepare('SELECT * FROM daily_logs WHERE date = ?');
    stmt.bind([date]);
    let row: any = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    if (row) return row;
    return { date, content: '', standup_summary: '', updated_at: new Date().toISOString() };
  }

  public saveDailyLog(date: string, content: string, standupSummary: string = ''): DailyLogRow {
    const now = new Date().toISOString();
    if (this.db) {
      this.db.run(
        `INSERT OR REPLACE INTO daily_logs (date, content, standup_summary, updated_at) VALUES (?, ?, ?, ?)`,
        [date, content, standupSummary, now]
      );
      this.saveToDisk();
    }
    return this.getDailyLog(date);
  }

  // --- GENERAL NOTES ---
  public getGeneralNotes(): GeneralNoteRow[] {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT * FROM general_notes 
      ORDER BY is_pinned DESC, updated_at DESC
    `);
    const list: GeneralNoteRow[] = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject() as any);
    }
    stmt.free();
    return list;
  }

  public createGeneralNote(title: string, content: string, tags: string = ''): GeneralNoteRow {
    const id = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const now = new Date().toISOString();
    const noteTitle = title || 'Başlıksız Not';

    if (this.db) {
      this.db.run(
        `INSERT INTO general_notes (id, title, content, tags, is_pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [id, noteTitle, content || '', tags, now, now]
      );
      this.saveToDisk();
    }

    return {
      id,
      title: noteTitle,
      content: content || '',
      tags,
      is_pinned: 0,
      created_at: now,
      updated_at: now,
    };
  }

  public updateGeneralNote(id: string, title: string, content: string, tags?: string): GeneralNoteRow | null {
    if (!this.db) return null;
    const now = new Date().toISOString();
    if (tags !== undefined) {
      this.db.run(
        `UPDATE general_notes SET title = ?, content = ?, tags = ?, updated_at = ? WHERE id = ?`,
        [title, content, tags, now, id]
      );
    } else {
      this.db.run(
        `UPDATE general_notes SET title = ?, content = ?, updated_at = ? WHERE id = ?`,
        [title, content, now, id]
      );
    }
    this.saveToDisk();

    const stmt = this.db.prepare('SELECT * FROM general_notes WHERE id = ?');
    stmt.bind([id]);
    let row: any = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }

  public deleteGeneralNote(id: string): boolean {
    if (!this.db) return false;
    this.db.run(`DELETE FROM general_notes WHERE id = ?`, [id]);
    this.saveToDisk();
    return true;
  }

  public togglePinGeneralNote(id: string): GeneralNoteRow | null {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM general_notes WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const current = stmt.getAsObject() as any;
    stmt.free();

    const nextPin = current.is_pinned ? 0 : 1;
    this.db.run(`UPDATE general_notes SET is_pinned = ? WHERE id = ?`, [nextPin, id]);
    this.saveToDisk();

    return {
      ...current,
      is_pinned: nextPin,
    };
  }
}
