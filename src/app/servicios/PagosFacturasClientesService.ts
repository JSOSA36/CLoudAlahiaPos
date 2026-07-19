import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { PagosFacturasClientes } from '../Modales/PagosFacturasClientes .models';
import { EstadoCuentaCliente } from '../models/estado-cuenta-cliente.models';
import {
  RegistrarPagoLoteRequest,
  RegistrarPagoLoteResult
} from '../models/pago-lote-factura.models';

@Injectable({ providedIn: 'root' })
export class PagosFacturasClientesService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/PagoFacturasClientes`;
  }

  getAllPagos(IdEmpresa: number): Observable<PagosFacturasClientes[]> {
    return this.http.get<PagosFacturasClientes[]>(`${this.baseUrl}/${IdEmpresa}`);
  }

  getPagosByFactura(IdFactura: number): Observable<PagosFacturasClientes[]> {
    return this.http.get<PagosFacturasClientes[]>(`${this.baseUrl}/GetByFactura/${IdFactura}`);
  }

  getPagoById(IdFactura: number): Observable<PagosFacturasClientes> {
    return this.http.get<PagosFacturasClientes>(`${this.baseUrl}/GetById/${IdFactura}`);
  }

  registrarPago(IdFactura: number, pago: PagosFacturasClientes): Observable<any> {
    return this.http.post(`${this.baseUrl}/RegistrarPago/${IdFactura}`, pago);
  }

  registrarPagoLote(request: RegistrarPagoLoteRequest): Observable<RegistrarPagoLoteResult> {
    return this.http.post<RegistrarPagoLoteResult>(`${this.baseUrl}/RegistrarPagoLote`, request);
  }

  createPago(pago: PagosFacturasClientes): Observable<PagosFacturasClientes> {
    return this.http.post<PagosFacturasClientes>(this.baseUrl, pago);
  }

  updatePago(IdPago: number, pago: PagosFacturasClientes): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${IdPago}`, pago);
  }

  deletePago(IdPago: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${IdPago}`);
  }

  estadoCuentaCliente(
    idEmpresa: number,
    idCliente: number,
    desde: string,
    hasta: string
  ): Observable<EstadoCuentaCliente> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<EstadoCuentaCliente>(
      `${this.baseUrl}/EstadoCuenta/${idEmpresa}/${idCliente}`,
      { params }
    );
  }
}
