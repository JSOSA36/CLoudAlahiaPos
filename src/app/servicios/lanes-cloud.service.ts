// src/app/servicios/planes-cloud.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface PlanCloud {
  idPlan: number;
  nombre: string;
  precio: number;
  nivel: number;
  limiteFacturacion: number;
  esActual: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlanesCloudService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // 👉 https://apikds.alahiapos.com/api/PlanesCloud
    this.baseUrl = `${this.config.apiUrl}/PlanesCloud`;
  }

  // =====================================================
  // 📦 OBTENER TODOS LOS PLANES
  // =====================================================
  getPlanes(): Observable<PlanCloud[]> {
    return this.http.get<PlanCloud[]>(`${this.baseUrl}/GetPlanes`);
  }
// =====================================================
// 📦 PLANES CON PLAN ACTUAL
// =====================================================
getPlanesPorEmpresa(idEmpresa: number): Observable<PlanCloud[]> {
  return this.http.get<PlanCloud[]>(
    `${this.baseUrl}/empresa/${idEmpresa}`
  );
}
  // =====================================================
  // 🔍 OBTENER PLAN POR ID
  // =====================================================
  getPlanById(id: number): Observable<PlanCloud> {
    return this.http.get<PlanCloud>(`${this.baseUrl}/GetPlan/${id}`);
  }

  // =====================================================
  // 🔄 CAMBIAR PLAN
  // =====================================================
  cambiarPlan(idEmpresa: number, idPlan: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/CambiarPlan`, {
      idEmpresa,
      idPlan
    });
  }
}