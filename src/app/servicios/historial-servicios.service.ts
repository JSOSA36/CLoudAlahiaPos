import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  HistorialServicioCliente,
  UltimoServicioCliente
} from '../models/historial-servicio.models';

@Injectable({
  providedIn: 'root'
})
export class HistorialServiciosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/HistorialServicios`;
  }

  getHistorial(
    idEmpresa: number,
    idCliente: number,
    desde?: string,
    hasta?: string
  ): Observable<HistorialServicioCliente[]> {
    let params = new HttpParams()
      .set('idEmpresa', String(idEmpresa))
      .set('idCliente', String(idCliente));

    if (desde) {
      params = params.set('desde', desde);
    }

    if (hasta) {
      params = params.set('hasta', hasta);
    }

    return this.http.get<HistorialServicioCliente[]>(this.baseUrl, { params });
  }

  getUltimoServicio(
    idEmpresa: number,
    idCliente: number
  ): Observable<UltimoServicioCliente> {
    const params = new HttpParams()
      .set('idEmpresa', String(idEmpresa))
      .set('idCliente', String(idCliente));

    return this.http.get<UltimoServicioCliente>(`${this.baseUrl}/ultimo`, { params });
  }
}
