import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { facturaheader } from '../models/facturaheader';
import { historicoventadto } from '../models/historicoventadto';
import { cierrecaja } from '../models/cierrecaja';
import { ComisionesResultDto } from '../models/comisionesresultdto';
import { AppConfigService } from './app-config.service';
import { FacturaHeaderDto } from '../Modales/facturaheader.dto';
import { ServicioRankingDto } from '../models/ServicioRankingDto .models';
import { CuentaPorCobrarDto } from '../models/CuentaPorCobrarDto .models';
import { CierreCajaDto } from '../models/CierreCajaDto.models';
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

  createFacturaDirecta(dto: any) {
  return this.httpClient.post(`${this.baseUrl}/ProcesarFactura`, dto);
}
  GetListadoOrdenes(IdEmpresa: number): Observable<facturaheader[]> {
  return this.httpClient.get<facturaheader[]>(
    `${this.baseUrl}/GetAllOrdenes?IdEmpresa=${IdEmpresa}`
  );
}

  GetListadoCotizaciones(IdEmpresa: number): Observable<facturaheader[]> {
    return this.httpClient.get<facturaheader[]>(
      `${this.baseUrl}/GetAllCotizaciones?IdEmpresa=${IdEmpresa}`
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
  motivoAnulacion: string;
  usuarioAnulo?: string;
}): Observable<any> {
  return this.httpClient.post<any>(
    `${this.baseUrl}/AnularFactura`,
    {
      idFacturaHeader: payload.idFacturaHeader,
      idEmpresa: payload.idEmpresa,
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
  fechaHasta: string
): Observable<facturaheader[]> {

  return this.httpClient.get<facturaheader[]>(

    `${this.baseUrl}/GetAllOrdenesByFecha?IdEmpresa=${IdEmpresa}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`

  );
}
GetReporte607(
  desde: string,
  hasta: string,
  idEmpresa: number
): Observable<any[]> {

  return this.httpClient.get<any[]>(

    `${this.baseUrl}/Reporte607?desde=${desde}&hasta=${hasta}&idEmpresa=${idEmpresa}`

  );
}
  GetAllFacturaPendiente(IdCliente: number, IdEmpresa: number): Observable<FacturaHeaderDto[]> {
    return this.httpClient.get<FacturaHeaderDto[]>(
      `${this.baseUrl}/GetAllFacturaPendiente/${IdCliente}/${IdEmpresa}`
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
   
  GetCuentasPorCobrar(idEmpresa: number): Observable<CuentaPorCobrarDto[]> {
  return this.httpClient.get<CuentaPorCobrarDto[]>(`${this.baseUrl}/GetCuentasPorCobrar/${idEmpresa}`);
}

}
