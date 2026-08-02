/* =========================================
🔥 MOVIMIENTO FINANCIERO SERVICE
src/app/servicios/movimiento-financiero.service.ts
========================================= */

import {
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  AppConfigService
} from './app-config.service';

import {
  MovimientoFinanciero
} from '../models/MovimientoFinanciero.models';

import {
  AnularMovimientoPayload,
  EstadoCuenta,
  MovimientoFinancieroFiltro,
  MovimientoFinancieroListado,
  RegistrarAjustePayload
} from '../models/Tesoreria.models';

@Injectable({
  providedIn:'root'
})
export class MovimientoFinancieroService {

  private readonly baseUrl:string;

  constructor(

    private http:HttpClient,

    private config:AppConfigService
  ){
    this.baseUrl =
      `${this.config.apiUrl}/MovimientoFinanciero`;
  }

  /* =====================================
  🔥 GET EMPRESA
  ====================================== */

  getByEmpresa(
    idEmpresa:number
  ): Observable<MovimientoFinanciero[]>
  {
    return this.http.get<MovimientoFinanciero[]>(

      `${this.baseUrl}/${idEmpresa}`
    );
  }

  /* =====================================
  🔥 GET BY CUENTA
  ====================================== */

  getByCuenta(
    idCuentaFinanciera:number
  ): Observable<MovimientoFinanciero[]>
  {
    return this.http.get<MovimientoFinanciero[]>(

      `${this.baseUrl}/ByCuenta/${idCuentaFinanciera}`
    );
  }

  /* =====================================
  🔥 GET BY FECHA
  ====================================== */

  getByFecha(

    idEmpresa:number,

    desde:string,

    hasta:string

  ): Observable<MovimientoFinanciero[]>
  {
    return this.http.get<MovimientoFinanciero[]>(

      `${this.baseUrl}/ByFecha?idEmpresa=${idEmpresa}&desde=${desde}&hasta=${hasta}`
    );
  }

  /* =====================================
  🔥 ENTRADA
  ====================================== */

  registrarEntrada(
    payload:any
  ): Observable<any>
  {
    return this.http.post(

      `${this.baseUrl}/Entrada`,

      payload
    );
  }

  /* =====================================
  🔥 SALIDA
  ====================================== */

  registrarSalida(
    payload:any
  ): Observable<any>
  {
    return this.http.post(

      `${this.baseUrl}/Salida`,

      payload
    );
  }

  /* =====================================
  🔥 TRANSFERENCIA
  ====================================== */

  registrarTransferencia(
    payload:any
  ): Observable<any>
  {
    return this.http.post(

      `${this.baseUrl}/Transferencia`,

      payload
    );
  }

  consultar(
    filtro: MovimientoFinancieroFiltro
  ): Observable<MovimientoFinancieroListado[]> {
    const payload = {
      ...filtro,
      documentoReferencia: filtro.documentoReferencia ?? filtro.search
    };
    delete (payload as any).search;
    return this.http.post<MovimientoFinancieroListado[]>(
      `${this.baseUrl}/Consultar`,
      payload
    );
  }

  estadoCuenta(
    idCuentaFinanciera: number,
    desde?: string,
    hasta?: string
  ): Observable<EstadoCuenta> {
    let url = `${this.baseUrl}/EstadoCuenta/${idCuentaFinanciera}`;
    const params: string[] = [];
    if (desde) params.push(`desde=${desde}`);
    if (hasta) params.push(`hasta=${hasta}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<EstadoCuenta>(url);
  }

  ajuste(payload: RegistrarAjustePayload): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/Ajuste`, payload);
  }

  anular(payload: AnularMovimientoPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Anular`, payload);
  }

  /* =====================================
  🔥 DELETE
  ====================================== */

  delete(
    id:number
  ): Observable<any>
  {
    return this.http.delete(

      `${this.baseUrl}/${id}`
    );
  }
}