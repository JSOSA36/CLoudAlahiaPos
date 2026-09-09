import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export interface PosDeviceInfo {
  deviceId: string;
  plataforma: string;
  modelo: string;
  fabricante: string;
  nombre: string;
}

const STORAGE_KEY = 'pos_device_id';
const LEGACY_KEY = 'device_id';

@Injectable({ providedIn: 'root' })
export class PosDeviceService {
  private cache: PosDeviceInfo | null = null;

  deviceIdSincrono(): string {
    return this.cache?.deviceId
      || localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem(LEGACY_KEY)
      || '';
  }

  async obtenerInfo(): Promise<PosDeviceInfo> {
    if (this.cache?.deviceId) return this.cache;

    let plataforma = Capacitor.getPlatform?.() || 'web';
    let modelo = '';
    let fabricante = '';
    let nativeId = '';

    try {
      const info = await Device.getInfo();
      plataforma = info.platform || plataforma;
      modelo = info.model || '';
      fabricante = info.manufacturer || '';
    } catch { /* web sin plugin */ }

    try {
      const id = await Device.getId();
      nativeId = (id?.identifier || '').trim();
    } catch { /* web: UUID local */ }

    const storedLs = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY) || '';
    const storedCookie = leerCookie(STORAGE_KEY);
    const deviceId = nativeId
      || storedLs
      || storedCookie
      || (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `web-${Date.now()}`);

    this.persistir(deviceId);

    const nombreBase = [fabricante, modelo].map(s => (s || '').trim()).filter(Boolean).join(' ')
      || plataforma
      || 'PC';

    this.cache = {
      deviceId,
      plataforma,
      modelo,
      fabricante,
      nombre: `POS · ${nombreBase}`
    };
    return this.cache;
  }

  private persistir(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, id);
      localStorage.setItem(LEGACY_KEY, id);
    } catch { /* ignore */ }
    try {
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch { /* ignore */ }
  }
}

function leerCookie(name: string): string {
  try {
    const match = document.cookie.split(';').map(s => s.trim())
      .find(s => s.startsWith(name + '='));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
  } catch {
    return '';
  }
}
