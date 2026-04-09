import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalCacheService {

  // ====== GENERICOS ======
  set<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  // ====== HELPERS ======
  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}
