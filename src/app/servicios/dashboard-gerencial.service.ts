import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { DashboardGerencialDto } from '../models/dashboard-gerencial.dto';

@Injectable({ providedIn: 'root' })
export class DashboardGerencialService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/DashboardGerencial`;
  }

  getMesActual(idEmpresa: number, idSucursalFiltro = 0): Observable<DashboardGerencialDto> {
    const params = new HttpParams().set('idSucursalFiltro', String(idSucursalFiltro || 0));
    return this.http.get<DashboardGerencialDto>(`${this.baseUrl}/${idEmpresa}`, { params });
  }
}
