// ======================================================
// 🔥 MOVIMIENTOS INVENTARIO SERVICE
// ======================================================

import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  MovimientosInventario
} from '../models/MovimientosInventario.models';

import {
  MovimientosInventarioDetalle
} from '../models/MovimientosInventarioDetalle.models';

import { productos } from '../models/productos';

import {
  AppConfigService
} from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class MovimientosInventarioService {

  // ======================================================
  // 🔥 BASE URL
  // ======================================================

  private readonly baseUrl: string;

  // ======================================================
  // 🔥 HEADERS
  // ======================================================

  private httpOptions = {

    headers: new HttpHeaders({

      'Content-Type': 'application/json'
    })
  };

  // ======================================================
  // 🔥 CONSTRUCTOR
  // ======================================================

  constructor(

    private httpClient: HttpClient,

    private config: AppConfigService
  ) {

    // =============================================
    // 🔥 API URL
    // =============================================

    this.baseUrl =
      `${this.config.apiUrl}/MovimientosInventario`;
  }

  // ======================================================
  // 🔥 LISTAR
  // ======================================================

  GetListado(
    idEmpresa: number
  ): Observable<MovimientosInventario[]> {

    return this.httpClient.get<
      MovimientosInventario[]
    >(

      `${this.baseUrl}?idEmpresa=${idEmpresa}`
    );
  }

  // ======================================================
  // 🔥 OBTENER POR ID
  // ======================================================

  GetById(
    id: number
  ): Observable<MovimientosInventario> {

    return this.httpClient.get<
      MovimientosInventario
    >(

      `${this.baseUrl}/GetById/${id}`
    );
  }

  // ======================================================
  // 🔥 GUARDAR MOVIMIENTO
  // ======================================================

  GuardarMovimiento(
    value: MovimientosInventario
  ): Observable<any> {

    return this.httpClient.post<any>(

      `${this.baseUrl}/GuardarMovimiento`,

      value,

      this.httpOptions
    );
  }

  // ======================================================
  // 🔥 ELIMINAR
  // ======================================================

  DeleteItem(
    id: number
  ): Observable<any> {

    return this.httpClient.delete<any>(

      `${this.baseUrl}/${id}`
    );
  }

  // ======================================================
  // 🔥 FILTRAR POR FECHA
  // ======================================================

  FiltrarPorFecha(

    idEmpresa: number,

    desde: Date,

    hasta: Date

  ): Observable<MovimientosInventario[]> {

    return this.httpClient.get<
      MovimientosInventario[]
    >(

      `${this.baseUrl}/FiltrarPorFecha?` +

      `idEmpresa=${idEmpresa}` +

      `&desde=${desde.toISOString()}` +

      `&hasta=${hasta.toISOString()}`
    );
  }

  // ======================================================
  // 🔥 VALIDAR STOCK
  // ======================================================

  ValidarStock(

    idProducto: number,

    cantidad: number

  ): Observable<boolean> {

    return this.httpClient.get<boolean>(

      `${this.baseUrl}/ValidarStock?` +

      `idProducto=${idProducto}` +

      `&cantidad=${cantidad}`
    );
  }

  // ======================================================
  // 🔥 KARDEX PRODUCTO
  // ======================================================

  KardexProducto(

    idProducto: number,

    desde?: Date,

    hasta?: Date

  ): Observable<
    MovimientosInventarioDetalle[]
  > {

    let url =

      `${this.baseUrl}/KardexProducto?` +

      `idProducto=${idProducto}`;

    // =============================================
    // 🔥 DESDE
    // =============================================

    if (desde) {

      url +=
        `&desde=${desde.toISOString()}`;
    }

    // =============================================
    // 🔥 HASTA
    // =============================================

    if (hasta) {

      url +=
        `&hasta=${hasta.toISOString()}`;
    }

    return this.httpClient.get<
      MovimientosInventarioDetalle[]
    >(url);
  }

  // ======================================================
  // 🔥 PRODUCTOS STOCK BAJO
  // ======================================================
// ======================================================
// 🔥 FILTRAR HISTORIAL
// ======================================================

FiltrarHistorial(

  idEmpresa: number,

  desde?: string,

  hasta?: string,

  tipoMovimiento?: string,

  motivo?: string,

  idUsuario?: number

): Observable<MovimientosInventario[]> {

  let url =

    `${this.baseUrl}/FiltrarHistorial?` +

    `idEmpresa=${idEmpresa}`;

  // =============================================
  // 🔥 DESDE
  // =============================================

  if (desde) {

    url +=
      `&desde=${desde}`;
  }

  // =============================================
  // 🔥 HASTA
  // =============================================

  if (hasta) {

    url +=
      `&hasta=${hasta}`;
  }

  // =============================================
  // 🔥 TIPO
  // =============================================

  if (tipoMovimiento) {

    url +=
      `&tipoMovimiento=${tipoMovimiento}`;
  }

  // =============================================
  // 🔥 MOTIVO
  // =============================================

  if (motivo) {

    url +=
      `&motivo=${motivo}`;
  }

  // =============================================
  // 🔥 USUARIO
  // =============================================

  if (idUsuario) {

    url +=
      `&idUsuario=${idUsuario}`;
  }

  return this.httpClient.get<
    MovimientosInventario[]
  >(url);
}
  ProductosStockBajo(
    idEmpresa: number
  ): Observable<productos[]> {

    return this.httpClient.get<
      productos[]
    >(

      `${this.baseUrl}/ProductosStockBajo?` +

      `idEmpresa=${idEmpresa}`
    );
  }

  // ======================================================
  // 🔥 ACTUALIZAR STOCK
  // ======================================================

  ActualizarStock(

    idProducto: number,

    nuevoStock: number

  ): Observable<any> {

    return this.httpClient.put<any>(

      `${this.baseUrl}/ActualizarStock?` +

      `idProducto=${idProducto}` +

      `&nuevoStock=${nuevoStock}`,

      {}
    );
  }
}