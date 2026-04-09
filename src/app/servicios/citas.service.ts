// src/app/servicios/citas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from '../models/cita';
import { AppConfigService } from './app-config.service';
import { CitaDto } from '../Modales/CitasDto.models';
import { EstadoCita } from '../models/cita';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private readonly baseUrl: string;
private nuevaCitaSubject = new Subject<any>();
  public nuevaCita$ = this.nuevaCitaSubject.asObservable();
  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/Citas
    this.baseUrl = `${this.config.apiUrl}/Citas`;
  }
private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  // 🔹 Obtener todas las citas de una empresa
  GetListadoCitas(IdEmpresa: number): Observable<Cita[]> {
    return this.httpClient.get<Cita[]>(`${this.baseUrl}/${IdEmpresa}`);
  }
  // 🔹 Generar orden desde una cita


// 🔹 Cambiar estado de la cita
CambiarEstado(idCita: number, estado: EstadoCita) {
  return this.httpClient.put(
    `${this.baseUrl}/CambiarEstado/${idCita}`,
    { estado },
    this.httpOptions
  );
}


notificarNuevaCita(cita: any) {
  this.nuevaCitaSubject.next(cita);
}

  // 🔹 Obtener cita por Id
  GetById(id: number): Observable<Cita> {
    return this.httpClient.get<Cita>(`${this.baseUrl}/GetById/${id}`);
  }
GetDisponibilidad(idEmpleado: number, idEmpresa: number, fecha: string): Observable<any> {
  return this.httpClient.get<any>(`${this.baseUrl}/Disponibilidad/${idEmpleado}/${idEmpresa}/${fecha}`);
}

  // 🔹 Obtener citas por empleado
  GetByEmpleado(idEmpleado: number, idEmpresa: number): Observable<Cita[]> {
    return this.httpClient.get<Cita[]>(`${this.baseUrl}/GetByEmpleado/${idEmpleado}/${idEmpresa}`);
  }

  // 🔹 Obtener citas del día con nombre de estilista
  GetCitasConEmpleado(idEmpresa: number): Observable<CitaDto[]> {
    return this.httpClient.get<CitaDto[]>(`${this.baseUrl}/GetCitasConEmpleado/${idEmpresa}`);
  }

  // 🔹 Total de citas en el mes
  TotalCitasDelMes(idEmpresa: number): Observable<number> {
    return this.httpClient.get<number>(`${this.baseUrl}/TotalDelMes/${idEmpresa}`);
  }

  // 🔹 Crear cita
  EnviarItem(value: FormData): Observable<any> {
  return this.httpClient.post<any>(this.baseUrl, value);
}


  // 🔹 Editar cita
 EditarCita(value: FormData): Observable<any> {
  return this.httpClient.put<any>(this.baseUrl, value);
}
enviarRecordatorioDia(fecha: string, idEmpresa: number): Observable<any> {

  const body = {
    Fecha: new Date(fecha).toISOString(), // 👈 esto evita errores de zona horaria
    idEmpresa: idEmpresa
  };

  return this.httpClient.post(
    `${this.baseUrl}/enviar-recordatorio-dia`,
    body
  );

}
  // 🔹 Eliminar cita
  DeleteItem(id: number): Observable<any> {
    return this.httpClient.delete<any>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Disponibilidad por empleado, empresa y fecha
}
