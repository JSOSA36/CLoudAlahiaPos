import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpresaDto } from '../models/empresadto.models';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class EmpresaService {

  private readonly baseUrl: string;

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Ejemplo: https://apikds.alahiapos.com/api/Empresa
    this.baseUrl = `${this.config.apiUrl}/Empresa`;
  }

  // 🔹 Obtener empresa por ID
  getEmpresa(id: number): Observable<EmpresaDto> {
    return this.httpClient.get<EmpresaDto>(`${this.baseUrl}/${id}`);
  }

  // 🔹 Obtener empresa por GUID público
  getEmpresaByGuid(guid: string): Observable<EmpresaDto> {
    return this.httpClient.get<EmpresaDto>(`${this.baseUrl}/GetEmpresa/${guid}`);
  }

  // 🔹 Obtener logo de la empresa (como blob)
  getLogo(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/GetLogo/${id}`, {
      responseType: 'blob'  // importante para imágenes/binarios
    });
  }

  // 🔹 Actualizar empresa con FormData (texto + imagen)
  updateEmpresa(value: FormData): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/`, value);
  }

  /** Guarda solo la URL del agente de impresión (ApiPrint). */
  setApiPrint(idEmpresa: number, apiPrint: string): Observable<any> {
    return this.httpClient.put<any>(`${this.baseUrl}/${idEmpresa}/api-print`, {
      apiPrint
    });
  }

  getCitasConfig(idEmpresa: number): Observable<{
    pedirVoucherCitas: boolean;
    montoReservaCitas: number;
    infoAgendar?: string;
    notificarCitasWhatsApp?: boolean;
  }> {
    return this.httpClient.get<{
      pedirVoucherCitas: boolean;
      montoReservaCitas: number;
      infoAgendar?: string;
      notificarCitasWhatsApp?: boolean;
    }>(`${this.baseUrl}/${idEmpresa}/citas-config`);
  }

  updateCitasConfig(idEmpresa: number, body: {
    pedirVoucherCitas: boolean;
    montoReservaCitas: number;
    infoAgendar?: string;
    notificarCitasWhatsApp?: boolean;
  }): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/${idEmpresa}/citas-config`, body);
  }
  // 🔥 MARCAR PAGO (ADMIN)
marcarPago(empresaId: number) {
  return this.httpClient.post(`${this.baseUrl}/MarcarPago/${empresaId}`, {});
}

// 🔥 MARCAR PENDIENTE (CLIENTE SUBE COMPROBANTE)
marcarPendiente(empresaId: number) {
  return this.httpClient.post(`${this.baseUrl}/MarcarPendiente/${empresaId}`, {});
}

// 🔥 ACTUALIZAR ESTADO (CRON O MANUAL)
actualizarEstado() {
  return this.httpClient.post(`${this.baseUrl}/ActualizarEstado`, {});
}

// 🔥 VALIDAR SI PUEDE OPERAR
puedeOperar(empresaId: number) {
  return this.httpClient.get<any>(`${this.baseUrl}/PuedeOperar/${empresaId}`);
}
}
