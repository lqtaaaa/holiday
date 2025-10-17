import { getUtools } from "./utools";

export function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const utools = getUtools();
    if (utools?.dbStorage) {
      const value = utools.dbStorage.getItem(key);
      if (value === undefined || value === null) return fallback;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return parsed ?? fallback;
        } catch (error) {
          console.warn('[storage:get] parse string failed', key, error);
          return (value as unknown as T) ?? fallback;
        }
      }
      return value as T;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (error) {
      console.warn('[storage:get] parse local string failed', key, error);
      return fallback;
    }
  } catch (error) {
    console.error('[storage:get]', key, error);
    return fallback;
  }
}

export function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    const utools = getUtools();
    if (utools?.dbStorage) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      utools.dbStorage.setItem(key, serialized);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[storage:set]', key, error);
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const utools = getUtools();
    if (utools?.dbStorage) {
      utools.dbStorage.removeItem(key);
      return;
    }
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('[storage:remove]', key, error);
  }
}
