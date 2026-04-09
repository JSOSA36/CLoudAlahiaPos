// src/app/servicios/cliente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { clientes } from '../models/clientes';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class ClienteService {

  private readonly baseUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/Clientes
    this.baseUrl = `${this.config.apiUrl}/Clientes`;
  }
  // 🔥 NUEVO → Buscar cliente por teléfono
GetByTelefono(IdEmpresa: number, telefono: string): Observable<clientes | null> {
  return this.httpClient.get<clientes | null>(
    `${this.baseUrl}/por-telefono`,
    {
      params: {
        telefono: telefono,
        idEmpresa: IdEmpresa
      }
    }
  );
}

  GetListadoClientes(IdEmpresa: number): Observable<clientes[]> {
    return this.httpClient.get<clientes[]>(`${this.baseUrl}/${IdEmpresa}`);
  }

  DeleteIten(id: number): Observable<number> {
    return this.httpClient.delete<number>(`${this.baseUrl}/${id}`);
  }

  EnviarItem(value: clientes): Observable<clientes> {
    return this.httpClient.post<clientes>(`${this.baseUrl}/`, value, this.httpOptions);
  }

  EditarClientes(value: clientes): Observable<clientes> {
    return this.httpClient.put<clientes>(`${this.baseUrl}/`, value, this.httpOptions);
  }

  // 🔹 Traer cliente por id
  GetById(id: number): Observable<clientes> {
    return this.httpClient.get<clientes>(`${this.baseUrl}/GetById/${id}`);
  }

  // 🔥 NUEVO → Buscar clientes por nombre
 BuscarPorNombre(IdEmpresa: number, nombre: string): Observable<clientes[]> {
  return this.httpClient.get<clientes[]>(`${this.baseUrl}/Buscar/${IdEmpresa}/${nombre}`);
}
}
