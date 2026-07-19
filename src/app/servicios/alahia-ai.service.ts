import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ParametrosService } from './parametros.service';
import {
  AlahiaAiChatRequest,
  AlahiaAiChatResponse,
  AlahiaAiResumenResponse
} from '../models/alahia-ai.models';

@Injectable({ providedIn: 'root' })
export class AlahiaAiService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService,
    private parametros: ParametrosService
  ) {
    this.baseUrl = `${this.config.apiUrl}/AlahiaAi`;
  }

  chat(message: string, conversationId?: string | null): Observable<AlahiaAiChatResponse> {
    const body: AlahiaAiChatRequest = {
      idEmpresa: this.parametros.IdEmpresa,
      idUsuario: this.parametros.IdUsuario,
      conversationId: conversationId || null,
      message,
      modulosPermitidos: this.parametros.getModulosCodigos()
    };
    return this.http.post<AlahiaAiChatResponse>(`${this.baseUrl}/chat`, body);
  }

  resumen(): Observable<AlahiaAiResumenResponse> {
    const mods = this.parametros.getModulosCodigos().join(',');
    const params = new HttpParams()
      .set('idUsuario', String(this.parametros.IdUsuario))
      .set('modulos', mods || 'ALAHIA_AI,DASHBOARD');
    return this.http.get<AlahiaAiResumenResponse>(
      `${this.baseUrl}/resumen/${this.parametros.IdEmpresa}`,
      { params }
    );
  }

  historial(conversationId: string): Observable<{ ticketBody: string }> {
    return this.http.get<{ ticketBody: string }>(`${this.baseUrl}/historial/${conversationId}`);
  }
}
