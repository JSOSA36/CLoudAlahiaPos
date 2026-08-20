import { Injectable } from '@angular/core';

/** Versión mínima del agente local recomendada por este build del ERP. */
export const PRINTER_AGENT_MIN_VERSION = '1.0.7';

/** Carpeta de releases (latest.json + zips de update). */
export const PRINTER_AGENT_DOWNLOAD_URL =
  'https://alahiaposapidemo.alahiapos.com/updates/printer/';

/**
 * Paquete instalable para el cliente (nombre estable).
 * Debe publicarse junto con AlahiaPrinterAgent-Setup-{version}.zip.
 */
export const PRINTER_AGENT_SETUP_ZIP_URL =
  'https://alahiaposapidemo.alahiapos.com/updates/printer/AlahiaPrinterAgent-Setup.zip';

export const PRINTER_AGENT_GUIDE_ROUTE = '/impresion-termica';

@Injectable({ providedIn: 'root' })
export class PrinterAgentService {
  /** Semver simple: true si actual < minimo. */
  isOlder(actual: string, minimo: string): boolean {
    const a = this.parse(actual);
    const b = this.parse(minimo);
    for (let i = 0; i < 3; i++) {
      if (a[i] < b[i]) return true;
      if (a[i] > b[i]) return false;
    }
    return false;
  }

  private parse(v: string): number[] {
    const clean = (v || '').split('+')[0].trim();
    const parts = clean.split('.').map((x) => parseInt(x, 10) || 0);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  }
}
