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

export interface NotaCreditoResultado {
  idNotaCredito: number;
  numeroDocumento: string;
  ncf: string;
  total: number;
  mensaje: string;
}

export interface TicketNotaCreditoDetalle {
  cantidad: number;
  descripcion: string;
  precio: number;
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
}
