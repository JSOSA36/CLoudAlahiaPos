/* =========================================
🔥 CUENTA FINANCIERA SERVICE
src/app/servicios/cuenta-financiera.service.ts
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
  CuentaFinanciera
} from '../models/CuentaFinanciera.models';

@Injectable({
  providedIn:'root'
})
export class CuentaFinancieraService {

  private readonly baseUrl:string;

  constructor(

    private http:HttpClient,

    private config:AppConfigService
  ){
    this.baseUrl =
      `${this.config.apiUrl}/CuentaFinanciera`;
  }

  /* =====================================
  🔥 GET EMPRESA
  ====================================== */

  getByEmpresa(
    idEmpresa:number
  ): Observable<CuentaFinanciera[]>
  {
    return this.http.get<CuentaFinanciera[]>(

      `${this.baseUrl}/${idEmpresa}`
    );
  }

  /* =====================================
  🔥 GET BY ID
  ====================================== */

  getById(
    id:number
  ): Observable<CuentaFinanciera>
  {
    return this.http.get<CuentaFinanciera>(

      `${this.baseUrl}/GetById/${id}`
    );
  }

  /* =====================================
  🔥 GET BALANCE
  ====================================== */

  getBalance(
    idCuentaFinanciera:number
  ): Observable<number>
  {
    return this.http.get<number>(

      `${this.baseUrl}/Balance/${idCuentaFinanciera}`
    );
  }

  /* =====================================
  🔥 CREATE
  ====================================== */

  create(
    model:CuentaFinanciera
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
    model:CuentaFinanciera
  ): Observable<any>
  {
    return this.http.put(

      `${this.baseUrl}/${model.idCuentaFinanciera}`,

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