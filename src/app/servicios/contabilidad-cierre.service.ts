import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { CerrarPeriodoRequest, PeriodoContable } from '../models/ContabilidadReportes.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadCierreService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/ContabilidadCierre`;
  }

  getPeriodo(idEmpresa: number, anio: number, mes: number): Observable<PeriodoContable> {
    return this.http.get<PeriodoContable>(`${this.baseUrl}/periodo/${idEmpresa}/${anio}/${mes}`);
  }

  getPeriodos(idEmpresa: number, anio: number): Observable<PeriodoContable[]> {
    return this.http.get<PeriodoContable[]>(`${this.baseUrl}/periodos/${idEmpresa}/${anio}`);
  }

  cerrarPeriodo(request: CerrarPeriodoRequest): Observable<PeriodoContable> {
    return this.http.post<PeriodoContable>(`${this.baseUrl}/cerrar`, request);
  }
}
