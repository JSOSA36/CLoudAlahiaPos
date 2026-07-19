import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  TicketDetalle,
  TicketFiltroAdmin,
  TicketListItem,
  TicketMetricas,
  TicketNotificacion
} from '../models/tickets.models';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/Tickets`;
  }

  crear(form: FormData): Observable<TicketDetalle> {
    return this.http.post<TicketDetalle>(`${this.baseUrl}/crear`, form);
  }

  /** Ticket sin sesión ERP: valida UserName + Password en el API. */
  crearDesdeLogin(form: FormData): Observable<TicketDetalle> {
    return this.http.post<TicketDetalle>(`${this.baseUrl}/crear-desde-login`, form);
  }

  listarEmpresa(idEmpresa: number): Observable<TicketListItem[]> {
    return this.http.get<TicketListItem[]>(`${this.baseUrl}/empresa/${idEmpresa}`);
  }

  listarAdmin(filtro: TicketFiltroAdmin): Observable<TicketListItem[]> {
    let params = new HttpParams();
    Object.entries(filtro || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<TicketListItem[]>(`${this.baseUrl}/admin/listar`, { params });
  }

  obtener(idTicket: number, idEmpresa?: number | null): Observable<TicketDetalle> {
    let params = new HttpParams();
    if (idEmpresa) params = params.set('idEmpresa', String(idEmpresa));
    return this.http.get<TicketDetalle>(`${this.baseUrl}/${idTicket}`, { params });
  }

  mensaje(idTicket: number, form: FormData): Observable<TicketDetalle> {
    return this.http.post<TicketDetalle>(`${this.baseUrl}/${idTicket}/mensaje`, form);
  }

  cambiarEstado(idTicket: number, body: { estado: string; idUsuario: number; nota?: string }): Observable<TicketDetalle> {
    return this.http.post<TicketDetalle>(`${this.baseUrl}/admin/${idTicket}/estado`, body);
  }

  metricas(idEmpresa?: number | null): Observable<TicketMetricas> {
    let params = new HttpParams();
    if (idEmpresa) params = params.set('idEmpresa', String(idEmpresa));
    return this.http.get<TicketMetricas>(`${this.baseUrl}/metricas`, { params });
  }

  notificaciones(idEmpresa: number, idUsuario?: number, soloNoLeidas = false): Observable<TicketNotificacion[]> {
    let params = new HttpParams().set('soloNoLeidas', String(soloNoLeidas));
    if (idUsuario) params = params.set('idUsuario', String(idUsuario));
    return this.http.get<TicketNotificacion[]>(`${this.baseUrl}/notificaciones/${idEmpresa}`, { params });
  }

  marcarLeida(idNotificacion: number, idEmpresa: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/notificaciones/${idNotificacion}/leer?idEmpresa=${idEmpresa}`, {});
  }

  marcarTodasLeidas(idEmpresa: number, idUsuario?: number): Observable<any> {
    let params = new HttpParams().set('idEmpresa', String(idEmpresa));
    if (idUsuario) params = params.set('idUsuario', String(idUsuario));
    return this.http.post(`${this.baseUrl}/notificaciones/leer-todas`, {}, { params });
  }
}
