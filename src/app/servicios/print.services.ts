import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { ModalController } from '@ionic/angular';

import { ParametrosService }
from './parametros.service';

import { CotizacionPrintComponent }
from '../cotizacion-print/cotizacion-print.component';

import { MovimientoInventarioPrintComponent }
from '../movimiento-inventario-print/movimiento-inventario-print.component';

import { NotaCreditoPreviewComponent }
from '../nota-credito-preview/nota-credito-preview.component';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor(
    private http: HttpClient,
    private parametros: ParametrosService,
    private modalCtrl: ModalController
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

  async openCotizacionCarta(
    cotizacion: any
  ): Promise<void> {

    const modal = await this.modalCtrl.create({
      component: CotizacionPrintComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        cotizacion,
        empresa: this.parametros._Empresa,
        nombreEmpresa: this.parametros.NombreEmpresa
      }
    });

    await modal.present();
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