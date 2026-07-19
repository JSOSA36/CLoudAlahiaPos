import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AppConfigService } from './app-config.service';
import {
  PRODUCCION_TIPO_POS_ORDEN,
  ProduccionCancelarRequest,
  ProduccionConfiguracion,
  ProduccionDashboardResumen,
  ProduccionEstadoOrigen,
  ProduccionFlujo,
  ProduccionHistorial,
  ProduccionPrioridadRequest,
  ProduccionTrabajo,
  ProduccionTransicionRequest
} from '../models/produccion.models';

@Injectable({ providedIn: 'root' })
export class ProduccionService implements OnDestroy {
  private readonly baseUrl: string;
  private readonly hubBase: string;
  private hub?: signalR.HubConnection;

  private idEmpresa = 0;
  private trabajos$ = new BehaviorSubject<ProduccionTrabajo[]>([]);
  private upsert$ = new Subject<ProduccionTrabajo>();
  private reconnectHydrate$ = new Subject<void>();

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/produccion`;
    this.hubBase = this.config.apiUrl.replace(/\/api\/?$/, '');
  }

  trabajosObs$(): Observable<ProduccionTrabajo[]> {
    return this.trabajos$.asObservable();
  }

  upsertObs$(): Observable<ProduccionTrabajo> {
    return this.upsert$.asObservable();
  }

  reconnectHydrateObs$(): Observable<void> {
    return this.reconnectHydrate$.asObservable();
  }

  getTrabajosSnapshot(): ProduccionTrabajo[] {
    return this.trabajos$.value;
  }

  async startRealtime(idEmpresa: number): Promise<void> {
    this.idEmpresa = idEmpresa;
    if (!idEmpresa) return;
    await this.connectHub();
  }

  async stopRealtime(): Promise<void> {
    if (this.hub) {
      try { await this.hub.stop(); } catch { /* ignore */ }
      this.hub = undefined;
    }
  }

  async hydrateActivos(idEmpresa: number, tipoTrabajo = PRODUCCION_TIPO_POS_ORDEN): Promise<ProduccionTrabajo[]> {
    const list = await firstValueFrom(this.listarActivos(idEmpresa, tipoTrabajo));
    this.trabajos$.next(list || []);
    return list || [];
  }

  listarActivos(idEmpresa: number, tipoTrabajo?: string): Observable<ProduccionTrabajo[]> {
    let params = new HttpParams().set('idEmpresa', String(idEmpresa));
    if (tipoTrabajo) params = params.set('tipoTrabajo', tipoTrabajo);
    return this.http.get<ProduccionTrabajo[]>(`${this.baseUrl}/trabajos/activos`, { params });
  }

  /** Último estado por documento origen (incluye entregadas / fuera del tablero). */
  estadosPorOrigen(
    idEmpresa: number,
    origenIds: number[],
    origenTipo = 'FacturaHeader'
  ): Observable<ProduccionEstadoOrigen[]> {
    const ids = (origenIds || []).filter(id => id > 0);
    let params = new HttpParams()
      .set('idEmpresa', String(idEmpresa))
      .set('origenTipo', origenTipo);
    if (ids.length) params = params.set('origenIds', ids.join(','));
    return this.http.get<ProduccionEstadoOrigen[]>(`${this.baseUrl}/trabajos/estados-por-origen`, { params });
  }

  obtenerFlujoActivo(idEmpresa: number, tipoTrabajo = PRODUCCION_TIPO_POS_ORDEN): Observable<ProduccionFlujo> {
    const params = new HttpParams()
      .set('idEmpresa', String(idEmpresa))
      .set('tipoTrabajo', tipoTrabajo);
    return this.http.get<ProduccionFlujo>(`${this.baseUrl}/flujos/activo`, { params });
  }

  obtenerConfig(idEmpresa: number): Observable<ProduccionConfiguracion> {
    const params = new HttpParams().set('idEmpresa', String(idEmpresa));
    return this.http.get<ProduccionConfiguracion>(`${this.baseUrl}/config`, { params });
  }

  dashboard(idEmpresa: number, tipoTrabajo?: string): Observable<ProduccionDashboardResumen> {
    let params = new HttpParams().set('idEmpresa', String(idEmpresa));
    if (tipoTrabajo) params = params.set('tipoTrabajo', tipoTrabajo);
    return this.http.get<ProduccionDashboardResumen>(`${this.baseUrl}/dashboard/resumen`, { params });
  }

  historial(idEmpresa: number, idTrabajo: number): Observable<ProduccionHistorial[]> {
    const params = new HttpParams().set('idEmpresa', String(idEmpresa));
    return this.http.get<ProduccionHistorial[]>(`${this.baseUrl}/trabajos/${idTrabajo}/historial`, { params });
  }

  transicionar(idEmpresa: number, idTrabajo: number, body: ProduccionTransicionRequest): Observable<ProduccionTrabajo> {
    const params = new HttpParams().set('idEmpresa', String(idEmpresa));
    return this.http.post<ProduccionTrabajo>(`${this.baseUrl}/trabajos/${idTrabajo}/transicion`, body, { params });
  }

  cancelar(idEmpresa: number, idTrabajo: number, body: ProduccionCancelarRequest): Observable<ProduccionTrabajo> {
    const params = new HttpParams().set('idEmpresa', String(idEmpresa));
    return this.http.post<ProduccionTrabajo>(`${this.baseUrl}/trabajos/${idTrabajo}/cancelar`, body, { params });
  }

  prioridad(idEmpresa: number, idTrabajo: number, body: ProduccionPrioridadRequest): Observable<ProduccionTrabajo> {
    const params = new HttpParams().set('idEmpresa', String(idEmpresa));
    return this.http.post<ProduccionTrabajo>(`${this.baseUrl}/trabajos/${idTrabajo}/prioridad`, body, { params });
  }

  aplicarTrabajoLocal(trabajo: ProduccionTrabajo): void {
    if (!trabajo) return;
    const list = [...this.trabajos$.value];
    const idx = list.findIndex(t => t.idTrabajo === trabajo.idTrabajo);
    if (!trabajo.activoEnTablero) {
      if (idx >= 0) list.splice(idx, 1);
    } else if (idx >= 0) {
      list[idx] = trabajo;
    } else {
      list.unshift(trabajo);
    }
    this.trabajos$.next(list);
    this.upsert$.next(trabajo);
  }

  esConflicto(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 409;
  }

  mensajeError(err: unknown, fallback = 'No se pudo completar la acción.'): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (typeof body === 'string' && body.trim()) return body;
      if (body?.message) return String(body.message);
      if (err.status === 409) return 'El trabajo fue modificado por otro usuario. Se actualizó el tablero.';
    }
    return fallback;
  }

  ngOnDestroy(): void {
    this.stopRealtime();
    this.trabajos$.complete();
    this.upsert$.complete();
    this.reconnectHydrate$.complete();
  }

  private async connectHub(): Promise<void> {
    if (!this.idEmpresa) return;
    if (this.hub) {
      try { await this.hub.stop(); } catch { /* ignore */ }
      this.hub = undefined;
    }

    const url = `${this.hubBase}/hubs/produccion?idEmpresa=${this.idEmpresa}`;
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .build();

    this.hub.on('produccion:trabajoUpsert', (payload: ProduccionTrabajo) => {
      this.aplicarTrabajoLocal(payload);
    });
    this.hub.on('produccion:trabajoEstado', (payload: ProduccionTrabajo) => {
      this.aplicarTrabajoLocal(payload);
    });

    this.hub.onreconnected(() => {
      this.reconnectHydrate$.next();
    });

    try {
      await this.hub.start();
    } catch {
      setTimeout(() => this.connectHub(), 5000);
    }
  }
}
