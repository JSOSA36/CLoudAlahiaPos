// src/app/servicios/caja-movimiento.service.ts

import { Injectable }
from '@angular/core';

import { HttpClient }
from '@angular/common/http';

import { Observable }
from 'rxjs';

import { AppConfigService }
from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class CajaMovimientoService {

  private readonly baseUrl:string;

  constructor(

    private http: HttpClient,

    private config:
      AppConfigService

  ) {

    this.baseUrl =
      `${this.config.apiUrl}/CajaMovimiento`;
  }

  /* =====================================
  🔥 GET ALL
  ====================================== */

  getAll():
    Observable<any[]>
  {

    return this.http.get<any[]>(
      this.baseUrl
    );
  }

  /* =====================================
  🔥 GET BY CAJA
  ====================================== */

  getByCaja(
    idCaja:number
  ): Observable<any[]>
  {

    return this.http.get<any[]>(

      `${this.baseUrl}/ByCaja/${idCaja}`
    );
  }

  /* =====================================
  🔥 REGISTRAR ENTRADA
  ====================================== */

  registrarEntrada(
    model:any
  ): Observable<any>
  {

    return this.http.post<any>(

      `${this.baseUrl}/Entrada`,

      model
    );
  }

  /* =====================================
  🔥 REGISTRAR SALIDA
  ====================================== */

  registrarSalida(
    model:any
  ): Observable<any>
  {

    return this.http.post<any>(

      `${this.baseUrl}/Salida`,

      model
    );
  }

  /* =====================================
  🔥 DELETE
  ====================================== */

  delete(
    id:number
  ): Observable<void>
  {

    return this.http.delete<void>(

      `${this.baseUrl}/${id}`
    );
  }
}