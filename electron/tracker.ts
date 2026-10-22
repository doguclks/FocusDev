import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { WindowInfo, ActivityCategory, DeepFocusState } from './types';
import { StorageManager } from './storage';
import { NudgeManager } from './nudge';

const BROWSER_PROCESSES = ['chrome', 'msedge', 'brave', 'firefox', 'opera'];

const PRODUCTIVE_PROCESSES = [
  'code',
  'antigravity',
  'cursor',
  'devenv',
  'webstorm',
  'webstorm64',
  'idea64',
  'pycharm64',
  'rider64',
  'clion64',
  'goland64',
  'datagrip64',
  'phpstorm64',
  'rubymine64',
  'fleet',
  'jetbrains_client64',
  'cwm_client64',
  'windowsterminal',
  'powershell',
  'pwsh',
  'cmd',
  'wt',
  'git-bash',
  'bash',
  'zsh',
  'conhost',
  'alacritty',
  'wezterm',
  'warp',
  'hyper',
  'tabby',
  'mobaxterm',
  'postman',
  'docker desktop',
  'slack',
  'teams',
];

export class WindowTracker {
  private childProcess: ChildProcessWithoutNullStreams | null = null;
  private storage: StorageManager;
  private nudge: NudgeManager;
  private currentWindowInfo: WindowInfo | null = null;
  private onWindowChangeCallback: (info: WindowInfo) => void;
  private onDeepFocusTickCallback: (state: DeepFocusState) => void;
  private onDeepFocusViolationCallback: (title: string) => void;

  private deepFocus: DeepFocusState = {
    isActive: false,
    totalDurationMinutes: 0,
    remainingSeconds: 0,
    startTime: null,
    targetEndTime: null,
    sessionName: 'Derin Odak Oturumu',
  };

  constructor(
    storage: StorageManager,
    nudge: NudgeManager,
    onWindowChange: (info: WindowInfo) => void,
    onDeepFocusTick: (state: DeepFocusState) => void,
    onDeepFocusViolation: (title: string) => void
  ) {
    this.storage = storage;
    this.nudge = nudge;
    this.onWindowChangeCallback = onWindowChange;
    this.onDeepFocusTickCallback = onDeepFocusTick;
    this.onDeepFocusViolationCallback = onDeepFocusViolation;
  }

