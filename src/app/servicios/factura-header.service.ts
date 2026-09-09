import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import {
  PROCESAR_FACTURA_REINTENTOS_RED,
  PROCESAR_FACTURA_TIMEOUT_MS,
  esErrorRedCobro
} from './cobro-idempotencia';
import { facturaheader } from '../models/facturaheader';
import { historicoventadto } from '../models/historicoventadto';
import { cierrecaja } from '../models/cierrecaja';
import { ComisionesResultDto } from '../models/comisionesresultdto';
import { AppConfigService } from './app-config.service';
import { FacturaHeaderDto } from '../Modales/facturaheader.dto';
import { ServicioRankingDto } from '../models/ServicioRankingDto .models';
import { CuentaPorCobrarDto } from '../models/CuentaPorCobrarDto .models';
import { CierreCajaDto } from '../models/CierreCajaDto.models';
import { Reporte607 } from '../models/reporte607.models';
@Injectable({ providedIn: 'root' })
export class FacturaHeaderService {

  private readonly baseUrl: string;
  
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Resultado: https://apikds.alahiapos.com/api/FacturaHeader
    this.baseUrl = `${this.config.apiUrl}/FacturaHeader`;
    
  }

  Editarorden(value: facturaheader): Observable<facturaheader> {
    return this.httpClient.put<facturaheader>(`${this.baseUrl}/`, value, this.httpOptions);
  }

  Enviarorden(value: facturaheader): Observable<facturaheader> {
    return this.httpClient.post<facturaheader>(`${this.baseUrl}/`, value, this.httpOptions);
  }

  getSecuenciasDocumento(idEmpresa: number): Observable<Array<{
    idTipoDocumento: number;
    prefijo: string;
    secuenciaActual: number;
  }>> {
    return this.httpClient.get<Array<{
      idTipoDocumento: number;
      prefijo: string;
      secuenciaActual: number;
    }>>(`${this.baseUrl}/secuencias-documento/${idEmpresa}`);
  }

  createFacturaDirecta(dto: any) {
    return this.httpClient.post(`${this.baseUrl}/ProcesarFactura`, dto).pipe(
      timeout(PROCESAR_FACTURA_TIMEOUT_MS),
      retry({
        count: PROCESAR_FACTURA_REINTENTOS_RED,
        delay: (error) => {
          if (!esErrorRedCobro(error)) {
            return throwError(() => error);
          }
          return timer(400);
        }
      })
    );
  }
  GetListadoOrdenes(IdEmpresa: number, idSucursalFiltro = 0): Observable<facturaheader[]> {
  return this.httpClient.get<facturaheader[]>(
    `${this.baseUrl}/GetAllOrdenes?IdEmpresa=${IdEmpresa}&idSucursalFiltro=${idSucursalFiltro || 0}`
  );
}

  GetListadoCotizaciones(IdEmpresa: number, idSucursalFiltro = 0): Observable<facturaheader[]> {
    return this.httpClient.get<facturaheader[]>(
    `${this.baseUrl}/GetAllCotizaciones?IdEmpresa=${IdEmpresa}&idSucursalFiltro=${idSucursalFiltro || 0}`
    );
  }
 GetListadoFacturas(IdEmpresa: number): Observable<facturaheader[]> {
  return this.httpClient.get<facturaheader[]>(
    `${this.baseUrl}/GetAllFacturas?IdEmpresa=${IdEmpresa}`
  );
}
AnularFactura(payload: {
  idFacturaHeader: number;
  idEmpresa: number;
  idUsuario?: number;
  motivoAnulacion: string;
  usuarioAnulo?: string;
}): Observable<any> {
  return this.httpClient.post<any>(
    `${this.baseUrl}/AnularFactura`,
    {
      idFacturaHeader: payload.idFacturaHeader,
      idEmpresa: payload.idEmpresa,
      idUsuario: payload.idUsuario || 0,
      motivoAnulacion: payload.motivoAnulacion,
      usuarioAnulo: payload.usuarioAnulo || ''
    },
    this.httpOptions
  );
}
GetIngresosCajaActual(
  idEmpresa: number,
  idUsuario: number
): Observable<any[]> {

  return this.httpClient.get<any[]>(

    `${this.baseUrl}/GetIngresosCajaAbierta?idEmpresa=${idEmpresa}&idUsuario=${idUsuario}`

  );
}
// ======================================================
// 🔥 REPORTE 607
// ======================================================

GetListadoOrdenesByFecha(
  IdEmpresa: number,
  fechaDesde: string,
  fechaHasta: string,
  idSucursalFiltro = 0
): Observable<facturaheader[]> {

  return this.httpClient.get<facturaheader[]>(

    `${this.baseUrl}/GetAllOrdenesByFecha?IdEmpresa=${IdEmpresa}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&idSucursalFiltro=${idSucursalFiltro || 0}`

  );
}
GetReporte607(
  desde: string,
  hasta: string,
  idEmpresa: number,
  periodo?: string
): Observable<Reporte607> {
  let url =
    `${this.baseUrl}/Reporte607?desde=${desde}&hasta=${hasta}&idEmpresa=${idEmpresa}`;
  if (periodo) {
    url += `&periodo=${encodeURIComponent(periodo)}`;
  }
  return this.httpClient.get<Reporte607>(url);
}
  GetAllFacturaPendiente(
    IdCliente: number,
    IdEmpresa: number,
    idSucursalFiltro = 0
  ): Observable<FacturaHeaderDto[]> {
    return this.httpClient.get<FacturaHeaderDto[]>(
      `${this.baseUrl}/GetAllFacturaPendiente/${IdCliente}/${IdEmpresa}?idSucursalFiltro=${idSucursalFiltro || 0}`
    );
  }
