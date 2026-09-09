import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ReporteVentaFacturas, ReporteVentaProductos } from '../models/reporte-venta.models';

@Injectable({ providedIn: 'root' })
export class ReporteVentaService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/ReporteVenta`;
  }

  facturas(idEmpresa: number, desde: string, hasta: string, idSucursalFiltro = 0): Observable<ReporteVentaFacturas> {
    const params = new HttpParams()
      .set('idEmpresa', String(idEmpresa))
      .set('desde', desde)
      .set('hasta', hasta)
      .set('idSucursalFiltro', String(idSucursalFiltro || 0));
    return this.http.get<ReporteVentaFacturas>(`${this.baseUrl}/facturas`, { params });
  }

  productos(idEmpresa: number, desde: string, hasta: string, idSucursalFiltro = 0): Observable<ReporteVentaProductos> {
    const params = new HttpParams()
      .set('idEmpresa', String(idEmpresa))
      .set('desde', desde)
      .set('hasta', hasta)
      .set('idSucursalFiltro', String(idSucursalFiltro || 0));
    return this.http.get<ReporteVentaProductos>(`${this.baseUrl}/productos`, { params });
  }
}
