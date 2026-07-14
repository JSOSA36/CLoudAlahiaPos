import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { AsientoContable } from '../models/AsientoContable.models';

@Injectable({ providedIn: 'root' })
export class AsientoContableService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/AsientoContable`;
  }

  getByEmpresa(idEmpresa: number, desde?: string, hasta?: string): Observable<AsientoContable[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<AsientoContable[]>(`${this.baseUrl}/${idEmpresa}`, { params });
  }

  consultar(
    idEmpresa: number,
    filtros: {
      desde?: string;
      hasta?: string;
      idCuentaContable?: number;
      numero?: string;
      concepto?: string;
    }
  ): Observable<AsientoContable[]> {
    let params = new HttpParams();
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.idCuentaContable) params = params.set('idCuentaContable', filtros.idCuentaContable.toString());
    if (filtros.numero) params = params.set('numero', filtros.numero);
    if (filtros.concepto) params = params.set('concepto', filtros.concepto);
    return this.http.get<AsientoContable[]>(`${this.baseUrl}/consultar/${idEmpresa}`, { params });
  }

  getById(id: number, idEmpresa: number): Observable<AsientoContable> {
    return this.http.get<AsientoContable>(`${this.baseUrl}/GetById/${id}/${idEmpresa}`);
  }

  create(entity: AsientoContable): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, entity);
  }

  update(entity: AsientoContable): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${entity.idAsientoContable}`, entity);
  }

  anular(id: number, idEmpresa: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/anular/${id}/${idEmpresa}`, {});
  }
}
