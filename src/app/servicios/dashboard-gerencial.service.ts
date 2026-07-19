import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getMesActual(idEmpresa: number): Observable<DashboardGerencialDto> {
    return this.http.get<DashboardGerencialDto>(`${this.baseUrl}/${idEmpresa}`);
  }
}
