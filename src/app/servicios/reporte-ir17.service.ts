import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ReporteIr17 } from '../models/reporte-ir17.models';

@Injectable({ providedIn: 'root' })
export class ReporteIr17Service {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/DgiiConfig`;
  }

  obtener(idEmpresa: number, periodo?: string): Observable<ReporteIr17> {
    const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
    return this.http.get<ReporteIr17>(`${this.baseUrl}/ReporteIr17/${idEmpresa}${q}`);
  }
}
