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
    this.baseUrl = `${this.config.apiUrl}/perfilesRoles`;
  }

  getModulos(idPerfil: number, idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/${idPerfil}/${idEmpresa}/modulos`
    );
  }

  getModulosByPerfil(idPerfil: number): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.baseUrl}/${idPerfil}`);
  }

  asignarModulos(idPerfil: number, idsModulos: number[]): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${idPerfil}`,
      idsModulos
    );
  }
}
