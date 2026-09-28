import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { SucursalSesion, normalizarSucursalesSesion } from '../models/sucursal-sesion.models';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {}

  yo(): Observable<{
    idUsuario: number;
    idEmpresa: number;
    idSucursal: number;
    userName: string;
  }> {
    return this.http.get<{
      idUsuario: number;
      idEmpresa: number;
      idSucursal: number;
      userName: string;
    }>(`${this.config.apiUrl}/Sesion/yo`);
  }

  listar(): Observable<SucursalSesion[]> {
    return this.http.get<any[]>(`${this.config.apiUrl}/Sucursales`).pipe(
      map(normalizarSucursalesSesion)
    );
  }

  cambiar(idSucursal: number): Observable<{
    idSucursal: number;
    nombre: string;
    apiPrint?: string | null;
    idAlmacenPrincipal?: number | null;
    sucursales: SucursalSesion[];
  }> {
    return this.http.post<{
      idSucursal: number;
      nombre: string;
      apiPrint?: string | null;
      idAlmacenPrincipal?: number | null;
      sucursales: SucursalSesion[];
    }>(`${this.config.apiUrl}/Sesion/sucursal`, { idSucursal });
  }
}
