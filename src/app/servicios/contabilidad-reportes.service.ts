import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  BalanceComprobacionResumen,
  EstadoResultados,
  BalanceGeneral
} from '../models/ContabilidadReportes.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadReportesService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/ContabilidadReportes`;
  }

  getBalanceComprobacion(idEmpresa: number, desde: string, hasta: string): Observable<BalanceComprobacionResumen> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<BalanceComprobacionResumen>(`${this.baseUrl}/balance-comprobacion/${idEmpresa}`, { params });
  }

  getEstadoResultados(idEmpresa: number, desde: string, hasta: string): Observable<EstadoResultados> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<EstadoResultados>(`${this.baseUrl}/estado-resultados/${idEmpresa}`, { params });
  }

  getBalanceGeneral(idEmpresa: number, fechaCorte: string): Observable<BalanceGeneral> {
    const params = new HttpParams().set('fechaCorte', fechaCorte);
    return this.http.get<BalanceGeneral>(`${this.baseUrl}/balance-general/${idEmpresa}`, { params });
  }
}
