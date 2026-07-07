// src/app/servicios/caja-cierre.service.ts

import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { AppConfigService }
from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class CajaCierreService {

  private readonly baseUrl: string;

  constructor(

    private http: HttpClient,

    private config:
      AppConfigService

  ) {

    this.baseUrl =
      `${this.config.apiUrl}/CajaCierre`;
  }

  /* =====================================
  🔥 GET ALL POR EMPRESA
  ====================================== */

  getAll(
    idEmpresa: number
  ): Observable<any[]> {

    return this.http.get<any[]>(

      `${this.baseUrl}` +

      `?idEmpresa=${idEmpresa}`
    );
  }

  /* =====================================
  🔥 GET BY FECHA
  ====================================== */

  getByFecha(

    idEmpresa: number,

    desde: string,

    hasta: string

  ): Observable<any[]> {

    return this.http.get<any[]>(

      `${this.baseUrl}/GetByFecha` +

      `?idEmpresa=${idEmpresa}` +

      `&desde=${desde}` +

      `&hasta=${hasta}`
    );
  }

  /* =====================================
  🔥 GET BY ID
  ====================================== */

  getById(
    id: number
  ): Observable<any> {

    return this.http.get<any>(

      `${this.baseUrl}/${id}`
    );
  }

  /* =====================================
  🔥 ULTIMO CIERRE
  ====================================== */

  getUltimoCierre(
    idEmpresa: number
  ): Observable<any> {

    return this.http.get<any>(

      `${this.baseUrl}/UltimoCierre` +

      `?idEmpresa=${idEmpresa}`
    );
  }

  /* =====================================
  🔥 PROCESAR CIERRE
  ====================================== */

  procesarCierre(

    payload: any

  ): Observable<any> {

    return this.http.post<any>(

      `${this.baseUrl}/Procesar`,

      payload
    );
  }

  /* =====================================
  🔥 DELETE
  ====================================== */

  delete(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(

      `${this.baseUrl}/${id}`
    );
  }

  /* =====================================
  🔥 IMPRIMIR CIERRE
  ====================================== */

  imprimirCierre(
    idCajaCierre: number
  ): Observable<any> {

    return this.http.get<any>(

      `${this.baseUrl}/ImprimirCierre/${idCajaCierre}`
    );
  }
}