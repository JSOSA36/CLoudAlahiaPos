// src/app/servicios/usuarios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { UsuarioDto } from '../models/usuariodto.model';

export interface UsuariosEmpresaCupo {
  usuarios: any[];
  limiteUsuario: number;
  usuariosRegistrados: number;
  puedeAgregar: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/usuarios`;
  }

  getUsuarios(idEmpresa: number): Observable<UsuarioDto[]> {
    return this.getUsuariosConCupo(idEmpresa).pipe(
      map(r => r.usuarios as UsuarioDto[])
    );
  }

  getUsuariosConCupo(idEmpresa: number): Observable<UsuariosEmpresaCupo> {
    return this.http.get<any>(`${this.baseUrl}/empresa/${idEmpresa}`).pipe(
      map(res => {
        const usuarios = Array.isArray(res)
          ? res
          : (res?.usuarios ?? res?.Usuarios ?? []);
        const limite = Number(res?.limiteUsuario ?? res?.LimiteUsuario ?? 0) || 1;
        const registrados = Number(
          res?.usuariosRegistrados ?? res?.UsuariosRegistrados ?? usuarios.length
        );
        const puede = res?.puedeAgregar ?? res?.PuedeAgregar;
        return {
          usuarios,
          limiteUsuario: limite,
          usuariosRegistrados: registrados,
          puedeAgregar: typeof puede === 'boolean' ? puede : registrados < limite
        };
      })
    );
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
    const id = (dto as any).idusuario ?? (dto as any).idUsuario;
    return this.http.put(`${this.baseUrl}/${id}`, dto);
  }

  // ============================
  // ELIMINAR USUARIO
  // ============================
  deleteUsuario(idUsuario: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${idUsuario}`);
  }
}
