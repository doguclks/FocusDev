import { contextBridge, ipcRenderer } from 'electron';
import { WindowInfo, DailyStats, AppSettings, DeepFocusState, NudgeEvent } from './types';

const api = {
  onWindowUpdate: (callback: (info: WindowInfo) => void) => {
    const listener = (_: any, data: WindowInfo) => callback(data);
    ipcRenderer.on('tracker:window-update', listener);
    return () => ipcRenderer.removeListener('tracker:window-update', listener);
  },
  onNudgeAlert: (callback: (event: NudgeEvent) => void) => {
    const listener = (_: any, data: NudgeEvent) => callback(data);
    ipcRenderer.on('nudge:alert', listener);
    return () => ipcRenderer.removeListener('nudge:alert', listener);
  },
  onDeepFocusTick: (callback: (state: DeepFocusState) => void) => {
    const listener = (_: any, data: DeepFocusState) => callback(data);
    ipcRenderer.on('deepfocus:tick', listener);
    return () => ipcRenderer.removeListener('deepfocus:tick', listener);
  },
  onDeepFocusViolation: (callback: (title: string) => void) => {
    const listener = (_: any, title: string) => callback(title);
    ipcRenderer.on('deepfocus:violation', listener);
    return () => ipcRenderer.removeListener('deepfocus:violation', listener);
  },
  getTodayStats: () => ipcRenderer.invoke('stats:get-today'),
  getHistory: (days?: number) => ipcRenderer.invoke('stats:get-history', days),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', settings),
  startDeepFocus: (minutes: number, sessionName?: string) => ipcRenderer.invoke('deepfocus:start', minutes, sessionName),
  stopDeepFocus: () => ipcRenderer.invoke('deepfocus:stop'),
  snoozeNudge: (minutes?: number) => ipcRenderer.invoke('nudge:snooze', minutes),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  closeToTray: () => ipcRenderer.send('window:close-to-tray'),
  setViewMode: (mode: 'full' | 'widget' | 'zen') => ipcRenderer.invoke('window:set-mode', mode),
  togglePin: () => ipcRenderer.invoke('window:toggle-pin'),
  getViewState: () => ipcRenderer.invoke('window:get-view-state'),
  triggerVoiceTyping: () => ipcRenderer.invoke('voice:trigger-typing'),
  hideQuickCapture: () => ipcRenderer.invoke('quick-capture:hide'),
  toggleQuickCapture: () => ipcRenderer.invoke('quick-capture:toggle'),
  onQuickCaptureFocus: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('quick-capture:focus', listener);
    return () => ipcRenderer.removeListener('quick-capture:focus', listener);
  },
  hideQuickTasks: () => ipcRenderer.invoke('quick-tasks:hide'),
  toggleQuickTasks: () => ipcRenderer.invoke('quick-tasks:toggle'),
  onQuickTasksFocus: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('quick-tasks:focus', listener);
    return () => ipcRenderer.removeListener('quick-tasks:focus', listener);
  },
  onTodosChanged: (callback: (todo: any) => void) => {
    const listener = (_: any, todo: any) => callback(todo);
    ipcRenderer.on('todos:changed', listener);
    return () => ipcRenderer.removeListener('todos:changed', listener);
  },
  onTodoDeleted: (callback: (id: string) => void) => {
    const listener = (_: any, id: string) => callback(id);
    ipcRenderer.on('todos:deleted', listener);
    return () => ipcRenderer.removeListener('todos:deleted', listener);
  },
  onDailyLogChanged: (callback: (log: any) => void) => {
    const listener = (_: any, log: any) => callback(log);
    ipcRenderer.on('daily-log:changed', listener);
    return () => ipcRenderer.removeListener('daily-log:changed', listener);
  },
  onNotesChanged: (callback: (note: any) => void) => {
    const listener = (_: any, note: any) => callback(note);
    ipcRenderer.on('notes:changed', listener);
    return () => ipcRenderer.removeListener('notes:changed', listener);
  },

  // --- SQLite Notes & Todos API ---
  getTodosByDate: (date: string) => ipcRenderer.invoke('todos:get-by-date', date),
  createTodo: (date: string, text: string, priority?: string) => ipcRenderer.invoke('todos:create', date, text, priority),
  toggleTodo: (id: string) => ipcRenderer.invoke('todos:toggle', id),
  updateTodo: (id: string, text: string, priority?: string) => ipcRenderer.invoke('todos:update', id, text, priority),
  deleteTodo: (id: string) => ipcRenderer.invoke('todos:delete', id),
  rolloverTodos: (fromDate: string, toDate: string) => ipcRenderer.invoke('todos:rollover', fromDate, toDate),

  getDailyLog: (date: string) => ipcRenderer.invoke('daily-log:get', date),
  saveDailyLog: (date: string, content: string, standupSummary?: string) => ipcRenderer.invoke('daily-log:save', date, content, standupSummary),

  getGeneralNotes: () => ipcRenderer.invoke('notes:get-all'),
  createGeneralNote: (title: string, content: string, tags?: string) => ipcRenderer.invoke('notes:create', title, content, tags),
  updateGeneralNote: (id: string, title: string, content: string, tags?: string) => ipcRenderer.invoke('notes:update', id, title, content, tags),
  deleteGeneralNote: (id: string) => ipcRenderer.invoke('notes:delete', id),
  togglePinGeneralNote: (id: string) => ipcRenderer.invoke('notes:toggle-pin', id),
};

contextBridge.exposeInMainWorld('electronAPI', api);
