import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface CrearNotaCreditoLinea {
  idFacturaDetalle: number;
  cantidad: number;
}

export interface CrearNotaCreditoRequest {
  idFacturaHeader: number;
  idEmpresa: number;
  idUsuario: number;
  observacion?: string;
  lineas: CrearNotaCreditoLinea[];
}

export interface CrearNotaCreditoComercialRequest {
  idEmpresa: number;
  idUsuario: number;
  /** Opcional: en e-CF el receptor viene de la factura (RNC/nombre), no del catálogo. */
  idCliente?: number | null;
  idFacturaHeader?: number | null;
  concepto: string;
  monto: number;
  montoItbis?: number | null;
}

export interface NotaCreditoResultado {
  idNotaCredito: number;
  numeroDocumento: string;
  ncf: string;
  total: number;
  mensaje: string;
  trackId?: string;
  estadoDgii?: string;
  emisionPendiente?: boolean;
  mensajeEmision?: string;
  saldoDisponible?: number;
  idSaldoAFavor?: number;
  montoAplicadoCxc?: number;
}

export interface TicketNotaCreditoDetalle {
  cantidad: number;
  descripcion: string;
  precio: number;
  itbis?: number;
  subTotal: number;
}

export interface TicketNotaCredito {
  idNotaCredito?: number;
  numeroDocumento?: string;
  ncf?: string;
  ncfModificado?: string;
  numeroFactura?: string;
  fecha?: string | Date;
  cliente?: string;
  rnc?: string;
  subTotal?: number;
  totalItbis?: number;
  total?: number;
  nombreEmpresa?: string;
  telefonoEmpresa?: string;
  direccionEmpresa?: string;
  observacion?: string;
  trackId?: string;
  estadoDgii?: string;
  tipoDocumentoOrigen?: string;
  saldoDisponible?: number;
  emisionPendiente?: boolean;
  mensajeEmision?: string;
  fechaEmisionEcf?: string | Date;
  securityCode?: string;
  urlQR?: string;
  rncEmisor?: string;
  detalles: TicketNotaCreditoDetalle[];
  esPreview?: boolean;
}

export interface NotaCreditoListado {
  idNotaCredito: number;
  numeroDocumento: string;
  ncf: string;
  ncfModificado: string;
  idFacturaHeader: number;
  numeroFactura: string;
  nombreCliente: string;
  rnc: string;
  subTotal: number;
  totalItbis: number;
  total: number;
  observacion: string;
  fechaInseccion: string;
  cantidadProductos: number;
  productosDevueltos: string;
  tieneComprobante: boolean;
  trackId?: string;
  estadoDgii?: string;
  tipoDocumentoOrigen?: string;
  saldoDisponible?: number;
  estado?: string;
  emisionPendiente?: boolean;
  fechaEmisionEcf?: string;
}

export interface ClienteSaldoAFavorListado {
  idSaldoAFavor: number;
  idCliente: number;
  nombreCliente: string;
  idNotaCredito: number;
  ncfNotaCredito?: string;
  numeroDocumentoNotaCredito?: string;
  montoOriginal: number;
  saldoDisponible: number;
  estado: string;
  fecha: string;
  observacion?: string;
}

@Injectable({ providedIn: 'root' })
export class NotasCreditoService {

  private readonly baseUrl: string;

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/NotasCredito`;
  }

  crearNotaCredito(
    payload: CrearNotaCreditoRequest
  ): Observable<NotaCreditoResultado> {

    return this.httpClient.post<NotaCreditoResultado>(
      `${this.baseUrl}/Crear`,
      payload,
      this.httpOptions
    );
  }

  crearNotaCreditoComercial(
    payload: CrearNotaCreditoComercialRequest
  ): Observable<NotaCreditoResultado> {
    return this.httpClient.post<NotaCreditoResultado>(
      `${this.baseUrl}/CrearComercial`,
      payload,
      this.httpOptions
    );
  }

  reintentarEmision(
    idNotaCredito: number,
    idEmpresa: number,
    idUsuario: number
  ): Observable<NotaCreditoResultado> {
    return this.httpClient.post<NotaCreditoResultado>(
      `${this.baseUrl}/ReintentarEmision/${idNotaCredito}?idEmpresa=${idEmpresa}&idUsuario=${idUsuario}`,
      {},
      this.httpOptions
    );
  }

  getTicket(
    idNotaCredito: number,
    idEmpresa: number
  ): Observable<TicketNotaCredito> {

    return this.httpClient.get<TicketNotaCredito>(
      `${this.baseUrl}/ticket/${idNotaCredito}/${idEmpresa}`
    );
  }

  listar(
    idEmpresa: number,
    desde?: string,
    hasta?: string,
    soloConComprobante = false
  ): Observable<NotaCreditoListado[]> {

    const params = new URLSearchParams();

    if (desde) {
      params.set('desde', desde);
    }

    if (hasta) {
      params.set('hasta', hasta);
    }

    if (soloConComprobante) {
      params.set('soloConComprobante', 'true');
    }

    const query = params.toString();
    const suffix = query ? `?${query}` : '';

    return this.httpClient.get<NotaCreditoListado[]>(
      `${this.baseUrl}/listado/${idEmpresa}${suffix}`
    );
  }

  listarSaldosAFavor(
    idEmpresa: number,
    idCliente?: number
  ): Observable<ClienteSaldoAFavorListado[]> {
    const qs = idCliente && idCliente > 0
      ? `?idCliente=${idCliente}`
      : '';
    return this.httpClient.get<ClienteSaldoAFavorListado[]>(
      `${this.baseUrl}/saldos-a-favor/${idEmpresa}${qs}`
    );
  }

  obtenerSaldoPorNumero(
    idEmpresa: number,
    idCliente: number,
    numero: string
  ): Observable<ClienteSaldoAFavorListado> {
    const qs = `?idCliente=${idCliente}&numero=${encodeURIComponent(numero)}`;
    return this.httpClient.get<ClienteSaldoAFavorListado>(
      `${this.baseUrl}/saldos-a-favor/${idEmpresa}/por-numero${qs}`
    );
  }
}
