import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ReporteIt1 } from '../models/reporte-it1.models';

@Injectable({ providedIn: 'root' })
export class ReporteIt1Service {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/DgiiConfig`;
  }

  obtener(idEmpresa: number, periodo?: string): Observable<ReporteIt1> {
    const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
    return this.http.get<ReporteIt1>(`${this.baseUrl}/ReporteIt1/${idEmpresa}${q}`);
  }
}
