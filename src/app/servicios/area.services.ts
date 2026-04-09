// src/app/servicios/areas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Area } from '../models/area.model';
import { AppConfigService } from './app-config.service';
import { DescuentoAreaDetalle } from '../models/descuento-area-detalle.model';

@Injectable({ providedIn: 'root' })
export class AreasService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/Areas
    this.baseUrl = `${this.config.apiUrl}/Areas`;
  }

  getAreas(IdEmpresa: number): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.baseUrl}/${IdEmpresa}`);
  }

  getAreaById(id: number): Observable<Area> {
    return this.http.get<Area>(`${this.baseUrl}/GetById/${id}`);
  }
insertMultiple(detalles: DescuentoAreaDetalle[]): Observable<any> {
  return this.http.post(`${this.baseUrl}/Batch`, detalles);
}

  createArea(area: Area): Observable<Area> {
    return this.http.post<Area>(this.baseUrl, area);
  }

  updateArea(id: number, area: Area): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, area);
  }

  deleteArea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
