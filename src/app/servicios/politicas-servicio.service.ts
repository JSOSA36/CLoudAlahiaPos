import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  AceptarPoliticasRequest,
  AceptarPoliticasResultado,
  CrearPoliticasVersionRequest,
  PoliticasAceptacionDto,
  PoliticasEstadoDto,
  PoliticasVersionDto,
  PublicarPoliticasRequest
} from '../models/politicas-servicio.models';

@Injectable({ providedIn: 'root' })
export class PoliticasServicioService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/PoliticasServicio`;
  }

  obtenerEstado(idEmpresa: number, idUsuario: number): Observable<PoliticasEstadoDto> {
    return this.http.get<PoliticasEstadoDto>(
      `${this.baseUrl}/estado/${idEmpresa}`,
      { params: { idUsuario: idUsuario.toString() } }
    );
  }

  aceptar(request: AceptarPoliticasRequest): Observable<AceptarPoliticasResultado> {
    return this.http.post<AceptarPoliticasResultado>(`${this.baseUrl}/aceptar`, request);
  }

  listarVersiones(): Observable<PoliticasVersionDto[]> {
    return this.http.get<PoliticasVersionDto[]>(`${this.baseUrl}/versiones`);
  }

  obtenerVersion(idVersion: number): Observable<PoliticasVersionDto> {
    return this.http.get<PoliticasVersionDto>(`${this.baseUrl}/versiones/${idVersion}`);
  }

  crearBorrador(request: CrearPoliticasVersionRequest): Observable<PoliticasVersionDto> {
    return this.http.post<PoliticasVersionDto>(`${this.baseUrl}/versiones`, request);
  }

  publicar(request: PublicarPoliticasRequest): Observable<PoliticasVersionDto> {
    return this.http.post<PoliticasVersionDto>(`${this.baseUrl}/versiones/publicar`, request);
  }

  listarAceptaciones(idVersion?: number, idEmpresa?: number): Observable<PoliticasAceptacionDto[]> {
    const params: Record<string, string> = {};
    if (idVersion != null) params['idVersion'] = idVersion.toString();
    if (idEmpresa != null) params['idEmpresa'] = idEmpresa.toString();
    return this.http.get<PoliticasAceptacionDto[]>(`${this.baseUrl}/aceptaciones`, { params });
  }

  detectarSistemaOperativo(): string {
    const ua = navigator.userAgent || '';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Mac OS/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return navigator.platform || 'Desconocido';
  }

  async resolverDireccionIp(): Promise<string | undefined> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ ip?: string }>('https://api.ipify.org?format=json')
      );
      return res?.ip;
    } catch {
      return undefined;
    }
  }
}
