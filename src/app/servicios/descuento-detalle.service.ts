import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DescuentoDetalle } from '../models/descuento-detalle.model';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class DescuentoDetalleService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // Ej: https://apikds.alahiapos.com/api/DescuentoDetalle
    this.baseUrl = `${this.config.apiUrl}/DescuentoDetalle`;
  }

  // 🔹 Obtener detalles de un Header
  getByHeader(idHeader: number): Observable<DescuentoDetalle[]> {
    return this.http.get<DescuentoDetalle[]>(`${this.baseUrl}/Header/${idHeader}`);
  }

  // 🔹 Obtener detalle por Id
  getById(id: number): Observable<DescuentoDetalle> {
    return this.http.get<DescuentoDetalle>(`${this.baseUrl}/${id}`);
  }
insertMultiple(detalles: DescuentoDetalle[]): Observable<any> {
  return this.http.post(`${this.baseUrl}/Batch`, detalles);
}

  // 🔹 Crear un detalle
  create(detalle: DescuentoDetalle): Observable<DescuentoDetalle> {
    return this.http.post<DescuentoDetalle>(this.baseUrl, detalle);
  }

  // 🔹 Crear varios en lote
  createBatch(detalles: DescuentoDetalle[]): Observable<DescuentoDetalle[]> {
    return this.http.post<DescuentoDetalle[]>(`${this.baseUrl}/Batch`, detalles);
  }

  // 🔹 Actualizar
  update(id: number, dto: DescuentoDetalle): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  // 🔹 Eliminar detalle por Id
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Eliminar todos los detalles de un Header
  deleteByHeader(idHeader: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Header/${idHeader}`);
  }
}
