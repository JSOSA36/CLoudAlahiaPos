import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { PagosFacturasClientes } from '../Modales/PagosFacturasClientes .models';

@Injectable({ providedIn: 'root' })
export class PagosFacturasClientesService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // Queda así: https://apikds.alahiapos.com/api/PagoFacturasClientes
    this.baseUrl = `${this.config.apiUrl}/PagoFacturasClientes`;
  }

  /**
   * 🔹 Obtiene todos los pagos de facturas de una empresa
   */
  getAllPagos(IdEmpresa: number): Observable<PagosFacturasClientes[]> {
    return this.http.get<PagosFacturasClientes[]>(`${this.baseUrl}/${IdEmpresa}`);
  }

  /**
   * 🔹 Obtiene los pagos realizados a una factura específica
   */
  getPagosByFactura(IdFactura: number): Observable<PagosFacturasClientes[]> {
    return this.http.get<PagosFacturasClientes[]>(`${this.baseUrl}/GetByFactura/${IdFactura}`);
  }

  /**
   * 🔹 Obtiene un pago específico por su Id
   */
  getPagoById(IdFactura: number): Observable<PagosFacturasClientes> {
    return this.http.get<PagosFacturasClientes>(`${this.baseUrl}/GetById/${IdFactura}`);
  }

  /**
   * 🔹 Registra un nuevo pago asociado a una factura (actualiza estado de factura)
   */
  registrarPago(IdFactura: number, pago: PagosFacturasClientes): Observable<any> {
    return this.http.post(`${this.baseUrl}/RegistrarPago/${IdFactura}`, pago);
  }

  /**
   * 🔹 Inserta un pago simple (sin lógica de actualización de factura)
   */
  createPago(pago: PagosFacturasClientes): Observable<PagosFacturasClientes> {
    return this.http.post<PagosFacturasClientes>(this.baseUrl, pago);
  }

  /**
   * 🔹 Actualiza un pago existente
   */
  updatePago(IdPago: number, pago: PagosFacturasClientes): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${IdPago}`, pago);
  }

  /**
   * 🔹 Elimina un pago
   */
  deletePago(IdPago: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${IdPago}`);
  }
}
