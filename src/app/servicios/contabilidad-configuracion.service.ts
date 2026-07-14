import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  ActualizarContabilidadConfiguracionRequest,
  ContabilidadConfiguracion
} from '../models/ContabilidadConfiguracion.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadConfiguracionService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/ContabilidadConfiguracion`;
  }

  get(idEmpresa: number): Observable<ContabilidadConfiguracion> {
    return this.http.get<ContabilidadConfiguracion>(`${this.baseUrl}/${idEmpresa}`);
  }

  actualizar(request: ActualizarContabilidadConfiguracionRequest): Observable<ContabilidadConfiguracion> {
    return this.http.put<ContabilidadConfiguracion>(this.baseUrl, request);
  }
}
