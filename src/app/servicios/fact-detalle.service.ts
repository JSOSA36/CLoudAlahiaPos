// src/app/servicios/fact-detalle.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { facturadetalles } from '../models/facturadetalles';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class FactDetalleService {

  private readonly baseUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Resultado: https://apikds.alahiapos.com/api/FacturaDetalle
    this.baseUrl = `${this.config.apiUrl}/FacturaDetalle`;
  }
  cambiarEmpleadoDetalle(idDetalle: number, idEmpleado: number) {

  return this.httpClient.put(
    `${this.baseUrl}/cambiar-empleado-detalle?idFacturaDetalle=${idDetalle}&idEmpleado=${idEmpleado}`,
    {}
  );

}
actualizarPrecioDetalle(
  idDetalle: number,
  precio: number
): Observable<void> {

  return this.httpClient.put<void>(
    `${this.baseUrl}/precio/${idDetalle}`,
    { precio }
  );

}
  // ================================
  // ELIMINAR ITEM
  // ================================
  DeleteIten(id: number): Observable<number> {
    return this.httpClient.delete<number>(`${this.baseUrl}/${id}`);
  }

  // ================================
  // ENVIAR NUEVO ITEM
  // ================================
  EnviarItem(value: facturadetalles[]): Observable<facturadetalles[]> {
    return this.httpClient.post<facturadetalles[]>(`${this.baseUrl}/`, value, this.httpOptions);
  }

  // ================================
  // AUMENTAR CANTIDAD (BACKEND)
  // ================================
  AumentarCantidad(IdFactDetalle: number): Observable<number> {
    return this.httpClient.get<number>(`${this.baseUrl}/AumentarCantidad/${IdFactDetalle}`);
  }

  // ================================
  // DISMINUIR CANTIDAD (BACKEND)
  // ================================
  DisminuirCantidad(IdFactDetalle: number): Observable<number> {
    return this.httpClient.get<number>(`${this.baseUrl}/DisminuirCantidad/${IdFactDetalle}`);
  }

  // ================================
  // ACTUALIZAR CANTIDAD DIRECTAMENTE
  // ================================
 ActualizarCantidad(idDetalle: number, cantidadNueva: number): Observable<any> {
  return this.httpClient.get<any>(
    `${this.baseUrl}/ActualizarCantidad/${idDetalle}/${cantidadNueva}`
  );
}


}
