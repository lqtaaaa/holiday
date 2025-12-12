type GlobalWithUTools = typeof globalThis & { utools?: unknown };

export interface UToolsDbStorage {
  getItem<T = unknown>(key: string): T | undefined;
  setItem(key: string, value: unknown): void;
  removeItem(key: string): void;
}

// Electron Display bounds 类型
export interface DisplayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Electron Display 类型
export interface Display {
  bounds: DisplayBounds;
  workArea: DisplayBounds;
  scaleFactor: number;
  rotation: number;
  id: number;
}

// BrowserWindow 实例类型（简化版）
export interface UToolsBrowserWindow {
  show(): void;
  close(): void;
  setBounds(bounds: DisplayBounds): void;
  setAlwaysOnTop(flag: boolean): void;
  setFullScreen(flag: boolean): void;
  webContents: {
    send(channel: string, ...args: unknown[]): void;
  };
}

// BrowserWindow 创建选项
export interface BrowserWindowOptions {
  show?: boolean;
  transparent?: boolean;
  frame?: boolean;
  skipTaskbar?: boolean;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  alwaysOnTop?: boolean;
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  webPreferences?: {
    preload?: string;
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
  };
}

export interface UToolsApi {
  dbStorage?: UToolsDbStorage;
  showNotification?(message: string): void;
  redirect?(code: string, payload?: unknown): void;
  onPluginEnter?(handler: (action: any) => void): void;
  onPluginOut?(handler: (isUnload?: boolean) => void): void;
  // Screen API
  getAllDisplays?(): Display[];
  getPrimaryDisplay?(): Display;
  // Window API
  createBrowserWindow?(
    url: string,
    options: BrowserWindowOptions,
    callback?: () => void
  ): UToolsBrowserWindow;
}

export function getUtools(): UToolsApi | null {
  const api = (globalThis as GlobalWithUTools).utools as UToolsApi | undefined;
  return api ?? null;
}

export function withUtools<T>(handler: (api: UToolsApi) => T): T | null {
  const api = getUtools();
  if (api) {
    return handler(api);
  }
  return null;
}
