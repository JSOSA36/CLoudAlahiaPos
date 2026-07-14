import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  ActivoFijo,
  ActualizarActivoFijoRequest,
  ResumenActivosFijos
} from '../models/activos-fijos.models';

@Injectable({ providedIn: 'root' })
export class ActivosFijosService {
  private readonly baseUrl: string;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/ActivosFijos`;
  }

  listar(
    idEmpresa: number,
    estado?: string,
    texto?: string
  ): Observable<ActivoFijo[]> {
    const params: string[] = [];
    if (estado) params.push(`estado=${encodeURIComponent(estado)}`);
    if (texto) params.push(`texto=${encodeURIComponent(texto)}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.http.get<ActivoFijo[]>(`${this.baseUrl}/${idEmpresa}${q}`);
  }

  resumen(idEmpresa: number): Observable<ResumenActivosFijos> {
    return this.http.get<ResumenActivosFijos>(`${this.baseUrl}/Resumen/${idEmpresa}`);
  }

  detalle(id: number, idEmpresa: number): Observable<ActivoFijo> {
    return this.http.get<ActivoFijo>(`${this.baseUrl}/Detalle/${id}/${idEmpresa}`);
  }

  actualizar(id: number, request: ActualizarActivoFijoRequest): Observable<{
    success: boolean;
    data?: ActivoFijo;
    message?: string;
  }> {
    return this.http.put<{
      success: boolean;
      data?: ActivoFijo;
      message?: string;
    }>(`${this.baseUrl}/${id}`, request, this.httpOptions);
  }
}
