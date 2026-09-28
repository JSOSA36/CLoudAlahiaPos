import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  ArsAntiguedad,
  ArsAseguradora,
  ArsCuentaPorCobrar,
  ArsDesgloseCaja,
  ArsDocumentoCxC,
  ArsPagoHistorial,
  ArsVentasResumen
} from '../models/ars-aseguradora';

@Injectable({ providedIn: 'root' })
export class ArsAseguradoraService {
  private readonly baseUrl: string;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/ArsAseguradora`;
  }

  listar(idEmpresa: number, soloActivos = true): Observable<ArsAseguradora[]> {
    return this.http.get<ArsAseguradora[]>(
      `${this.baseUrl}/${idEmpresa}?soloActivos=${soloActivos}`
    );
  }

  empresaUsaArs(idEmpresa: number): Observable<{ activo: boolean }> {
    return this.http.get<{ activo: boolean }>(`${this.baseUrl}/EmpresaUsaArs/${idEmpresa}`);
  }

  crear(ars: ArsAseguradora): Observable<ArsAseguradora> {
    return this.http.post<ArsAseguradora>(this.baseUrl, ars, this.httpOptions);
  }

  actualizar(id: number, ars: ArsAseguradora): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, ars, this.httpOptions);
  }

  activar(id: number, idEmpresa: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/Activar/${id}/${idEmpresa}`, {}, this.httpOptions);
  }

  desactivar(id: number, idEmpresa: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/Desactivar/${id}/${idEmpresa}`, {}, this.httpOptions);
  }

  cuentasPorCobrar(idEmpresa: number, extras: Record<string, string | number> = {}): Observable<ArsCuentaPorCobrar[]> {
    return this.http.get<ArsCuentaPorCobrar[]>(
      `${this.baseUrl}/CuentasPorCobrar/${idEmpresa}`,
      { params: this.params(extras) }
    );
  }

  documentos(idEmpresa: number, extras: Record<string, string | number> = {}): Observable<ArsDocumentoCxC[]> {
    return this.http.get<ArsDocumentoCxC[]>(
      `${this.baseUrl}/Documentos/${idEmpresa}`,
      { params: this.params(extras) }
    );
  }

  pagos(idEmpresa: number, idFacturaHeader = 0, idArs = 0): Observable<ArsPagoHistorial[]> {
    let params = new HttpParams()
      .set('idFacturaHeader', String(idFacturaHeader))
      .set('idArs', String(idArs));
    return this.http.get<ArsPagoHistorial[]>(`${this.baseUrl}/Pagos/${idEmpresa}`, { params });
  }

  ventas(idEmpresa: number, extras: Record<string, string | number> = {}): Observable<ArsVentasResumen[]> {
    return this.http.get<ArsVentasResumen[]>(
      `${this.baseUrl}/Ventas/${idEmpresa}`,
      { params: this.params(extras) }
    );
  }

  antiguedad(idEmpresa: number, idArs = 0): Observable<ArsAntiguedad[]> {
    return this.http.get<ArsAntiguedad[]>(
      `${this.baseUrl}/Antiguedad/${idEmpresa}`,
      { params: new HttpParams().set('idArs', String(idArs)) }
    );
  }

  desgloseCaja(idEmpresa: number, idUsuario: number): Observable<ArsDesgloseCaja[]> {
    return this.http.get<ArsDesgloseCaja[]>(`${this.baseUrl}/DesgloseCaja/${idEmpresa}/${idUsuario}`);
  }

  registrarPago(body: {
    idEmpresa: number;
    idFacturaHeader: number;
    monto: number;
    formaPago?: string;
    nota?: string;
    idUsuario?: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/RegistrarPago`, body, this.httpOptions);
  }

  registrarPagoLote(body: {
    idEmpresa: number;
    idFacturaHeaders: number[];
    monto: number;
    formaPago?: string;
    nota?: string;
    idUsuario?: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/RegistrarPagoLote`, body, this.httpOptions);
  }

  private params(extras: Record<string, string | number>): HttpParams {
    let params = new HttpParams();
    Object.keys(extras).forEach(k => {
      const v = extras[k];
      if (v !== null && v !== undefined && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return params;
  }
}
