import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './servicios/app-config.service';
import { Modulo } from './models/modulo.model';

@Injectable({ providedIn: 'root' })
export class PerfilRolesService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // https://apikds.alahiapos.com/api/PerfilRoles
    this.baseUrl = `${this.config.apiUrl}/PerfilRoles`;
  }

  // =====================================
  // 🔹 OBTENER MÓDULOS DE UN PERFIL
  // =====================================
  getModulosByPerfil(idPerfil: number): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.baseUrl}/${idPerfil}`);
  }

  // =====================================
  // 🔹 ASIGNAR MÓDULOS AL PERFIL
  // =====================================
  asignarModulos(idPerfil: number, idsModulos: number[]): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${idPerfil}`,
      idsModulos
    );
  }
}
