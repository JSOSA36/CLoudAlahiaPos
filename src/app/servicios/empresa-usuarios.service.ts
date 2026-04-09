// src/app/servicios/empresa-usuarios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { EmpresaUsuario } from '../models/empresa-usuario.model';

@Injectable({ providedIn: 'root' })
export class EmpresaUsuariosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // https://apikds.alahiapos.com/api/EmpresaUsuarios
    this.baseUrl = `${this.config.apiUrl}/EmpresaUsuarios`;
  }

  getByEmpresa(idEmpresa: number): Observable<EmpresaUsuario[]> {
    return this.http.get<EmpresaUsuario[]>(
      `${this.baseUrl}/GetByEmpresa/${idEmpresa}`
    );
  }

  pertenece(idEmpresa: number, idUsuario: number): Observable<{ pertenece: boolean }> {
    return this.http.get<{ pertenece: boolean }>(
      `${this.baseUrl}/Pertenece/${idEmpresa}/${idUsuario}`
    );
  }

  create(entity: EmpresaUsuario): Observable<any> {
    return this.http.post(this.baseUrl, entity);
  }

  update(id: number, entity: EmpresaUsuario): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, entity);
  }
}
