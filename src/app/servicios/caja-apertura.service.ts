// src/app/servicios/caja-apertura.service.ts

import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { AppConfigService }
from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class CajaAperturaService {

  private readonly baseUrl: string;

  constructor(

    private http: HttpClient,

    private config: AppConfigService

  ) {

    this.baseUrl =
      `${this.config.apiUrl}/CajaApertura`;
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
  🔥 CAJA ABIERTA
  ====================================== */

  getCajaAbierta(

    idEmpresa: number,

    idUsuario: number

  ): Observable<any> {

    return this.http.get<any>(

      `${this.baseUrl}/CajaAbierta` +

      `?idEmpresa=${idEmpresa}` +

      `&idUsuario=${idUsuario}`
    );
  }

  /* =====================================
  🔥 GET BY FECHA
  ====================================== */

  getByFecha(

    idEmpresa: number,

    desde: Date,

    hasta: Date

  ): Observable<any[]> {

    return this.http.get<any[]>(

      `${this.baseUrl}/GetByFecha` +

      `?idEmpresa=${idEmpresa}` +

      `&desde=${desde.toISOString()}` +

      `&hasta=${hasta.toISOString()}`
    );
  }

  /* =====================================
  🔥 ABRIR CAJA
  ====================================== */

  abrirCaja(
    model: any
  ): Observable<any> {

    return this.http.post<any>(

      `${this.baseUrl}/Abrir`,

      model
    );
  }

  /* =====================================
  🔥 CERRAR CAJA
  ====================================== */

  cerrarCaja(
    idCaja: number
  ): Observable<any> {

    return this.http.put<any>(

      `${this.baseUrl}/Cerrar/${idCaja}`,

      {}
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
}