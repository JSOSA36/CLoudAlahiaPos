import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DescuentoAreaDetalle } from '../models/descuento-area-detalle.model';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class DescuentoAreaDetalleService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // Ej: https://apikds.alahiapos.com/api/DescuentoAreaDetalle
    this.baseUrl = `${this.config.apiUrl}/DescuentoAreaDetalle`;
  }

  // 🔹 Obtiene todas las áreas asociadas a un descuento
  getByHeader(idHeader: number): Observable<DescuentoAreaDetalle[]> {
    return this.http.get<DescuentoAreaDetalle[]>(
      `${this.baseUrl}/Header/${idHeader}`
    );
  }

  // 🔹 Obtiene un detalle de área por Id
  getById(id: number): Observable<DescuentoAreaDetalle> {
    return this.http.get<DescuentoAreaDetalle>(
      `${this.baseUrl}/${id}`
    );
  }

  // 🔹 Inserta una sola área
  create(detalle: DescuentoAreaDetalle): Observable<DescuentoAreaDetalle> {
    return this.http.post<DescuentoAreaDetalle>(this.baseUrl, detalle);
  }

  // 🔹 Inserta múltiples áreas en lote
  createBatch(detalles: DescuentoAreaDetalle[]): Observable<DescuentoAreaDetalle[]> {
    return this.http.post<DescuentoAreaDetalle[]>(
      `${this.baseUrl}/Batch`, 
      detalles
    );
  }

  // 🔹 Actualiza un detalle
  update(id: number, dto: DescuentoAreaDetalle): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  // 🔹 Elimina un detalle por Id
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Elimina todas las áreas asociadas a un Header
  deleteByHeader(idHeader: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Header/${idHeader}`);
  }
  insertMultiple(detalles: DescuentoAreaDetalle[]): Observable<any> {
  return this.http.post(`${this.baseUrl}/Batch`, detalles);
}

}
