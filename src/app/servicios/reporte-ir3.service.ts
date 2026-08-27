import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ReporteIr3 } from '../models/reporte-ir3.models';

@Injectable({ providedIn: 'root' })
export class ReporteIr3Service {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/DgiiConfig`;
  }

  obtener(idEmpresa: number, periodo?: string): Observable<ReporteIr3> {
    const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
    return this.http.get<ReporteIr3>(`${this.baseUrl}/ReporteIr3/${idEmpresa}${q}`);
  }
}
