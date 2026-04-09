// src/app/servicios/empresa-modulos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { EmpresaModulo } from '../models/empresa-modulo.model';

@Injectable({ providedIn: 'root' })
export class EmpresaModulosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // https://apikds.alahiapos.com/api/EmpresaModulos
    this.baseUrl = `${this.config.apiUrl}/EmpresaModulos`;
  }

  getByEmpresa(idEmpresa: number): Observable<EmpresaModulo[]> {
    return this.http.get<EmpresaModulo[]>(
      `${this.baseUrl}/GetByEmpresa/${idEmpresa}`
    );
  }

  tieneModulo(idEmpresa: number, idModulo: number): Observable<{ tiene: boolean }> {
    return this.http.get<{ tiene: boolean }>(
      `${this.baseUrl}/TieneModulo/${idEmpresa}/${idModulo}`
    );
  }

  create(entity: EmpresaModulo): Observable<any> {
    return this.http.post(this.baseUrl, entity);
  }

  update(id: number, entity: EmpresaModulo): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, entity);
  }
}
