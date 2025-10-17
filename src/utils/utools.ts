type GlobalWithUTools = typeof globalThis & { utools?: unknown };

export interface UToolsDbStorage {
  getItem<T = unknown>(key: string): T | undefined;
  setItem(key: string, value: unknown): void;
  removeItem(key: string): void;
}

export interface UToolsApi {
  dbStorage?: UToolsDbStorage;
  showNotification?(message: string): void;
  redirect?(code: string, payload?: unknown): void;
  onPluginEnter?(handler: (action: any) => void): void;
  onPluginOut?(handler: (isUnload?: boolean) => void): void;
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
