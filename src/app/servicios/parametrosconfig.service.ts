import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Parametros } from '../models/parametros.models';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class ParametroConfigService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // https://apikds.alahiapos.com/api/Parametros
    this.baseUrl = `${this.config.apiUrl}/Parametros`;
  }

  // 🔹 Obtener parámetros de empresa
  getParametrosEmpresa(idEmpresa: number): Observable<Parametros[]> {
    return this.http.get<Parametros[]>(`${this.baseUrl}/GetParametrosEmpresa/${idEmpresa}`);
  }

  // 🔹 Obtener parámetros del POS
  getParametrosPOS(idEmpresa: number, codigoPOS: string): Observable<Parametros[]> {
    return this.http.get<Parametros[]>(
      `${this.baseUrl}/GetParametrosPOS/${idEmpresa}/${codigoPOS}`
    );
  }

  // 🔹 Obtener un parámetro específico empresa
  getParametro(idEmpresa: number, clave: string): Observable<Parametros> {
    return this.http.get<Parametros>(
      `${this.baseUrl}/GetParametro/${idEmpresa}/${clave}`
    );
  }

  // 🔹 Obtener un parámetro específico POS
  getParametroPOS(idEmpresa: number, codigoPOS: string, clave: string): Observable<Parametros> {
    return this.http.get<Parametros>(
      `${this.baseUrl}/GetParametroPOS/${idEmpresa}/${codigoPOS}/${clave}`
    );
  }

  // 🔹 Guardar múltiples parámetros
  guardarLista(parametros: Parametros[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/GuardarLista`, parametros);
  }

  // 🔹 Crear parámetro
  createParametro(parametro: Parametros): Observable<any> {
    return this.http.post(this.baseUrl, parametro);
  }

  // 🔹 Actualizar parámetro
  updateParametro(parametro: Parametros): Observable<any> {
    return this.http.put(this.baseUrl, parametro);
  }

  // 🔹 Eliminar parámetro
  deleteParametro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}