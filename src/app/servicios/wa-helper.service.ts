import { Injectable } from '@angular/core';

export interface WaOpenOptions {
  /** Reusar la misma pestaña (default: true) */
  reuse?: boolean;
  /** Nombre del target de la ventana (default: 'wa_chat_window') */
  targetName?: string;
  /** Usar api.whatsapp.com en lugar de wa.me (default: false) */
  preferApi?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WaHelperService {
  private waRef: Window | null = null;
  private defaultTarget = 'wa_chat_window';

  /**
   * Abre el chat de WhatsApp Web para el número E.164 SIN '+' (ej: "18095551234").
   * Devuelve `true` si el navegador permitió abrir/navegar la pestaña (no bloqueó popup).
   * IMPORTANTE: Llama esto dentro de un gesto del usuario (click/tap) para evitar bloqueos.
   */
  openChat(phoneE164NoPlus: string, text?: string, opts?: WaOpenOptions): boolean {
    const msg = encodeURIComponent(text || '');
    const useApi = !!opts?.preferApi;

    // Ambas funcionan, wa.me redirige a web/app según plataforma
    const url = useApi
      ? `https://api.whatsapp.com/send?phone=${phoneE164NoPlus}&text=${msg}`
      : `https://wa.me/${phoneE164NoPlus}?text=${msg}`;

    const reuse = opts?.reuse !== false;
    const target = opts?.targetName || this.defaultTarget;

    // Reusar SIEMPRE la misma pestaña que abrimos nosotros
    if (reuse && this.waRef && !this.waRef.closed) {
      try {
        this.waRef.location.href = url; // navega la pestaña ya abierta
        this.waRef.focus();
        return true;
      } catch {
        // si hay restricción de cross-origin, reabrimos más abajo
      }
    }

    // Abrir (o reabrir) una pestaña con nombre fijo -> el navegador la reutiliza
    const w = window.open(url, target);
    this.waRef = w ?? null;
    return !!w;
  }
}