  public start(): void {
    const isPackaged = app.isPackaged;
    const exePath = isPackaged
      ? path.join(process.resourcesPath, 'bin-win', 'WinTracker.exe')
      : path.join(__dirname, '..', 'bin-win', 'WinTracker.exe');

    if (!fs.existsSync(exePath)) {
      console.warn(`WinTracker binary not found at ${exePath}. Starting polling fallback.`);
      this.startPollingFallback();
      return;
    }

    try {
      this.childProcess = spawn(exePath, [], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let buffer = '';

      this.childProcess.stdout.on('data', (data) => {
        buffer += data.toString('utf-8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed);
              this.handleRawWindowSample(parsed.title || '', parsed.process || '', parsed.pid || 0, parsed.idleSeconds || 0);
            } catch (err) {
              // ignore malformed line
            }
          }
        }
      });

      this.childProcess.stderr.on('data', (err) => {
        console.error('WinTracker stderr:', err.toString());
      });

      this.childProcess.on('exit', (code) => {
        console.log('WinTracker exited with code', code);
      });
    } catch (err) {
      console.error('Failed to spawn WinTracker:', err);
      this.startPollingFallback();
    }
  }

  private handleRawWindowSample(title: string, processName: string, pid: number, idleSeconds: number): void {
    const settings = this.storage.getSettings();
    const isIdle = idleSeconds >= 180; // 3 minutes idle
    const procLower = processName.toLowerCase();
    const titleLower = title.toLowerCase();

    // Check if within work hours
    const isWorkHours = this.isWithinWorkHours(settings.workStartTime, settings.workEndTime, settings.trackWeekends);

    // Identify YouTube
    const isBrowser = BROWSER_PROCESSES.some((b) => procLower.includes(b));
    const hasYouTubeInTitle = isBrowser && titleLower.includes('youtube');

    // Whitelist check
    const isWhitelisted = settings.whitelistKeywords.some((kw) => titleLower.includes(kw.toLowerCase()));

    // Productivity classification: IDEs, Editors, Terminals
    const isIDE =
      PRODUCTIVE_PROCESSES.some((p) => procLower.includes(p)) ||
      titleLower.includes('webstorm') ||
      titleLower.includes('jetbrains') ||
      titleLower.includes('terminal') ||
      titleLower.includes('powershell') ||
      titleLower.includes('cmd.exe') ||
      titleLower.includes('bash') ||
      titleLower.includes('visual studio') ||
      titleLower.includes('antigravity') ||
      titleLower.includes('cloud code') ||
      titleLower.includes('neovim') ||
      titleLower.includes('nvim') ||
      titleLower.includes('sublime') ||
      titleLower.includes('android studio');

    let category: ActivityCategory = 'other';
    let isYouTube = false;
    let isProductive = false;

    if (isIdle) {
      category = 'idle';
    } else if (hasYouTubeInTitle && !isWhitelisted) {
      category = 'youtube';
      isYouTube = true;
    } else if (isIDE || (hasYouTubeInTitle && isWhitelisted)) {
      category = 'productive';
      isProductive = true;
    } else {
      category = 'other';
    }

    const info: WindowInfo = {
      title,
      processName,
      pid,
      category,
      isYouTube,
      isProductive,
      isIdle,
      timestamp: Date.now(),
    };

    this.currentWindowInfo = info;

    // Record second only if within work hours or during deep focus
    if (isWorkHours || this.deepFocus.isActive) {
      this.storage.recordSecond(category);
    }

    // Process Nudge logic
    this.nudge.tick(isYouTube && isWorkHours, title, settings.nudgeThresholdMinutes);

    // Deep Focus Logic
    if (this.deepFocus.isActive) {
      this.tickDeepFocus(isYouTube, title, settings.deepFocusBlockLevel);
    }

    this.onWindowChangeCallback(info);
  }

  private isWithinWorkHours(start: string, end: string, trackWeekends: boolean): boolean {
    const now = new Date();
    const day = now.getDay();
    if (!trackWeekends && (day === 0 || day === 6)) {
      return false; // Weekend
    }

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  public startDeepFocus(minutes: number, sessionName = 'Derin Odak Oturumu'): DeepFocusState {
    const durationSeconds = minutes * 60;
    const now = Date.now();

    this.deepFocus = {
      isActive: true,
      totalDurationMinutes: minutes,
      remainingSeconds: durationSeconds,
      startTime: now,
      targetEndTime: now + durationSeconds * 1000,
      sessionName,
    };

    this.onDeepFocusTickCallback(this.deepFocus);
    return this.deepFocus;
  }

  public stopDeepFocus(): DeepFocusState {
    this.deepFocus = {
      isActive: false,
      totalDurationMinutes: 0,
      remainingSeconds: 0,
      startTime: null,
      targetEndTime: null,
      sessionName: '',
    };
    this.onDeepFocusTickCallback(this.deepFocus);
    return this.deepFocus;
  }

  public getDeepFocusState(): DeepFocusState {
    return { ...this.deepFocus };
  }

  private tickDeepFocus(isYouTube: boolean, currentTitle: string, blockLevel: 'soft' | 'strict'): void {
    if (this.deepFocus.remainingSeconds > 0) {
      this.deepFocus.remainingSeconds--;
    } else {
      this.stopDeepFocus();
      return;
    }

    if (isYouTube) {
      // Violation during Deep Focus
      this.onDeepFocusViolationCallback(currentTitle);

      if (blockLevel === 'strict' && this.childProcess && this.childProcess.stdin.writable) {
        // Command WinTracker to minimize active YouTube window
        this.childProcess.stdin.write('MINIMIZE\n');
      }
    }

    this.onDeepFocusTickCallback(this.deepFocus);
  }

  private startPollingFallback(): void {
    // Basic interval fallback in case native binary cannot be spawned
    setInterval(() => {
      this.handleRawWindowSample('Desktop', 'explorer', 0, 0);
    }, 1000);
  }

  public triggerVoiceTyping(): boolean {
    if (this.childProcess && this.childProcess.stdin && !this.childProcess.killed) {
      try {
        this.childProcess.stdin.write('VOICE_TYPING\n');
        return true;
      } catch (err) {
        console.warn('Failed to send VOICE_TYPING to WinTracker:', err);
      }
    }
    return false;
  }

  public stop(): void {
    if (this.childProcess) {
      try {
        this.childProcess.kill();
      } catch {}
      this.childProcess = null;
    }
  }
}
