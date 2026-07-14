// src/app/servicios/productos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { productos } from '../models/productos';
import { AppConfigService } from './app-config.service';
import { ProductoLite } from '../models/producto-lite.model';
import {
  ProductoBusquedaCompra,
  ProductoBusquedaCompraResult
} from '../models/producto-busqueda.model';

@Injectable({ providedIn: 'root' })
export class ProductosService {

  private readonly baseUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/Productos
    this.baseUrl = `${this.config.apiUrl}/Productos`;
  }

  GetProductosByIdCategoria(Id: number, IdEmpresa: number): Observable<productos[]> {
    return this.httpClient.get<productos[]>(`${this.baseUrl}/${Id}/${IdEmpresa}`);
  }
  getProductosLite(IdEmpresa: number): Observable<ProductoLite[]> {
  return this.httpClient.get<ProductoLite[]>(
    `${this.baseUrl}/ProductosLite/${IdEmpresa}`
  );
}

  GetProductos(IdEmpresa: number): Observable<productos[]> {
    return this.httpClient.get<productos[]>(`${this.baseUrl}/GetListadoProductos/${IdEmpresa}`);
  }
  GetListadoProductosVenta(IdEmpresa: number): Observable<productos[]> {
    return this.httpClient.get<productos[]>(`${this.baseUrl}/GetListadoProductosVenta/${IdEmpresa}`);
  }

  GetProductosByBarCode(BarCode: string, IdEmpresa: number): Observable<productos> {
    const params = new HttpParams()
      .set('BarCode', BarCode)
      .set('IdEmpresa', String(IdEmpresa));
    return this.httpClient.get<productos>(`${this.baseUrl}/GetProductByBarCode`, { params });
  }

  buscarCompra(
    idEmpresa: number,
    q: string,
    page = 1,
    pageSize = 25,
    idAlmacen?: number
  ): Observable<ProductoBusquedaCompraResult> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    if (idAlmacen && idAlmacen > 0) {
      params = params.set('idAlmacen', String(idAlmacen));
    }
    return this.httpClient.get<ProductoBusquedaCompraResult>(
      `${this.baseUrl}/BuscarCompra/${idEmpresa}`,
      { params }
    );
  }

  DeleteIten(id: number): Observable<any> {
    return this.httpClient.delete<any>(`${this.baseUrl}/${id}`);
  }

  EnviarItem(value: FormData): Observable<any> {
    // FormData: no agregar headers de JSON
    return this.httpClient.post<any>(`${this.baseUrl}/`, value);
  }

  EditarProductos(value: FormData): Observable<any> {
    // FormData: no agregar headers de JSON
    return this.httpClient.put<any>(`${this.baseUrl}/`, value);
  }

  getServiciosByArea(idArea: number, idEmpresa: number): Observable<productos[]> {
    return this.httpClient.get<productos[]>(`${this.baseUrl}/GetServiciosByArea/${idArea}/${idEmpresa}`);
  }
}
