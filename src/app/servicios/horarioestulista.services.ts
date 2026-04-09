// src/app/servicios/horarios-estilista.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { HorarioEstilista } from '../models/horarioestilista.models';

@Injectable({
  providedIn: 'root'
})
export class HorariosEstilistaService {
  private readonly baseUrl: string;

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/HorariosEstilista
    this.baseUrl = `${this.config.apiUrl}/HorarioEstilista`;
  }

  // 🔹 Obtener todos los horarios por empresa
  GetHorariosByEmpresa(idEmpresa: number): Observable<HorarioEstilista[]> {
    return this.httpClient.get<HorarioEstilista[]>(`${this.baseUrl}/GetByEmpresa/${idEmpresa}`);
  }

  // 🔹 Obtener horarios por empleado
  GetHorariosByEmpleado(idEmpleado: number, idEmpresa: number): Observable<HorarioEstilista[]> {
  return this.httpClient.get<HorarioEstilista[]>(
    `${this.baseUrl}/GetByEmpleadoEmpresa/${idEmpleado}/${idEmpresa}`
  );
}


  // 🔹 Obtener disponibilidad de un estilista en una fecha
 GetDisponibilidad(idEmpleado: number, idEmpresa: number, fecha: string): Observable<any> {
  return this.httpClient.get<any>(
    `${this.baseUrl}/GetDisponibilidad/${idEmpleado}/${idEmpresa}/${fecha}`
  );
}
  // 🔹 Crear horario
  EnviarItem(value: FormData): Observable<any> {
    return this.httpClient.post<any>(this.baseUrl + '/', value);
  }

  // 🔹 Editar horario
  EditarItem(value: FormData): Observable<any> {
    return this.httpClient.put<any>(this.baseUrl + '/', value);
  }

  // 🔹 Eliminar horario
  DeleteItem(idHorario: number): Observable<any> {
    return this.httpClient.delete<any>(`${this.baseUrl}/${idHorario}`);
  }
 GuardarLista(payload: any): Observable<any> {
  return this.httpClient.post<any>(`${this.baseUrl}/GuardarLista`, payload);
}


}
