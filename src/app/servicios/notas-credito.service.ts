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
}
