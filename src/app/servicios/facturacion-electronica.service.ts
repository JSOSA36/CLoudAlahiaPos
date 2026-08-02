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

  healthCheck(idEmpresa?: number): Observable<any> {
    const params: any = {};
    if (idEmpresa) params.idEmpresa = idEmpresa;
    return this.http.get<any>(`${this.baseUrl}/health`, { params });
  }

  getProveedor(idEmpresa: number): Observable<{
    proveedor: string;
    etiqueta: string;
    nombre?: string;
    baseUrl?: string;
    usuario?: string;
    apiKeyConfigurado: boolean;
    passwordConfigurado: boolean;
    endpointEfectivo?: string;
    contrato?: string;
    ambienteDgiiAplicable: boolean;
  }> {
    return this.http.get<any>(`${this.baseUrl}/proveedor/${idEmpresa}`);
  }

  putProveedor(idEmpresa: number, body: {
    proveedor: string;
    nombre?: string;
    baseUrl?: string;
    apiKey?: string;
    usuario?: string;
    password?: string;
    clearApiKey?: boolean;
    clearPassword?: boolean;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/proveedor/${idEmpresa}`, body);
  }

  getCertificado(idEmpresa: number): Observable<{
    configurado: boolean;
    mensaje?: string;
    idCertificado?: number;
    nombreArchivo?: string;
    fechaExpiracion?: string;
    fechaCreacion?: string;
    ambiente?: string;
    vencido?: boolean;
    usable?: boolean;
    subject?: string;
    thumbprint?: string;
  }> {
    return this.http.get<any>(`${this.baseUrl}/certificado/${idEmpresa}`);
  }

  uploadCertificado(idEmpresa: number, archivo: File, password: string, ambiente?: string): Observable<any> {
    const form = new FormData();
    form.append('archivo', archivo, archivo.name);
    form.append('password', password);
    if (ambiente) form.append('ambiente', ambiente);
    return this.http.post<any>(`${this.baseUrl}/certificado/${idEmpresa}`, form);
  }

  getAmbiente(idEmpresa: number): Observable<{
    ambiente: string;
    etiqueta: string;
    etiquetaSecuencia: string;
    urls: {
      auth: string;
      recepcion: string;
      consulta: string;
      rfce: string;
      hostEcf?: string;
      hostFc?: string;
      ambientePath?: string;
    };
  }> {
    return this.http.get<any>(`${this.baseUrl}/ambiente/${idEmpresa}`);
  }

  putAmbiente(idEmpresa: number, ambiente: string): Observable<{
    ambiente: string;
    etiqueta: string;
    etiquetaSecuencia: string;
    secuenciasActualizadas: number;
    urls: {
      auth: string;
      recepcion: string;
      consulta: string;
      rfce: string;
    };
  }> {
    return this.http.put<any>(`${this.baseUrl}/ambiente/${idEmpresa}`, { ambiente });
  }

  /** Consulta estado DGII por TrackId y persiste el resultado en el ECF. */
  consultarEstado(trackId: string): Observable<{
    trackId: string;
    estado: string;
    encf?: string;
    mensajes?: string[];
    securityCode?: string;
    urlQR?: string;
    esAceptado?: boolean;
    esRechazado?: boolean;
  }> {
    return this.http.get<any>(`${this.baseUrl}/gateway/consultar/${encodeURIComponent(trackId)}`);
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
