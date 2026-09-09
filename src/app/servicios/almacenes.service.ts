import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen } from '../models/almacenes.model';
import { AlmacenExistenciaResumen } from '../models/almacen-existencia.model';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class AlmacenesService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/Almacenes`;
  }

  getAlmacenes(
    idEmpresa: number,
    opts?: { incluirOtrasSucursales?: boolean; idSucursal?: number }
  ): Observable<Almacen[]> {
    let url = `${this.baseUrl}/${idEmpresa}`;
    const params: string[] = [];
    if (opts?.incluirOtrasSucursales) {
      params.push('incluirOtrasSucursales=true');
    }
    if (opts?.idSucursal) {
      params.push(`idSucursal=${opts.idSucursal}`);
    }
    if (params.length) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<Almacen[]>(url);
  }

  getAlmacenById(id: number): Observable<Almacen> {
    return this.http.get<Almacen>(`${this.baseUrl}/GetById/${id}`);
  }

  createAlmacen(almacen: Almacen): Observable<Almacen> {
    return this.http.post<Almacen>(this.baseUrl, almacen);
  }

  updateAlmacen(id: number, almacen: Almacen): Observable<Almacen> {
    return this.http.put<Almacen>(`${this.baseUrl}/${id}`, almacen);
  }

  deleteAlmacen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getExistenciasPorProducto(
    idProducto: number,
    idEmpresa: number
  ): Observable<AlmacenExistenciaResumen> {
    return this.http.get<AlmacenExistenciaResumen>(
      `${this.config.apiUrl}/AlmacenExistencia/producto/${idProducto}?idEmpresa=${idEmpresa}`
    );
  }

  getExistenciaEnAlmacen(
    idAlmacen: number,
    idProducto: number,
    idEmpresa: number
  ): Observable<{ cantidad: number }> {
    return this.http.get<{ cantidad: number }>(
      `${this.config.apiUrl}/AlmacenExistencia/${idAlmacen}/${idProducto}?idEmpresa=${idEmpresa}`
    );
  }
}
