import { Injectable } from '@angular/core';

export interface WaOpenOptions {
  /** Reusar la misma pestaña abierta por Alahia (default: true) */
  reuse?: boolean;
  /** Nombre del target de la ventana (default: 'whatsapp_web') */
  targetName?: string;
  /**
   * 'web' = WhatsApp Web.
   * 'api' = api.whatsapp.com.
   * 'auto' = web en escritorio, wa.me en móvil (default).
   */
  mode?: 'auto' | 'web' | 'api';
}

@Injectable({ providedIn: 'root' })
export class WaHelperService {
  private waRef: Window | null = null;
  private defaultTarget = 'whatsapp_web';

  /** True si Alahia ya tiene una pestaña de WhatsApp bajo su control. */
  hasManagedWindow(): boolean {
    return !!(this.waRef && !this.waRef.closed);
  }

  /**
   * Abre o reutiliza el chat. Solo reutiliza pestañas abiertas antes por Alahia
   * (el navegador no permite saltar a una pestaña de WhatsApp abierta a mano).
   */
  openChat(phoneE164NoPlus: string, text?: string, opts?: WaOpenOptions): boolean {
    const phone = (phoneE164NoPlus || '').replace(/\D/g, '');
    if (!phone) {
      return this.openCompose(text, opts);
    }

    const msg = encodeURIComponent(text || '');
    const url = this.buildUrl({ phone, msg, mode: opts?.mode });
    return this.navigate(url, opts);
  }

  openCompose(text?: string, opts?: WaOpenOptions): boolean {
    const msg = encodeURIComponent(text || '');
    const url = this.buildUrl({ msg, mode: opts?.mode });
    return this.navigate(url, opts);
  }

  /**
   * Si ya hay pestaña gestionada por Alahia → navega ahí.
   * Si no → no abre pestaña nueva (evita duplicar WhatsApp Web).
   * Devuelve 'focused' | 'none'.
   */
  focusManagedOrNone(
    phoneE164NoPlus: string | null,
    text?: string,
    opts?: WaOpenOptions
  ): 'focused' | 'none' {
    if (!this.hasManagedWindow()) {
      return 'none';
    }

    const phone = (phoneE164NoPlus || '').replace(/\D/g, '');
    const msg = encodeURIComponent(text || '');
    const url = phone
      ? this.buildUrl({ phone, msg, mode: opts?.mode || 'web' })
      : this.buildUrl({ msg, mode: opts?.mode || 'web' });

    return this.navigate(url, { ...opts, reuse: true }) ? 'focused' : 'none';
  }

  private buildUrl(args: {
    phone?: string;
    msg: string;
    mode?: WaOpenOptions['mode'];
  }): string {
    const mode = args.mode || 'auto';
    const useWeb = mode === 'web' || (mode === 'auto' && this.isDesktop());
    const phone = args.phone || '';

    if (useWeb) {
      return phone
        ? `https://web.whatsapp.com/send?phone=${phone}&text=${args.msg}`
        : `https://web.whatsapp.com/send?text=${args.msg}`;
    }

    if (mode === 'api') {
      return phone
        ? `https://api.whatsapp.com/send?phone=${phone}&text=${args.msg}`
        : `https://api.whatsapp.com/send?text=${args.msg}`;
    }

    return phone
      ? `https://wa.me/${phone}?text=${args.msg}`
      : `https://wa.me/?text=${args.msg}`;
  }

  private navigate(url: string, opts?: WaOpenOptions): boolean {
    const reuse = opts?.reuse !== false;
    const target = opts?.targetName || this.defaultTarget;

    // Patrón: obtener/crear ventana con nombre fijo y luego navegar.
    // Así los siguientes clics reutilizan la misma pestaña de Alahia.
    if (reuse) {
      try {
        const w = window.open('', target);
        if (w) {
          this.waRef = w;
          w.location.href = url;
          w.focus();
          return true;
        }
      } catch {
        // fallback abajo
      }
    }

    const w = window.open(url, target);
    this.waRef = w ?? null;
    return !!w;
  }

  private isDesktop(): boolean {
    if (typeof navigator === 'undefined') {
      return true;
    }
    return !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  }
}
