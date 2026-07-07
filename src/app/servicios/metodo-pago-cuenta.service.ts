/* =========================================
🔥 METODO PAGO CUENTA SERVICE
src/app/servicios/metodo-pago-cuenta.service.ts
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
  MetodoPagoCuenta
} from '../models/MetodoPagoCuenta.models';

@Injectable({
  providedIn:'root'
})
export class MetodoPagoCuentaService {

  private readonly baseUrl:string;

  constructor(

    private http:HttpClient,

    private config:AppConfigService
  ){
    this.baseUrl =
      `${this.config.apiUrl}/MetodoPagoCuenta`;
  }

  /* =====================================
  🔥 GET EMPRESA
  ====================================== */

  getByEmpresa(
    idEmpresa:number
  ): Observable<MetodoPagoCuenta[]>
  {
    return this.http.get<MetodoPagoCuenta[]>(

      `${this.baseUrl}/${idEmpresa}`
    );
  }

  /* =====================================
  🔥 GET BY METODO
  ====================================== */

  getByMetodo(

    idEmpresa:number,

    metodoPago:string

  ): Observable<MetodoPagoCuenta>
  {
    return this.http.get<MetodoPagoCuenta>(

      `${this.baseUrl}/ByMetodo?idEmpresa=${idEmpresa}&metodoPago=${metodoPago}`
    );
  }

  /* =====================================
  🔥 CREATE
  ====================================== */

  create(
    model:MetodoPagoCuenta
  ): Observable<any>
  {
    return this.http.post(

      this.baseUrl,

      model
    );
  }

  /* =====================================
  🔥 UPDATE
  ====================================== */

  update(
    model:MetodoPagoCuenta
  ): Observable<any>
  {
    return this.http.put(

      `${this.baseUrl}/${model.idMetodoPagoCuenta}`,

      model
    );
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