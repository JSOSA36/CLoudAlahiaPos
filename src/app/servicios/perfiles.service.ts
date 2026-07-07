import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

// ⚠️ OJO: en tu import hay un espacio:  '../models/Perfil .models'
// lo dejo corregido aquí:
import { Perfil } from '../models/Perfil .models';

// ⚠️ También veo "modals" vs "models". Si tu carpeta realmente es "modals", déjalo como estaba.
// Aquí lo dejo tal cual tú lo tienes:
import { PerfilCreate } from '../modals/PerfilCreate.models';

import { PerfilUpdate } from '../models/PerfilUpdate.models';

@Injectable({ providedIn: 'root' })
export class PerfilesService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // https://apikds.alahiapos.com/api/perfiles
    this.baseUrl = `${this.config.apiUrl}/perfiles`;
  }

  // ===============================
  // 🔹 LISTAR PERFILES POR EMPRESA
  // ===============================
  getPerfiles(idEmpresa: number): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(
      `${this.baseUrl}/empresa/${idEmpresa}`
    );
  }

  // ===============================
  // 🔹 OBTENER PERFIL POR ID (AHORA CON EMPRESA)
  // ===============================
  getPerfilById(idEmpresa: number, idPerfil: number): Observable<Perfil> {
    return this.http.get<Perfil>(
      `${this.baseUrl}/empresa/${idEmpresa}/${idPerfil}`
    );
  }

  // ===============================
  // 🔥 CREAR PERFIL COMPLETO (AHORA CON EMPRESA)
  // ===============================
  createPerfilCompleto(
  idEmpresa: number,
  data: PerfilCreate
): Observable<{ idPerfil: number }> {

  // Si el DTO tiene IdEmpresa, lo asignamos
  data.idEmpresa = idEmpresa;

  return this.http.post<{ idPerfil: number }>(
    `${this.baseUrl}/completo`,
    data
  );
}
  // ===============================
  // ✏️ ACTUALIZAR PERFIL COMPLETO (AHORA CON EMPRESA)
  // ===============================
 updatePerfilCompleto(
  dto: PerfilUpdate
): Observable<void> {

  return this.http.put<void>(
    `${this.baseUrl}/completo/${dto.idPerfil}`,
    dto
  );

}
  // ===============================
  // 🗑️ ELIMINAR PERFIL (SOFT DELETE) (AHORA CON EMPRESA)
  // ===============================
 deletePerfil(idPerfil: number): Observable<void> {

  return this.http.delete<void>(
    `${this.baseUrl}/${idPerfil}`
  );

 }
}