GenerarOrdenDesdeCita(idCita: number): Observable<any> {
  return this.httpClient.post(
    `${this.baseUrl}/DesdeCita/${idCita}`,
    null, // 👈 no se envía body
    this.httpOptions
  );
}
  TotalDia(): Observable<number> {
    return this.httpClient.get<number>(`${this.baseUrl}/TotalVentaDia`);
  }

  TotalMes(): Observable<number> {
    return this.httpClient.get<number>(`${this.baseUrl}/TotalVentaMes`);
  }

  SendPrintLavador(IdFact: number, IdEmpresa: number): Observable<any> {
  return this.httpClient.get<any>(
    `${this.baseUrl}/RePrintLavador/${IdFact}`
  );
}

  GenerateFacts(dto: any): Observable<any> {
  return this.httpClient.post<any>(
    `${this.baseUrl}/GenerateFacts`,
    dto
  );
}


  CuentaxCobrar(): Observable<number> {
    return this.httpClient.get<number>(`${this.baseUrl}/CuentaxCobrar`);
  }

  CierreCaja(_Desde: string, _Hasta: string, IdEmpresa: number): Observable<cierrecaja[]> {
    return this.httpClient.get<cierrecaja[]>(`${this.baseUrl}/CierreCaja/${_Desde}/${_Hasta}/${IdEmpresa}`);
  }

  HistoricoVenta(): Observable<historicoventadto[]> {
    return this.httpClient.get<historicoventadto[]>(`${this.baseUrl}/GetSumFactura`);
  }

  DeleteIten(id: number): Observable<number> {
    return this.httpClient.delete<number>(`${this.baseUrl}/${id}`);
  }

  GetComisiones(_Desde: string, _Hasta: string, IdEmpresa: number): Observable<ComisionesResultDto[]> {
    return this.httpClient.get<ComisionesResultDto[]>(`${this.baseUrl}/GetComisiones/${_Desde}/${_Hasta}/${IdEmpresa}`);
  }

  PrintFact(IdFact: number): Observable<facturaheader[]> {
    return this.httpClient.get<facturaheader[]>(`${this.baseUrl}/GetFactura/${IdFact}`);
  }

  // 🔹 Nuevo método: Top 5 servicios más ofrecidos del mes
  GetTopServicios(IdEmpresa: number): Observable<ServicioRankingDto[]> {
    return this.httpClient.get<ServicioRankingDto[]>(
      `${this.baseUrl}/TopServicios/${IdEmpresa}`
    );
  }
   
  GetCuentasPorCobrar(idEmpresa: number, idSucursalFiltro = 0): Observable<CuentaPorCobrarDto[]> {
  return this.httpClient.get<CuentaPorCobrarDto[]>(
    `${this.baseUrl}/GetCuentasPorCobrar/${idEmpresa}?idSucursalFiltro=${idSucursalFiltro || 0}`
  );
}

  /** Link firmado para que el cliente final abra la cotización POS sin login. */
  crearLinkCotizacionPublica(
    idFacturaHeader: number,
    idEmpresa: number,
    publicBaseUrl?: string
  ): Observable<CotizacionPublicaLink> {
    const base =
      publicBaseUrl ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    return this.httpClient.post<CotizacionPublicaLink>(
      `${this.baseUrl}/cotizacion/${idFacturaHeader}/compartir?idEmpresa=${idEmpresa}`,
      { publicBaseUrl: base }
    );
  }

  obtenerCotizacionPublica(token: string): Observable<CotizacionPublicaVista> {
    return this.httpClient.get<CotizacionPublicaVista>(
      `${this.baseUrl}/cotizacion-publica/${encodeURIComponent(token)}`
    );
  }

  /** Preferir URL corta https (clickeable en WhatsApp) sobre localhost. */
  buildLinkCotizacionPublica(link: CotizacionPublicaLink | string): string {
    if (typeof link === 'string') {
      const origin =
        typeof window !== 'undefined' && window.location?.origin
          ? window.location.origin
          : '';
      return `${origin}/cotizacion/ver/${link}`;
    }

    const corta = (link.urlCorta || '').trim();
    if (corta) {
      return corta;
    }

    const larga = (link.url || '').trim();
    if (larga) {
      return larga;
    }

    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : '';
    return `${origin}/cotizacion/ver/${link.token}`;
  }

}

export interface CotizacionPublicaLink {
  token: string;
  idFacturaHeader: number;
  numeroDocumento: string;
  url?: string;
  urlCorta?: string;
}

export interface CotizacionPublicaLinea {
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
  subTotal: number;
}

export interface CotizacionPublicaVista {
  numeroDocumento: string;
  fecha: string;
  fechaValidez: string;
  nombreEmpresa: string;
  telefonoEmpresa?: string;
  direccionEmpresa?: string;
  logoEmpresa?: string;
  rncEmpresa?: string;
  clienteNombre: string;
  clienteTelefono?: string;
  clienteRnc?: string;
  clienteDireccion?: string;
  clienteCorreo?: string;
  subTotal: number;
  totalItbis: number;
  totalDescuento: number;
  total: number;
  nota?: string;
  moneda?: string;
  lineas: CotizacionPublicaLinea[];
}
