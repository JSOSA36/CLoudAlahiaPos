import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { CuentaContable } from '../models/CuentaContable.models';

@Injectable({ providedIn: 'root' })
export class CuentaContableService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/CuentaContable`;
  }

  getByEmpresa(idEmpresa: number): Observable<CuentaContable[]> {
    return this.http.get<CuentaContable[]>(`${this.baseUrl}/${idEmpresa}`);
  }

  getArbol(idEmpresa: number): Observable<CuentaContable[]> {
    return this.http.get<CuentaContable[]>(`${this.baseUrl}/arbol/${idEmpresa}`);
  }

  getById(id: number, idEmpresa: number): Observable<CuentaContable> {
    return this.http.get<CuentaContable>(`${this.baseUrl}/GetById/${id}/${idEmpresa}`);
  }

  create(entity: CuentaContable): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, entity);
  }

  update(entity: CuentaContable): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${entity.idCuentaContable}`, entity);
  }

  delete(id: number, idEmpresa: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/${idEmpresa}`);
  }

  seed(idEmpresa: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/seed/${idEmpresa}`, {});
  }
}
