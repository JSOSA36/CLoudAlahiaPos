import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plan } from '../models/plan.models';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class PlanesService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/Planes
    this.baseUrl = `${this.config.apiUrl}/Planes`;
  }

  /** 🔹 Obtener todos los planes */
  getPlanes(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.baseUrl);
  }

  /** 🔹 Obtener plan por id */
  getPlanById(id: number): Observable<Plan> {
    return this.http.get<Plan>(`${this.baseUrl}/GetById/${id}`);
  }

  /** 🔹 Crear plan */
  createPlan(plan: Plan): Observable<Plan> {
    return this.http.post<Plan>(this.baseUrl, plan);
  }

  /** 🔹 Actualizar plan */
  updatePlan(id: number, plan: Plan): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, plan);
  }

  /** 🔹 Eliminar plan */
  deletePlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
