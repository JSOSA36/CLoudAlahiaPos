// src/app/servicios/empleadoserviciocomision.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpleadoAreaComision } from '../models/empleadoareacomision.model';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoServicioComisionService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // 👉 Queda: https://apikds.alahiapos.com/api/EmpleadoServicioComision
    this.baseUrl = `${this.config.apiUrl}/EmpleadoAreaComision`;
  }

  getComisionesByEmpleado(IdEmpleado: number): Observable<EmpleadoAreaComision[]> {
    return this.http.get<EmpleadoAreaComision[]>(`${this.baseUrl}/GetByEmpleado/${IdEmpleado}`);
  }

  getComisionById(id: number): Observable<EmpleadoAreaComision> {
    return this.http.get<EmpleadoAreaComision>(`${this.baseUrl}/GetById/${id}`);
  }

  createComisiones(comisionesDto: EmpleadoAreaComision[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, comisionesDto);
  }

  updateComision(id: number, comision: EmpleadoAreaComision): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, comision);
  }

  deleteComision(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // 👇 Método adicional: eliminar comisión por empleado + servicio
  deleteByEmpleadoServicio(idEmpleado: number, idServicio: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/DeleteByEmpleadoServicio/${idEmpleado}/${idServicio}`);
  }
}
