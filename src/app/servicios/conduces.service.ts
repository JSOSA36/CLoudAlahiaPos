import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  ConduceDto,
  CrearConduceRequest,
  EstadoEntregaFacturaDto,
  FacturaParaConduceDto,
  LineaPendienteEntregaDto,
} from '../models/conduces.models';

@Injectable({ providedIn: 'root' })
export class ConducesService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/Conduces`;
  }

  listar(
    idEmpresa: number,
    opts: { desde?: string; hasta?: string; idFactura?: number; q?: string } = {}
  ): Observable<ConduceDto[]> {
    let params = new HttpParams();
    if (opts.desde) params = params.set('desde', opts.desde);
    if (opts.hasta) params = params.set('hasta', opts.hasta);
    if (opts.idFactura && opts.idFactura > 0) {
      params = params.set('idFactura', String(opts.idFactura));
    }
    if (opts.q?.trim()) params = params.set('q', opts.q.trim());
    return this.http.get<ConduceDto[]>(`${this.baseUrl}/${idEmpresa}`, { params });
  }

  getById(idConduce: number, idEmpresa: number): Observable<ConduceDto> {
    return this.http.get<ConduceDto>(
      `${this.baseUrl}/Detalle/${idConduce}/${idEmpresa}`
    );
  }

  facturasDisponibles(
    idEmpresa: number,
    opts: { desde?: string; hasta?: string; q?: string } = {}
  ): Observable<FacturaParaConduceDto[]> {
    let params = new HttpParams();
    if (opts.desde) params = params.set('desde', opts.desde);
    if (opts.hasta) params = params.set('hasta', opts.hasta);
    if (opts.q?.trim()) params = params.set('q', opts.q.trim());
    return this.http.get<FacturaParaConduceDto[]>(
      `${this.baseUrl}/FacturasDisponibles/${idEmpresa}`,
      { params }
    );
  }

  lineasPendientes(
    idFactura: number,
    idEmpresa: number
  ): Observable<LineaPendienteEntregaDto[]> {
    return this.http.get<LineaPendienteEntregaDto[]>(
      `${this.baseUrl}/LineasPendientes/${idFactura}/${idEmpresa}`
    );
  }

  estadoEntrega(
    idFactura: number,
    idEmpresa: number
  ): Observable<EstadoEntregaFacturaDto> {
    return this.http.get<EstadoEntregaFacturaDto>(
      `${this.baseUrl}/EstadoEntrega/${idFactura}/${idEmpresa}`
    );
  }

  crear(request: CrearConduceRequest): Observable<ConduceDto> {
    return this.http.post<ConduceDto>(this.baseUrl, request);
  }

  anular(idConduce: number, idEmpresa: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${idConduce}/${idEmpresa}`
    );
  }
}
