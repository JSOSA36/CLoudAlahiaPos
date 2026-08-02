import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  BuscarCandidatosPayload,
  ConciliacionResumen,
  ConciliacionWorkspace,
  CrearConciliacionPayload,
  DeshacerMatchPayload,
  MarcarConciliacionPayload,
  MovimientoFinancieroListado,
  ReabrirConciliacionPayload,
  RegistrarCargoInteresPayload,
  ResolverExtractoLineaResultado,
  ResolverLineaConciliacionPayload,
  TesoreriaConciliacion,
  TesoreriaExtractoImport
} from '../models/Tesoreria.models';

@Injectable({ providedIn: 'root' })
export class TesoreriaConciliacionService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/TesoreriaConciliacion`;
  }

  crear(payload: CrearConciliacionPayload): Observable<TesoreriaConciliacion> {
    return this.http.post<TesoreriaConciliacion>(this.baseUrl, payload);
  }

  getById(idEmpresa: number, idConciliacion: number): Observable<TesoreriaConciliacion> {
    return this.http.get<TesoreriaConciliacion>(
      `${this.baseUrl}/${idEmpresa}/${idConciliacion}`
    );
  }

  workspace(idEmpresa: number, idConciliacion: number): Observable<ConciliacionWorkspace> {
    return this.http.get<ConciliacionWorkspace>(
      `${this.baseUrl}/${idEmpresa}/${idConciliacion}/Workspace`
    );
  }

  adjuntarExtracto(payload: {
    idTesoreriaConciliacion: number;
    idTesoreriaExtractoImport: number;
    idEmpresa: number;
    idUsuario: number;
    ejecutarMatching?: boolean;
  }): Observable<TesoreriaExtractoImport> {
    return this.http.post<TesoreriaExtractoImport>(`${this.baseUrl}/AdjuntarExtracto`, payload);
  }

  matching(payload: {
    idTesoreriaConciliacion: number;
    idEmpresa: number;
    idUsuario: number;
    toleranciaDias?: number;
  }): Observable<ConciliacionWorkspace> {
    return this.http.post<ConciliacionWorkspace>(`${this.baseUrl}/Matching`, payload);
  }

  resolverLinea(payload: ResolverLineaConciliacionPayload): Observable<ResolverExtractoLineaResultado> {
    return this.http.post<ResolverExtractoLineaResultado>(`${this.baseUrl}/ResolverLinea`, payload);
  }

  deshacerMatch(payload: DeshacerMatchPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/DeshacerMatch`, payload);
  }

  buscarCandidatos(payload: BuscarCandidatosPayload): Observable<MovimientoFinancieroListado[]> {
    return this.http.post<MovimientoFinancieroListado[]>(`${this.baseUrl}/BuscarCandidatos`, payload);
  }

  pendientes(idEmpresa: number, idConciliacion: number): Observable<MovimientoFinancieroListado[]> {
    return this.http.get<MovimientoFinancieroListado[]>(
      `${this.baseUrl}/${idEmpresa}/${idConciliacion}/Pendientes`
    );
  }

  marcar(payload: MarcarConciliacionPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Marcar`, payload);
  }

  desmarcar(payload: MarcarConciliacionPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Desmarcar`, payload);
  }

  cargoInteres(payload: RegistrarCargoInteresPayload): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/CargoInteres`, payload);
  }

  cerrar(idEmpresa: number, idConciliacion: number, idUsuario: number): Observable<TesoreriaConciliacion> {
    return this.http.post<TesoreriaConciliacion>(
      `${this.baseUrl}/${idEmpresa}/${idConciliacion}/Cerrar?idUsuario=${idUsuario}`,
      {}
    );
  }

  reabrir(payload: ReabrirConciliacionPayload): Observable<TesoreriaConciliacion> {
    return this.http.post<TesoreriaConciliacion>(`${this.baseUrl}/Reabrir`, payload);
  }

  historial(idEmpresa: number, idCuentaFinanciera?: number): Observable<ConciliacionResumen[]> {
    const qs = idCuentaFinanciera != null
      ? `?idCuentaFinanciera=${idCuentaFinanciera}`
      : '';
    return this.http.get<ConciliacionResumen[]>(
      `${this.baseUrl}/Historial/${idEmpresa}${qs}`
    );
  }

  pendientesConciliacion(
    idEmpresa: number,
    idCuentaFinanciera: number,
    hasta?: string
  ): Observable<MovimientoFinancieroListado[]> {
    const qs = hasta ? `?hasta=${hasta}` : '';
    return this.http.get<MovimientoFinancieroListado[]>(
      `${this.baseUrl}/PendientesConciliacion/${idEmpresa}/${idCuentaFinanciera}${qs}`
    );
  }
}
