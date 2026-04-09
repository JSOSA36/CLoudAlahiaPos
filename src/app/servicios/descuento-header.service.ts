import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DescuentoHeader } from '../models/descuento-header.model';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class DescuentoHeaderService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // Ej: https://apikds.alahiapos.com/api/DescuentoHeader
    this.baseUrl = `${this.config.apiUrl}/DescuentoHeader`;
  }

  // ====================================================
  // 🔹 Obtener todos los descuentos de la empresa
  // ====================================================
  getAll(IdEmpresa: number): Observable<DescuentoHeader[]> {
    return this.http.get<DescuentoHeader[]>(`${this.baseUrl}/Empresa/${IdEmpresa}`);
  }

  // ====================================================
  // 🔹 Obtener un descuento por ID
  // ====================================================
  getById(id: number): Observable<DescuentoHeader> {
    return this.http.get<DescuentoHeader>(`${this.baseUrl}/${id}`);
  }

  // ====================================================
  // 🔹 Activar / desactivar descuento
  // ====================================================
  toggleEstado(id: number) {
    return this.http.patch(`${this.baseUrl}/toggle/${id}`, {});
  }

  // ====================================================
  // 🔥 NUEVO: Obtener si aplica un descuento
  // ====================================================
  getAplicado(IdEmpresa: number, IdProducto: number, IdArea: number) {
    return this.http.get<any>(
      `${this.baseUrl}/Aplicar?idEmpresa=${IdEmpresa}&idProducto=${IdProducto}&idArea=${IdArea}`
    );
  }

  // ====================================================
  // 🔹 Crear
  // ====================================================
  create(dto: DescuentoHeader): Observable<DescuentoHeader> {
    return this.http.post<DescuentoHeader>(this.baseUrl, dto);
  }

  // ====================================================
  // 🔹 Editar
  // ====================================================
  update(id: number, dto: DescuentoHeader): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  // ====================================================
  // 🔹 Eliminar
  // ====================================================
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
