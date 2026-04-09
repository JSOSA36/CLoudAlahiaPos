// src/app/servicios/reporte-servicios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

// 👇 DTO que coincide con lo que devuelve tu backend
export interface ServicioEmpleadoDto {

  noFactura: string;
  fecha: string;
  cliente: string;
  hora: string;

  idEmpleado: number;
  empleado: string;

  idProducto: number;
  producto: string;

  cantidad: number;
  precio: number;
  subTotal: number;

  // 🔥 FACTURA
  tipoFactura: string;       // Contado | Credito
  totalFactura: number;
  pagadoFactura: number;
  pendienteFactura: number;

  // 🔥 BASE REAL COBRADA
  montoBaseComision: number;

  // 🔥 NUEVO ESQUEMA COMISION
  tipoComision: 'PORCIENTO' | 'MONTO';
  porcientoComision: number;
  montoComision: number;

  // 🔥 RESULTADO FINAL
  comision: number;
}
@Injectable({ providedIn: 'root' })
export class ReporteServiciosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/ReporteServicios
    this.baseUrl = `${this.config.apiUrl}/FacturaHeader`;
  }

  /**
   * Obtiene listado de servicios realizados por empleados
   * @param desde Fecha inicial (Date o string en formato yyyy-MM-dd)
   * @param hasta Fecha final (Date o string en formato yyyy-MM-dd)
   * @param idEmpresa Id de la empresa
   */
  getServiciosPorEmpleado(desde: Date, hasta: Date, idEmpresa: number): Observable<ServicioEmpleadoDto[]> {
    const params = new HttpParams()
      .set('desde', desde.toISOString().split('T')[0]) // yyyy-MM-dd
      .set('hasta', hasta.toISOString().split('T')[0])
      .set('idEmpresa', idEmpresa.toString());

    return this.http.get<ServicioEmpleadoDto[]>(`${this.baseUrl}/GetServiciosPorEmpleado`, { params });
  }
}
