import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { CategoriaGasto } from '../models/Gastos.models';

@Injectable({ providedIn: 'root' })
export class CategoriaGastoService {
  private get base(): string {
    return `${this.config.apiUrl}/CategoriaGasto`;
  }

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {}

  getByEmpresa(idEmpresa: number, soloActivos = false): Observable<CategoriaGasto[]> {
    const params = new HttpParams().set('soloActivos', String(soloActivos));
    return this.http.get<CategoriaGasto[]>(`${this.base}/${idEmpresa}`, { params });
  }

  create(entity: Partial<CategoriaGasto>): Observable<any> {
    return this.http.post(this.base, entity);
  }

  update(id: number, entity: CategoriaGasto): Observable<any> {
    return this.http.put(`${this.base}/${id}`, entity);
  }

  deactivate(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
