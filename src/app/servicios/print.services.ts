import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { firstValueFrom, Observable, of, throwError, timeout } from 'rxjs';
import { ModalController } from '@ionic/angular';

import { ParametrosService }
from './parametros.service';

import { CotizacionPrintComponent }
from '../cotizacion-print/cotizacion-print.component';

import { MovimientoInventarioPrintComponent }
from '../movimiento-inventario-print/movimiento-inventario-print.component';

import { NotaCreditoPreviewComponent }
from '../nota-credito-preview/nota-credito-preview.component';

import { PrinterComponent }
from '../printer/printer.component';

import { FacturaHeaderService }
from './factura-header.service';

import { EmpresaService }
from './empresa.services';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor(
    private http: HttpClient,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private facturaHeader: FacturaHeaderService,
    private empresaSrv: EmpresaService
  ) {}

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  private get apiPrint(): string {
    return (this.parametros.ApiPrint || '').trim().replace(/\/$/, '');
  }

  private ensureApiPrint(): string {
    const api = this.apiPrint;
    if (!api) {
      console.error('❌ ApiPrint no configurado');
      throw new Error('ApiPrint vacío');
    }
    return api;
  }

  /**
   * HTTPS (POS nube) → HTTP ApiPrint en IP LAN: Chrome bloquea XHR (Mixed Content).
   * localhost/127.0.0.1 no aplica ese bloqueo en la misma máquina.
   */
  private needsNavPrint(apiBase: string): boolean {
    if (typeof location === 'undefined' || location.protocol !== 'https:') {
      return false;
    }
    try {
      const u = new URL(apiBase);
      if (u.protocol !== 'http:') {
        return false;
      }
      const host = u.hostname.toLowerCase();
      return host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]';
    } catch {
      return false;
    }
  }

  /**
   * Navegación top-level (no XHR): llega al PrinterApi aunque el POS sea HTTPS.
   * El agente responde HTML corto con ?nav=1 y cierra la pestaña.
   */
  private printViaNavigation(url: string): Observable<any> {
    const navUrl = url.includes('?') ? `${url}&nav=1` : `${url}?nav=1`;
    try {
      const opened = window.open(
        navUrl,
        'alahia_printer_agent',
        'noopener,noreferrer,width=160,height=100'
      );
      if (!opened) {
        const a = document.createElement('a');
        a.href = navUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Print via navigation failed', err);
      return of({ success: false, via: 'navigation', error: String(err) });
    }
    return of({ success: true, via: 'navigation' });
  }

  /** GET al agente local: XHR normal, o navegación si Mixed Content bloquearía. */
  private agentGet(path: string): Observable<any> {
    const api = this.ensureApiPrint();
    const url = `${api}${path.startsWith('/') ? path : `/${path}`}`;
    if (this.needsNavPrint(api)) {
      return this.printViaNavigation(url);
    }
    return this.http.get(url, { withCredentials: false });
  }

// =========================================
// 🔥 PRINT CIERRE CAJA
// =========================================

printCierre(
  idCajaCierre: number
): Observable<any> {
  return this.agentGet(`/api/Printer/cierre/${idCajaCierre}`);
}

  // =========================================
  // 🔥 PRINT GENERAL
  // =========================================
// =========================================
// 🔥 PRINT CIERRE ENCARGOS
// =========================================

printCierreEncargos(
  idEmpresa: number
): Observable<any> {
  return this.agentGet(`/api/Printer/cierre-encargos/${idEmpresa}`);
}

  printTicket(
    idFacturaHeader: number,
    idEmpresa: number
  ): Observable<any> {
    return this.agentGet(
      `/api/Printer/ticket/${idFacturaHeader}/${idEmpresa}`
    );
  }

  /** Ticket térmico factura cliente (TOTAL / PAGADO / PENDIENTE). */
  printFacturaCliente(idFactura: number): Observable<any> {
    return this.agentGet(`/api/Printer/factura/${idFactura}`);
  }

  /** Recibo de abono CxC para el cliente. */
  printReciboAbono(idPago: number): Observable<any> {
    return this.agentGet(`/api/Printer/recibo-abono/${idPago}`);
  }

  /**
   * Vista previa ticket térmico 80mm + print del navegador (tablet / impresora portátil).
   * Si se pasa facturaLocal (snapshot del POS), no depende de GetFactura.
   */
  async openTicketPosPreview(
    idFacturaHeader: number,
    facturaLocal?: any
  ): Promise<void> {
    let raw = facturaLocal;

    if (!raw) {
      const rows = await firstValueFrom(
        this.facturaHeader.PrintFact(idFacturaHeader)
      );
      raw = Array.isArray(rows) ? rows[0] : rows;
    }

    if (!raw) {
      throw new Error('No se pudo cargar la factura para imprimir');
    }

    const emp = this.parametros._Empresa as any;
    const factura = {
      ...raw,
      idFacturaHeader:
        raw.idFacturaHeader || idFacturaHeader,
      empresa:
        raw.empresa ||
        emp?.nombreComercial ||
        this.parametros.NombreEmpresa ||
        'Mi Empresa',
      direccion: raw.direccion || emp?.direccion || '',
      telefono: raw.telefono || emp?.telefono || '',
      rnc: raw.rnc || emp?.rnc || ''
    };

    const modal = await this.modalCtrl.create({
      component: PrinterComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        factura,
        forzarVistaPos: true
      }
    });

    await modal.present();
  }

  async openCotizacionCarta(
    cotizacion: any,
    autoImprimir = false
  ): Promise<void> {
    const empresa = await this.resolverEmpresaDocumento();

    const modal = await this.modalCtrl.create({
      component: CotizacionPrintComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        cotizacion,
        empresa,
        nombreEmpresa:
          empresa?.nombreComercial ||
          this.parametros.NombreEmpresa,
        autoImprimir
      }
    });

    await modal.present();
  }

  /**
   * Garantiza RNC/dirección/teléfono para documentos.
   * Si la sesión solo tiene el nombre (login viejo), recarga la empresa.
   */
  private async resolverEmpresaDocumento(): Promise<any> {
    let emp = this.empresaParaDocumento();
    const incompleta =
      !emp ||
      (!String(emp.rnc || emp.RNC || '').trim() &&
        !String(emp.direccion || emp.Direccion || '').trim() &&
        !String(emp.telefono || emp.Telefono || '').trim());

    const idEmpresa =
      emp?.idEmpresa ||
      emp?.IdEmpresa ||
      this.parametros.IdEmpresa ||
      0;

    if (incompleta && idEmpresa > 0) {
      try {
        const full = await firstValueFrom(this.empresaSrv.getEmpresa(idEmpresa));
        if (full) {
          this.parametros._Empresa = {
            ...(this.parametros._Empresa || ({} as any)),
            ...full,
            logoUrl: (full as any).logoUrl || full.logo || ''
          } as any;
          if (full.nombreComercial) {
            this.parametros.NombreEmpresa = full.nombreComercial;
          }
          emp = this.empresaParaDocumento();
        }
      } catch (e) {
        console.warn('No se pudo recargar empresa para documento', e);
      }
    }

    return emp;
  }

  /** Copia de empresa para documentos: sin logo si la empresa no tiene uno propio. */
  private empresaParaDocumento(): any {
    const src = this.parametros._Empresa as any;
    if (!src) {
      return undefined;
    }

    const copia = { ...src };
    const logo = String(copia.logo || copia.logoUrl || '').trim();

    // Sin logo, o logo compartido erróneo (Total Clean) asignado a otra empresa.
    const sinLogo =
      !logo ||
      /7a8a3d84-ee21-4781-848e-a70b7c23cccd/i.test(logo);

    if (sinLogo) {
      copia.logo = undefined;
      copia.logoUrl = undefined;
    }

    return copia;
  }

  async openMovimientoInventarioCarta(
    movimiento: any
  ): Promise<void> {

    const modal = await this.modalCtrl.create({
      component: MovimientoInventarioPrintComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        movimiento,
        empresa: this.parametros._Empresa,
        nombreEmpresa: this.parametros.NombreEmpresa
      }
    });

    await modal.present();
  }

  async openNotaCreditoPreview(
    ticket: any
  ): Promise<void> {

    const modal = await this.modalCtrl.create({
      component: NotaCreditoPreviewComponent,
      cssClass: 'modal-fullscreen',
      componentProps: { ticket }
    });

    await modal.present();
  }

  // =========================================
  // 🔥 PRINT LAVADOR
  // =========================================

  printLavador(
    idFacturaHeader: number
  ): Observable<any> {
    return this.agentGet(`/api/Printer/lavador/${idFacturaHeader}`);
  }

  // =========================================
  // 🔥 PDF
  // =========================================

  printFacturaPDF(
    idFactura: number
  ): Observable<any> {
    return this.agentGet(`/api/Printer/facturaPDF/${idFactura}`);
  }

  printNotaCredito(
    idNotaCredito: number,
    idEmpresa: number
  ): Observable<any> {
    return this.agentGet(
      `/api/Printer/nota-credito/${idNotaCredito}/${idEmpresa}`
    );
  }

  // =========================================
  // 🔥 TEST API / VERSION AGENTE
  // =========================================

  /** Ping a una URL concreta (localhost / 127.0.0.1 / ApiPrint guardado). */
  pingAt(baseUrl: string): Observable<PrinterAgentStatus> {
    const api = (baseUrl || '').trim().replace(/\/$/, '');
    if (!api) {
      return throwError(() => new Error('ApiPrint vacío'));
    }
    return this.http.get<PrinterAgentStatus>(
      `${api}/api/Printer/ping`,
      { withCredentials: false }
    ).pipe(timeout(2500));
  }

  ping(): Observable<PrinterAgentStatus> {
    return this.pingAt(this.apiPrint);
  }

  version(): Observable<PrinterAgentStatus> {
    const api = this.apiPrint;
    if (!api) {
      return throwError(() => new Error('ApiPrint vacío'));
    }
    return this.http.get<PrinterAgentStatus>(
      `${api}/api/Printer/version`,
      { withCredentials: false }
    ).pipe(timeout(2500));
  }

  getPrinterSettingsAt(baseUrl: string): Observable<PrinterAgentSettings> {
    const api = (baseUrl || '').trim().replace(/\/$/, '');
    if (!api) {
      return throwError(() => new Error('ApiPrint vacío'));
    }
    return this.http.get<PrinterAgentSettings>(
      `${api}/api/Printer/settings`,
      { withCredentials: false }
    ).pipe(timeout(4000));
  }

  getPrinterSettings(): Observable<PrinterAgentSettings> {
    return this.getPrinterSettingsAt(this.apiPrint);
  }

  savePrinterSettings(factura: string, lavador?: string): Observable<PrinterAgentSettings> {
    return this.http.put<PrinterAgentSettings>(
      `${this.apiPrint}/api/Printer/settings`,
      { factura, lavador: lavador || factura },
      { withCredentials: false }
    );
  }
}

export interface PrinterAgentStatus {
  success?: boolean;
  ok?: boolean;
  message?: string;
  version?: string;
  port?: number;
  serviceName?: string;
  machineName?: string;
  utc?: string;
}

export interface PrinterAgentSettings {
  success?: boolean;
  message?: string;
  factura?: string;
  lavador?: string;
  localConfigPath?: string;
  printers?: string[];
}