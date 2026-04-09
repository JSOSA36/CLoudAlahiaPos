// src/app/servicios/ncf-secuencias.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { NCF_Secuencia } from '../models/NCF_Secuencia.models';

@Injectable({ providedIn: 'root' })
export class NcfSecuenciasService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // 👉 https://apikds.alahiapos.com/api/NCF_Secuencias
    this.baseUrl = `${this.config.apiUrl}/NCF_Secuencias`;
  }

  // 🔹 Obtener todas por empresa
  getSecuencias(IdEmpresa: number): Observable<NCF_Secuencia[]> {
    return this.http.get<NCF_Secuencia[]>(`${this.baseUrl}/${IdEmpresa}`);
  }

  // 🔹 Obtener por Id
  getById(id: number): Observable<NCF_Secuencia> {
    return this.http.get<NCF_Secuencia>(`${this.baseUrl}/GetById/${id}`);
  }

  // 🔹 Crear nueva secuencia
  create(secuencia: NCF_Secuencia): Observable<NCF_Secuencia> {
    return this.http.post<NCF_Secuencia>(this.baseUrl, secuencia);
  }

  // 🔹 Actualizar secuencia
  update(id: number, secuencia: NCF_Secuencia): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, secuencia);
  }

  // 🔹 Eliminar (desactivar)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // 🔥 Generar NCF
  generarNCF(idEmpresa: number, tipoNCF: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/Generar?idEmpresa=${idEmpresa}&tipoNCF=${tipoNCF}`, {}
    );
  }
}