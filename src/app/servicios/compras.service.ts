import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  FacturaCompra,
  GuardarFacturaCompraRequest,
  ConfirmarFacturaCompraRequest,
  RegistrarPagoProveedorRequest,
  PagoProveedor,
  ConfirmarRecepcionCompraRequest,
  EstadoCuentaProveedor,
  AnalisisProductoProveedor
} from '../models/compras.models';
import { Reporte606 } from '../models/reporte606.models';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly baseUrl: string;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/Compras`;
  }

  listar(idEmpresa: number, estado?: string): Observable<FacturaCompra[]> {
    const q = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return this.http.get<FacturaCompra[]>(`${this.baseUrl}/${idEmpresa}${q}`);
  }

  pendientes(idEmpresa: number, idProveedor?: number): Observable<FacturaCompra[]> {
    const q = idProveedor ? `?idProveedor=${idProveedor}` : '';
    return this.http.get<FacturaCompra[]>(`${this.baseUrl}/Pendientes/${idEmpresa}${q}`);
  }

  pendientesRecepcion(
    idEmpresa: number,
    texto?: string,
    idProveedor?: number
  ): Observable<FacturaCompra[]> {
    const params: string[] = [];
    if (texto) params.push(`texto=${encodeURIComponent(texto)}`);
    if (idProveedor) params.push(`idProveedor=${idProveedor}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.http.get<FacturaCompra[]>(`${this.baseUrl}/PendientesRecepcion/${idEmpresa}${q}`);
  }

  obtenerParaRecepcion(id: number, idEmpresa: number): Observable<FacturaCompra> {
    return this.http.get<FacturaCompra>(`${this.baseUrl}/Recepcion/${id}/${idEmpresa}`);
  }

  confirmarRecepcion(id: number, request: ConfirmarRecepcionCompraRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/Recepcion`, request, this.httpOptions);
  }

  obtener(id: number, idEmpresa: number): Observable<FacturaCompra> {
    return this.http.get<FacturaCompra>(`${this.baseUrl}/Detalle/${id}/${idEmpresa}`);
  }

  guardarBorrador(request: GuardarFacturaCompraRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/Borrador`, request, this.httpOptions);
  }

  confirmar(id: number, request: ConfirmarFacturaCompraRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/Confirmar`, request, this.httpOptions);
  }

  registrarPago(id: number, request: RegistrarPagoProveedorRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/Pago`, request, this.httpOptions);
  }

  obtenerPagos(id: number, idEmpresa: number): Observable<PagoProveedor[]> {
    return this.http.get<PagoProveedor[]>(`${this.baseUrl}/${id}/Pagos/${idEmpresa}`);
  }

  anular(id: number, idEmpresa: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/Anular/${idEmpresa}`, {}, this.httpOptions);
  }

  listarOrdenes(idEmpresa: number, estado?: string): Observable<FacturaCompra[]> {
    const q = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return this.http.get<FacturaCompra[]>(`${this.baseUrl}/Ordenes/${idEmpresa}${q}`);
  }

  guardarBorradorOrden(request: GuardarFacturaCompraRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/Ordenes/Borrador`, request, this.httpOptions);
  }

  emitirOrden(id: number, request: { idEmpresa: number; idUsuario: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/Ordenes/${id}/Emitir`, request, this.httpOptions);
  }

  enviarOrden(
    id: number,
    request: { idEmpresa: number; idUsuario: number; emailDestino?: string; mensaje?: string }
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/Ordenes/${id}/Enviar`, request, this.httpOptions);
  }

  generarFacturaDesdeOrden(id: number, idEmpresa: number, idUsuario = 0): Observable<any> {
    const q = idUsuario ? `?idUsuario=${idUsuario}` : '';
    return this.http.post(
      `${this.baseUrl}/Ordenes/${id}/GenerarFactura/${idEmpresa}${q}`,
      {},
      this.httpOptions
    );
  }

  estadoCuentaProveedor(
    idEmpresa: number,
    idProveedor: number,
    desde: string,
    hasta: string
  ): Observable<EstadoCuentaProveedor> {
    const q = `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;
    return this.http.get<EstadoCuentaProveedor>(
      `${this.baseUrl}/EstadoCuenta/${idEmpresa}/${idProveedor}${q}`
    );
  }

  analisisProductoProveedor(
    idEmpresa: number,
    filtros: {
      idProducto?: number;
      idProveedor?: number;
      idAlmacen?: number;
      desde?: string;
      hasta?: string;
    } = {}
  ): Observable<AnalisisProductoProveedor> {
    const params: string[] = [];
    if (filtros.idProducto) params.push(`idProducto=${filtros.idProducto}`);
    if (filtros.idProveedor) params.push(`idProveedor=${filtros.idProveedor}`);
    if (filtros.idAlmacen) params.push(`idAlmacen=${filtros.idAlmacen}`);
    if (filtros.desde) params.push(`desde=${encodeURIComponent(filtros.desde)}`);
    if (filtros.hasta) params.push(`hasta=${encodeURIComponent(filtros.hasta)}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.http.get<AnalisisProductoProveedor>(`${this.baseUrl}/AnalisisProducto/${idEmpresa}${q}`);
  }

  reporte606(
    idEmpresa: number,
    desde: string,
    hasta: string,
    periodo?: string
  ): Observable<Reporte606> {
    const params = [
      `desde=${encodeURIComponent(desde)}`,
      `hasta=${encodeURIComponent(hasta)}`
    ];
    if (periodo) {
      params.push(`periodo=${encodeURIComponent(periodo)}`);
    }
    return this.http.get<Reporte606>(`${this.baseUrl}/Reporte606/${idEmpresa}?${params.join('&')}`);
  }
}
