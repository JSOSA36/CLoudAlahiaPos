import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParametrosService } from './parametros.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor(
    private http: HttpClient,
    private parametros: ParametrosService
  ) {}
 private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  private get apiPrint(): string {
    return this.parametros.ApiPrint || '';
  }

  // ============================
  // 🔹 PRINT FACTURA CLIENTE
  // ============================
  printFactura(idFactura: number): Observable<any> {

    if (!this.apiPrint) {
      console.error("❌ ApiPrint no configurado");
      throw new Error("ApiPrint vacío");
    }

    return this.http.get(
      `${this.apiPrint}/api/Printer/factura/${idFactura}`,
      { withCredentials: false } // 🔥 LA LÍNEA QUE ARREGLA TODO
    );
  }

  // ============================
  // 🔹 PRINT TICKET LAVADOR
  // ============================
  printLavador(idFacturaHeader: number): Observable<any> {

    if (!this.apiPrint) {
      console.error("❌ ApiPrint no configurado");
      throw new Error("ApiPrint vacío");
    }

    return this.http.get(
      `${this.apiPrint}/api/Printer/lavador/${idFacturaHeader}`,
      { withCredentials: false } // 🔥 CLAVE
    );
  }

  // ============================
  // 🔹 TEST API
  // ============================
  ping(): Observable<any> {
    return this.http.get(
      `${this.apiPrint}/api/printer/ping`,
      { withCredentials: false } // 🔥 también aquí
    );
  }
}