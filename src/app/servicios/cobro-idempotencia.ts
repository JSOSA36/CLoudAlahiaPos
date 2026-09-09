import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export const PROCESAR_FACTURA_TIMEOUT_MS = 60_000;
export const PROCESAR_FACTURA_REINTENTOS_RED = 2;

/**
 * Un intento lógico de cobro POS. La clave se genera una vez y se reutiliza
 * en retry de red / timeout. No se reutiliza en una venta nueva.
 */
export class CobroIntento {
  private clave: string | null = null;
  private impresionHecha = false;

  asegurarClave(): string {
    if (!this.clave) {
      this.clave = crearGuidCobro();
      this.impresionHecha = false;
    }
    return this.clave;
  }

  claveActual(): string | null {
    return this.clave;
  }

  /** Primera impresión de este intento. Un retry idempotente no imprime otra vez. */
  consumirImpresion(): boolean {
    if (this.impresionHecha) {
      return false;
    }
    this.impresionHecha = true;
    return true;
  }

  yaImprimio(): boolean {
    return this.impresionHecha;
  }

  /** Cobro confirmado por el backend (incluye idempotente: true). */
  confirmarExito(): void {
    this.clave = null;
  }

  /** 4xx de negocio: la venta no quedó; el próximo cobro es otro intento. */
  descartarPorErrorNegocio(): void {
    this.clave = null;
    this.impresionHecha = false;
  }

  /** Carrito vacío / documento distinto: no reutilizar la clave. */
  nuevaVenta(): void {
    this.clave = null;
    this.impresionHecha = false;
  }
}

export function crearGuidCobro(): string {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function esErrorRedCobro(err: unknown): boolean {
  if (!err) {
    return false;
  }
  if (err instanceof TimeoutError || (err as { name?: string }).name === 'TimeoutError') {
    return true;
  }
  if (err instanceof HttpErrorResponse) {
    return err.status === 0
      || err.status === 408
      || err.status === 502
      || err.status === 503
      || err.status === 504;
  }
  const status = (err as { status?: number }).status;
  return status === 0 || status === 408 || status === 502 || status === 503 || status === 504;
}

export function esVentaProcesada(resp: unknown): boolean {
  if (!resp || typeof resp !== 'object') {
    return false;
  }
  const body = resp as { idFactura?: number; id?: number; idempotente?: boolean };
  const id = Number(body.idFactura ?? body.id);
  if (Number.isFinite(id) && id > 0) {
    return true;
  }
  return body.idempotente === true;
}

export function esRespuestaIdempotente(resp: unknown): boolean {
  return !!(resp && typeof resp === 'object' && (resp as { idempotente?: boolean }).idempotente === true);
}
