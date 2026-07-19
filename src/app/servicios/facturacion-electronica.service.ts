import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  SecuenciaEcfDisponible,
  SecuenciaEcfDto,
  SecuenciaEcfCreateDto,
  SecuenciaEcfUpdateDto,
  EmisionEcfRequest,
  EmisionEcfResultado,
  EmisionEcfResultadoCompleto
} from '../models/facturacion-electronica.models';

@Injectable({ providedIn: 'root' })
export class FacturacionElectronicaService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/FacturacionElectronica`;
  }

  emitir(request: EmisionEcfRequest): Observable<EmisionEcfResultado> {
    return this.http.post<EmisionEcfResultado>(
      `${this.baseUrl}/emitir`, request
    );
  }

  emitirYEnviar(request: EmisionEcfRequest): Observable<EmisionEcfResultadoCompleto> {
    return this.http.post<EmisionEcfResultadoCompleto>(
      `${this.baseUrl}/emitir-enviar`, request
    );
  }

  getSecuenciasDisponibles(idEmpresa: number): Observable<SecuenciaEcfDisponible[]> {
    return this.http.get<SecuenciaEcfDisponible[]>(
      `${this.baseUrl}/secuencias-disponibles/${idEmpresa}`
    );
  }

  getSecuencias(idEmpresa: number): Observable<SecuenciaEcfDto[]> {
    return this.http.get<SecuenciaEcfDto[]>(
      `${this.baseUrl}/secuencias/${idEmpresa}`
    );
  }

  getSecuencia(id: number): Observable<SecuenciaEcfDto> {
    return this.http.get<SecuenciaEcfDto>(
      `${this.baseUrl}/secuencia/${id}`
    );
  }

  createSecuencia(dto: SecuenciaEcfCreateDto): Observable<SecuenciaEcfDto> {
    return this.http.post<SecuenciaEcfDto>(
      `${this.baseUrl}/secuencias`, dto
    );
  }

  updateSecuencia(id: number, dto: SecuenciaEcfUpdateDto): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/secuencias/${id}`, dto
    );
  }

  desactivarSecuencia(id: number): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/secuencias/${id}/desactivar`, {}
    );
  }

  peek(idEmpresa: number, tipoEcf: number): Observable<{ encf: string }> {
    return this.http.get<{ encf: string }>(
      `${this.baseUrl}/peek/${idEmpresa}/${tipoEcf}`
    );
  }

  healthCheck(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/health`);
  }

  getHistorial(
    idEmpresa: number,
    desde?: string, hasta?: string,
    tipo?: number | null, estado?: string
  ): Observable<any[]> {
    let params: any = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    if (tipo) params.tipo = tipo;
    if (estado) params.estado = estado;
    return this.http.get<any[]>(
      `${this.baseUrl}/historial/${idEmpresa}`, { params }
    );
  }

  reprocesar(idEcf: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/reprocesar/${idEcf}`, {}
    );
  }

  getDashboard(idEmpresa: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/dashboard/${idEmpresa}`
    );
  }
}
