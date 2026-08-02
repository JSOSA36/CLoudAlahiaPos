import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  CuentaFinanciera,
  TesoreriaSaldoResumen
} from '../models/CuentaFinanciera.models';

@Injectable({ providedIn: 'root' })
export class CuentaFinancieraService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/CuentaFinanciera`;
  }

  getByEmpresa(idEmpresa: number): Observable<CuentaFinanciera[]> {
    return this.http.get<CuentaFinanciera[]>(`${this.baseUrl}/${idEmpresa}`);
  }

  getById(id: number): Observable<CuentaFinanciera> {
    return this.http.get<CuentaFinanciera>(`${this.baseUrl}/GetById/${id}`);
  }

  getBalance(idCuentaFinanciera: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/Balance/${idCuentaFinanciera}`);
  }

  getResumenSaldos(idEmpresa: number): Observable<TesoreriaSaldoResumen[]> {
    return this.http.get<TesoreriaSaldoResumen[]>(
      `${this.baseUrl}/ResumenSaldos/${idEmpresa}`
    );
  }

  sincronizarSaldos(idEmpresa: number): Observable<{ cuentasActualizadas: number }> {
    return this.http.post<{ cuentasActualizadas: number }>(
      `${this.baseUrl}/SincronizarSaldos/${idEmpresa}`,
      {}
    );
  }

  create(model: CuentaFinanciera): Observable<any> {
    return this.http.post(this.baseUrl, model);
  }

  update(model: CuentaFinanciera): Observable<any> {
    return this.http.put(`${this.baseUrl}/${model.idCuentaFinanciera}`, model);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
