// src/app/servicios/usuarios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { UsuarioDto } from '../models/usuariodto.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/usuarios`;
  }

  // ============================
  // LISTAR USUARIOS POR EMPRESA
  // ============================
  getUsuarios(idEmpresa: number): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(`${this.baseUrl}/empresa/${idEmpresa}`);
  }

  // ============================
  // CREAR USUARIO
  // ============================
  createUsuario(dto: UsuarioDto): Observable<any> {
    return this.http.post(this.baseUrl, dto);
  }

  // ============================
  // ACTUALIZAR USUARIO
  // ============================
  updateUsuario(dto: UsuarioDto): Observable<any> {
    return this.http.put(`${this.baseUrl}/${dto.idusuario}`, dto);
  }

  // ============================
  // ELIMINAR USUARIO
  // ============================
  deleteUsuario(idUsuario: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${idUsuario}`);
  }
}
