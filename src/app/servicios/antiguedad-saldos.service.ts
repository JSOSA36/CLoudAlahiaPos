import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  AntiguedadSaldosFiltro,
  AntiguedadSaldosReporte,
} from '../models/antiguedad-saldos.models';

@Injectable({ providedIn: 'root' })
export class AntiguedadSaldosService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/AntiguedadSaldos`;
  }

  cxc(idEmpresa: number, filtro: AntiguedadSaldosFiltro = {}): Observable<AntiguedadSaldosReporte> {
    return this.http.get<AntiguedadSaldosReporte>(
      `${this.baseUrl}/CxC/${idEmpresa}`,
      { params: this.buildParams(filtro) }
    );
  }

  cxp(idEmpresa: number, filtro: AntiguedadSaldosFiltro = {}): Observable<AntiguedadSaldosReporte> {
    return this.http.get<AntiguedadSaldosReporte>(
      `${this.baseUrl}/CxP/${idEmpresa}`,
      { params: this.buildParams(filtro) }
    );
  }

  private buildParams(filtro: AntiguedadSaldosFiltro): HttpParams {
    let params = new HttpParams();
    if (filtro.idTercero && filtro.idTercero > 0) {
      params = params.set('idTercero', String(filtro.idTercero));
    }
    if (filtro.documento?.trim()) {
      params = params.set('documento', filtro.documento.trim());
    }
    if (filtro.fechaDesde) params = params.set('fechaDesde', filtro.fechaDesde);
    if (filtro.fechaHasta) params = params.set('fechaHasta', filtro.fechaHasta);
    if (filtro.fechaCorte) params = params.set('fechaCorte', filtro.fechaCorte);
    params = params.set('soloVencidas', String(!!filtro.soloVencidas));
    params = params.set('soloPendientes', String(filtro.soloPendientes !== false));
    params = params.set('idSucursalFiltro', String(filtro.idSucursalFiltro || 0));
    return params;
  }
}
