import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, session, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import { StorageManager } from './storage';
import { NudgeManager } from './nudge';
import { WindowTracker } from './tracker';
import { WindowInfo, DeepFocusState, NudgeEvent } from './types';

let mainWindow: BrowserWindow | null = null;
let quickCaptureWindow: BrowserWindow | null = null;
let quickTasksWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let currentViewMode: 'full' | 'widget' | 'zen' = 'full';
let isPinned = false;

let storage: StorageManager;
let nudge: NudgeManager;
let tracker: WindowTracker;

function getAssetPath(filename: string): string {
  if (app.isPackaged) {
    const resPath = path.join(process.resourcesPath, 'assets', filename);
    if (fs.existsSync(resPath)) return resPath;
  }
  const localPath = path.join(__dirname, '..', 'assets', filename);
  if (fs.existsSync(localPath)) return localPath;
  const fallbackResPath = path.join(process.resourcesPath, 'assets', filename);
  if (fs.existsSync(fallbackResPath)) return fallbackResPath;
  return localPath;
}

function createMainWindow() {
  const iconIco = getAssetPath('icon.ico');
  const iconPng = getAssetPath('icon.png');
  const appIcon = fs.existsSync(iconIco) ? iconIco : iconPng;

  mainWindow = new BrowserWindow({
    title: 'Focus Dev',
    width: 1040,
    height: 740,
    minWidth: 320,
    minHeight: 350,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#020617',
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  const distHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
  const isDevMode = process.env.NODE_ENV === 'development';

  if (isDevMode) {
    mainWindow.loadURL('http://localhost:5789').catch((err) => {
      console.warn('Failed to load dev server, falling back to dist/index.html:', err);
      mainWindow?.loadFile(distHtmlPath);
    });
  } else {
    mainWindow.loadFile(distHtmlPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
  });

  mainWindow.on('close', (event) => {
    // Hide to tray instead of quitting
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createQuickCaptureWindow() {
  const iconIco = getAssetPath('icon.ico');
  const iconPng = getAssetPath('icon.png');
  const appIcon = fs.existsSync(iconIco) ? iconIco : iconPng;

  quickCaptureWindow = new BrowserWindow({
    title: 'Focus Dev - Quick Capture',
    width: 620,
    height: 220,
    frame: false,
    backgroundColor: '#020617',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    autoHideMenuBar: true,
    show: false,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  quickCaptureWindow.setMenuBarVisibility(false);
  quickCaptureWindow.removeMenu();

  const distHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
  const isDevMode = process.env.NODE_ENV === 'development';

  if (isDevMode) {
    quickCaptureWindow.loadURL('http://localhost:5789?quickCapture=1').catch(() => {
      quickCaptureWindow?.loadFile(distHtmlPath, { hash: 'quick-capture', query: { quickCapture: '1' } });
    });
  } else {
    quickCaptureWindow.loadFile(distHtmlPath, { hash: 'quick-capture', query: { quickCapture: '1' } });
  }
}

function toggleQuickCapture() {
  if (!quickCaptureWindow || quickCaptureWindow.isDestroyed()) {
    createQuickCaptureWindow();
  }

  if (quickCaptureWindow?.isVisible()) {
    quickCaptureWindow.hide();
  } else {
    quickCaptureWindow?.center();
    quickCaptureWindow?.show();
    quickCaptureWindow?.focus();
    quickCaptureWindow?.webContents.send('quick-capture:focus');
  }
}

function createQuickTasksWindow() {
  const iconIco = getAssetPath('icon.ico');
  const iconPng = getAssetPath('icon.png');
  const appIcon = fs.existsSync(iconIco) ? iconIco : iconPng;

  quickTasksWindow = new BrowserWindow({
    title: 'Focus Dev - Quick Tasks',
    width: 560,
    height: 490,
    minWidth: 440,
    minHeight: 380,
    frame: false,
    backgroundColor: '#020617',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    autoHideMenuBar: true,
    show: false,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  quickTasksWindow.setMenuBarVisibility(false);
  quickTasksWindow.removeMenu();

  const distHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
  const isDevMode = process.env.NODE_ENV === 'development';

  if (isDevMode) {
    quickTasksWindow.loadURL('http://localhost:5789?quickTasks=1').catch(() => {
      quickTasksWindow?.loadFile(distHtmlPath, { hash: 'quick-tasks', query: { quickTasks: '1' } });
    });
  } else {
    quickTasksWindow.loadFile(distHtmlPath, { hash: 'quick-tasks', query: { quickTasks: '1' } });
  }
}

function toggleQuickTasks() {
  if (!quickTasksWindow || quickTasksWindow.isDestroyed()) {
    createQuickTasksWindow();
  }

  if (quickTasksWindow?.isVisible()) {
    quickTasksWindow.hide();
  } else {
    quickTasksWindow?.center();
    quickTasksWindow?.show();
    quickTasksWindow?.focus();
    quickTasksWindow?.webContents.send('quick-tasks:focus');
  }
}

function createTray() {
  try {
    const icoPath = getAssetPath('icon.ico');
    const trayIconPath = getAssetPath('tray-icon.png');
    const altIconPath = getAssetPath('icon-32.png');
    const fallbackPng = getAssetPath('icon.png');

    let iconPath = process.platform === 'win32' && fs.existsSync(icoPath) ? icoPath : trayIconPath;
    if (!fs.existsSync(iconPath)) {
      iconPath = fs.existsSync(altIconPath) ? altIconPath : fallbackPng;
    }

    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    tray.setToolTip('Focus Dev');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Focus Dev Dashboard',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      {
        label: '⚡ Hızlı Görev / Not Ekle (Alt+Shift+N)',
        click: () => toggleQuickCapture(),
      },
      {
        label: '📋 Bugünün Görevleri (Alt+Shift+M)',
        click: () => toggleQuickTasks(),
      },
      { type: 'separator' },
      {
        label: 'Hızlı 25 dk Derin Odak',
        click: () => {
          tracker.startDeepFocus(25, 'Hızlı Pomodoro');
          mainWindow?.show();
        },
      },
      {
        label: 'Hızlı 45 dk Derin Odak',
        click: () => {
          tracker.startDeepFocus(45, 'Mühendis Derin Odak');
          mainWindow?.show();
        },
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow?.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow?.show();
        mainWindow?.focus();
      }
    });
  } catch (err) {
    console.warn('Tray creation skipped or failed:', err);
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    // Grant media & microphone permissions for voice dictation
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'media') {
        return callback(true);
      }
      callback(true);
    });
    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
      return true;
    });

    storage = new StorageManager();

    nudge = new NudgeManager((event: NudgeEvent) => {
      mainWindow?.webContents.send('nudge:alert', event);
    });

    tracker = new WindowTracker(
      storage,
      nudge,
      (info: WindowInfo) => {
        mainWindow?.webContents.send('tracker:window-update', info);
      },
      (state: DeepFocusState) => {
        mainWindow?.webContents.send('deepfocus:tick', state);
      },
      (title: string) => {
        mainWindow?.webContents.send('deepfocus:violation', title);
      }
    );

    // Setup IPC Handlers
    ipcMain.handle('stats:get-today', () => {
      return storage.getTodayStats();
    });

    ipcMain.handle('stats:get-history', (_, days) => {
      return storage.getHistory(days || 7);
    });

    ipcMain.handle('settings:get', () => {
      return storage.getSettings();
    });

    ipcMain.handle('settings:update', (_, newSettings) => {
      return storage.updateSettings(newSettings);
    });

    ipcMain.handle('deepfocus:start', (_, minutes, sessionName) => {
      return tracker.startDeepFocus(minutes, sessionName);
    });

    ipcMain.handle('deepfocus:stop', () => {
      return tracker.stopDeepFocus();
    });

    ipcMain.handle('nudge:snooze', (_, minutes) => {
      nudge.snooze(minutes || 5);
    });

    ipcMain.handle('voice:trigger-typing', () => {
      const ok = tracker ? tracker.triggerVoiceTyping() : false;
      if (!ok) {
        const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class KeyHelper {
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    public static void Trigger() {
        keybd_event(0x5B, 0, 0, 0);
        System.Threading.Thread.Sleep(50);
        keybd_event(0x48, 0, 0, 0);
        System.Threading.Thread.Sleep(50);
        keybd_event(0x48, 0, 2, 0);
        System.Threading.Thread.Sleep(50);
        keybd_event(0x5B, 0, 2, 0);
    }
}
"@; [KeyHelper]::Trigger();`;
        const { spawn } = require('child_process');
        spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', psScript], { windowsHide: true });
      }
      return true;
    });

    ipcMain.handle('quick-capture:hide', () => {
      quickCaptureWindow?.hide();
    });

    ipcMain.handle('quick-capture:toggle', () => {
      toggleQuickCapture();
    });

    ipcMain.handle('quick-tasks:hide', () => {
      quickTasksWindow?.hide();
    });

    ipcMain.handle('quick-tasks:toggle', () => {
      toggleQuickTasks();
    });

    // Helper to broadcast todo changes to all windows
    const broadcastTodo = (todo: any) => {
      mainWindow?.webContents.send('todos:changed', todo);
      quickTasksWindow?.webContents.send('todos:changed', todo);
    };

    const broadcastTodoDeleted = (id: string) => {
      mainWindow?.webContents.send('todos:deleted', id);
      quickTasksWindow?.webContents.send('todos:deleted', id);
    };

    // --- SQLite Todos & Notes Handlers ---
    ipcMain.handle('todos:get-by-date', (_, date: string) => {
      const rows = storage.db.getTodosByDate(date);
      return rows.map((r) => ({
        id: r.id,
        date: r.date,
        text: r.text,
        isCompleted: Boolean(r.is_completed),
        completedAt: r.completed_at,
        priority: r.priority || 'normal',
        orderIndex: r.order_index,
        createdAt: r.created_at,
      }));
    });

    ipcMain.handle('todos:create', (_, date: string, text: string, priority?: string) => {
      const r = storage.db.createTodo(date, text, priority || 'normal');
      const created = {
        id: r.id,
        date: r.date,
        text: r.text,
        isCompleted: Boolean(r.is_completed),
        completedAt: r.completed_at,
        priority: r.priority || 'normal',
        orderIndex: r.order_index,
        createdAt: r.created_at,
      };
      broadcastTodo(created);
      return created;
    });

    ipcMain.handle('todos:toggle', (_, id: string) => {
      const r = storage.db.toggleTodo(id);
      if (!r) return null;
      const updated = {
        id: r.id,
        date: r.date,
        text: r.text,
        isCompleted: Boolean(r.is_completed),
        completedAt: r.completed_at,
        priority: r.priority || 'normal',
        orderIndex: r.order_index,
        createdAt: r.created_at,
      };
      broadcastTodo(updated);
      return updated;
    });

    ipcMain.handle('todos:update', (_, id: string, text: string, priority?: string) => {
      const r = storage.db.updateTodo(id, text, priority);
      if (!r) return null;
      const updated = {
        id: r.id,
        date: r.date,
        text: r.text,
        isCompleted: Boolean(r.is_completed),
        completedAt: r.completed_at,
        priority: r.priority || 'normal',
        orderIndex: r.order_index,
        createdAt: r.created_at,
      };
      broadcastTodo(updated);
      return updated;
    });

    ipcMain.handle('todos:delete', (_, id: string) => {
      const res = storage.db.deleteTodo(id);
      if (res) {
        broadcastTodoDeleted(id);
      }
      return res;
    });

    ipcMain.handle('todos:rollover', (_, fromDate: string, toDate: string) => {
      return storage.db.rolloverIncompleteTodos(fromDate, toDate);
    });

    ipcMain.handle('daily-log:get', (_, date: string) => {
      const r = storage.db.getDailyLog(date);
      return {
        date: r.date,
        content: r.content || '',
        standupSummary: r.standup_summary || '',
        updatedAt: r.updated_at,
      };
    });

    ipcMain.handle('daily-log:save', (_, date: string, content: string, standupSummary?: string) => {
      const r = storage.db.saveDailyLog(date, content, standupSummary || '');
      const result = {
        date: r.date,
        content: r.content || '',
        standupSummary: r.standup_summary || '',
        updatedAt: r.updated_at,
      };
      mainWindow?.webContents.send('daily-log:changed', result);
      return result;
    });

    ipcMain.handle('notes:get-all', () => {
      const rows = storage.db.getGeneralNotes();
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPinned: Boolean(r.is_pinned),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    });

    ipcMain.handle('notes:create', (_, title: string, content: string, tags?: string) => {
      const r = storage.db.createGeneralNote(title, content, tags || '');
      const result = {
        id: r.id,
        title: r.title,
        content: r.content,
        tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPinned: Boolean(r.is_pinned),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
      mainWindow?.webContents.send('notes:changed', result);
      return result;
    });

    ipcMain.handle('notes:update', (_, id: string, title: string, content: string, tags?: string) => {
      const r = storage.db.updateGeneralNote(id, title, content, tags);
      if (!r) return null;
      return {
        id: r.id,
        title: r.title,
        content: r.content,
        tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPinned: Boolean(r.is_pinned),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    ipcMain.handle('notes:delete', (_, id: string) => {
      return storage.db.deleteGeneralNote(id);
    });

    ipcMain.handle('notes:toggle-pin', (_, id: string) => {
      const r = storage.db.togglePinGeneralNote(id);
      if (!r) return null;
      return {
        id: r.id,
        title: r.title,
        content: r.content,
        tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        isPinned: Boolean(r.is_pinned),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    ipcMain.handle('window:set-mode', (_, mode: 'full' | 'widget' | 'zen') => {
      if (!mainWindow) return { mode: currentViewMode, isPinned };
      currentViewMode = mode;
      if (mode === 'zen') {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        }
        mainWindow.setMinimumSize(250, 140);
        mainWindow.setMaximumSize(400, 260);
        const [x, y] = mainWindow.getPosition();
        mainWindow.setBounds({ x, y, width: 320, height: 185 });
        mainWindow.setAlwaysOnTop(isPinned, 'floating');
      } else if (mode === 'widget') {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        }
        mainWindow.setMinimumSize(320, 360);
        mainWindow.setMaximumSize(600, 600);
        const [x, y] = mainWindow.getPosition();
        mainWindow.setBounds({ x, y, width: 360, height: 420 });
        mainWindow.setAlwaysOnTop(isPinned, 'floating');
      } else {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        }
        mainWindow.setMaximumSize(10000, 10000);
        mainWindow.setMinimumSize(860, 620);
        const [x, y] = mainWindow.getPosition();
        mainWindow.setBounds({ x, y, width: 1040, height: 740 });
        mainWindow.setAlwaysOnTop(false);
      }
      return { mode: currentViewMode, isPinned };
    });

    ipcMain.handle('window:toggle-pin', () => {
      if (!mainWindow) return isPinned;
      isPinned = !isPinned;
      if (currentViewMode !== 'full') {
        mainWindow.setAlwaysOnTop(isPinned, 'floating');
      }
      return isPinned;
    });

    ipcMain.handle('window:get-view-state', () => {
      return { mode: currentViewMode, isPinned };
    });

    ipcMain.on('window:minimize', () => {
      mainWindow?.minimize();
    });

    ipcMain.on('window:toggle-maximize', () => {
      if (!mainWindow) return;
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    });

    ipcMain.on('window:close-to-tray', () => {
      mainWindow?.hide();
    });

    createMainWindow();
    createQuickCaptureWindow();
    createQuickTasksWindow();
    createTray();
    tracker.start();

    // Register Global Shortcut for Quick Capture (Alt+Shift+N / Ctrl+Shift+Space)
    try {
      const registered = globalShortcut.register('Alt+Shift+N', () => {
        toggleQuickCapture();
      });
      if (!registered) {
        console.warn('Failed to register Alt+Shift+N, registering CommandOrControl+Shift+Space');
        globalShortcut.register('CommandOrControl+Shift+Space', () => {
          toggleQuickCapture();
        });
      }
    } catch (err) {
      console.warn('Global shortcut Alt+Shift+N registration error:', err);
    }

    // Register Global Shortcut for Quick Tasks HUD (Alt+Shift+M / Ctrl+Shift+M)
    try {
      const regTasks = globalShortcut.register('Alt+Shift+M', () => {
        toggleQuickTasks();
      });
      if (!regTasks) {
        console.warn('Failed to register Alt+Shift+M, registering CommandOrControl+Shift+M');
        globalShortcut.register('CommandOrControl+Shift+M', () => {
          toggleQuickTasks();
        });
      }
    } catch (err) {
      console.warn('Global shortcut Alt+Shift+M registration error:', err);
    }

    // Auto save stats every 15 seconds
    setInterval(() => {
      storage.saveCurrentStats();
    }, 15000);
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  if (tracker) tracker.stop();
  if (storage) storage.saveCurrentStats();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray
  }
});
