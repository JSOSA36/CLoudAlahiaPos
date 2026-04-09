// src/app/servicios/modulos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { Modulo } from '../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModulosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // https://apikds.alahiapos.com/api/Modulos
    this.baseUrl = `${this.config.apiUrl}/Modulos`;
  }

  getAll(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.baseUrl);
  }

  getById(id: number): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.baseUrl}/${id}`);
  }

  getByCodigo(codigo: string): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.baseUrl}/GetByCodigo/${codigo}`);
  }

  create(modulo: Modulo): Observable<any> {
    return this.http.post(this.baseUrl, modulo);
  }

  update(id: number, modulo: Modulo): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, modulo);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
   getModulos(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }
}
