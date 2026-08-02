import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { firstValueFrom, Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor(
    private http: HttpClient,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private facturaHeader: FacturaHeaderService
  ) {}

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
// =========================================
// 🔥 PRINT CIERRE CAJA
// =========================================

printCierre(
  idCajaCierre: number
): Observable<any> {

  if (!this.apiPrint) {

    console.error(
      "❌ ApiPrint no configurado"
    );

    throw new Error(
      "ApiPrint vacío"
    );
  }

  return this.http.get(

    `${this.apiPrint}` +

    `/api/Printer/cierre/` +

    `${idCajaCierre}`,

    {
      withCredentials: false
    }
  );
}
  private get apiPrint(): string {

    return this.parametros.ApiPrint || '';
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

  if (!this.apiPrint) {

    console.error(
      "❌ ApiPrint no configurado"
    );

    throw new Error(
      "ApiPrint vacío"
    );
  }

  return this.http.get(

    `${this.apiPrint}` +

    `/api/Printer/cierre-encargos/` +

    `${idEmpresa}`,

    {
      withCredentials: false
    }
  );
}
  printTicket(
    idFacturaHeader: number,
    idEmpresa: number
  ): Observable<any> {

    if (!this.apiPrint) {

      console.error(
        "❌ ApiPrint no configurado"
      );

      throw new Error(
        "ApiPrint vacío"
      );
    }

    return this.http.get(

      `${this.apiPrint}` +

      `/api/Printer/ticket/` +

      `${idFacturaHeader}/` +

      `${idEmpresa}`,

      {
        withCredentials: false
      }
    );
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
    cotizacion: any
  ): Promise<void> {
    const empresa = this.empresaParaDocumento();

    const modal = await this.modalCtrl.create({
      component: CotizacionPrintComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        cotizacion,
        empresa,
        nombreEmpresa: this.parametros.NombreEmpresa
      }
    });

    await modal.present();
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
      src.logo = undefined;
      src.logoUrl = undefined;
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

    if (!this.apiPrint) {

      console.error(
        "❌ ApiPrint no configurado"
      );

      throw new Error(
        "ApiPrint vacío"
      );
    }

    return this.http.get(

      `${this.apiPrint}` +

      `/api/Printer/lavador/` +

      `${idFacturaHeader}`,

      {
        withCredentials: false
      }
    );
  }

  // =========================================
  // 🔥 PDF
  // =========================================

  printFacturaPDF(
    idFactura: number
  ): Observable<any> {

    if (!this.apiPrint) {

      console.error(
        "❌ ApiPrint no configurado"
      );

      throw new Error(
        "ApiPrint vacío"
      );
    }

    return this.http.get(

      `${this.apiPrint}` +

      `/api/Printer/facturaPDF/` +

      `${idFactura}`,

      {
        withCredentials: false
      }
    );
  }

  printNotaCredito(
    idNotaCredito: number,
    idEmpresa: number
  ): Observable<any> {

    if (!this.apiPrint) {

      console.error(
        "❌ ApiPrint no configurado"
      );

      throw new Error(
        "ApiPrint vacío"
      );
    }

    return this.http.get(

      `${this.apiPrint}` +

      `/api/Printer/nota-credito/` +

      `${idNotaCredito}/` +

      `${idEmpresa}`,

      {
        withCredentials: false
      }
    );
  }

  // =========================================
  // 🔥 TEST API
  // =========================================

  ping(): Observable<any> {

    return this.http.get(

      `${this.apiPrint}` +

      `/api/Printer/ping`,

      {
        withCredentials: false
      }
    );
  }
}