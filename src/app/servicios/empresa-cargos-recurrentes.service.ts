import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface EmpresaCargoRecurrente {
  id: number;
  idEmpresa: number;
  tipoCargo: string;
  idModulo?: number;
  codigo: string;
  nombre: string;
  montoMensual: number;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
  observacion?: string;
  nombreEmpresa?: string;
  fechaCreacion: string;
}

export interface SuscripcionLineaFactura {
  tipoLinea: string;
  idCargo?: number;
  idModulo?: number;
  codigo?: string;
  nombre: string;
  monto: number;
  montoDop?: number;
}

export interface SuscripcionCalculoFactura {
  idEmpresa: number;
  idPlan?: number;
  nombrePlan?: string;
  montoServicio?: number;
  cargoAdicional?: number;
  limiteFacturacion?: number;
  cargoReconexionDop?: number;
  reconexionPendiente?: boolean;
  montoReconexion?: number;
  montoReconexionDop?: number;
  montoPlan: number;
  montoCargos: number;
  total: number;
  tasaUsdDop?: number;
  montoPlanDop?: number;
  montoCargosDop?: number;
  totalDop?: number;
  lineas: SuscripcionLineaFactura[];
  /** @deprecated */
  montoPlanCatalogo?: number;
  /** @deprecated */
  precioPlanEspecialUsd?: number | null;
  /** @deprecated */
  usaPrecioPlanEspecial?: boolean;
}

export interface CrearCargoDto {
  idEmpresa: number;
  tipoCargo: string;
  idModulo?: number;
  codigo?: string;
  nombre?: string;
  montoMensual?: number;
  fechaInicio?: string;
  fechaFin?: string;
  observacion?: string;
  idUsuarioCreacion?: number;
}

@Injectable({ providedIn: 'root' })
export class EmpresaCargosRecurrentesService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/EmpresaCargosRecurrentes`;
  }

  listar(idEmpresa: number, soloActivos = false): Observable<EmpresaCargoRecurrente[]> {
    return this.http.get<EmpresaCargoRecurrente[]>(`${this.baseUrl}/empresa/${idEmpresa}`, {
      params: { soloActivos: String(soloActivos) }
    });
  }

  calculo(idEmpresa: number): Observable<SuscripcionCalculoFactura> {
    return this.http.get<SuscripcionCalculoFactura>(`${this.baseUrl}/calculo/${idEmpresa}`);
  }

  crear(dto: CrearCargoDto): Observable<EmpresaCargoRecurrente> {
    return this.http.post<EmpresaCargoRecurrente>(this.baseUrl, dto);
  }

  actualizar(dto: {
    id: number;
    montoMensual: number;
    fechaInicio?: string;
    fechaFin?: string;
    observacion?: string;
    nombre?: string;
    idUsuarioModificacion?: number;
  }): Observable<EmpresaCargoRecurrente> {
    return this.http.put<EmpresaCargoRecurrente>(this.baseUrl, dto);
  }

  desactivar(id: number, idUsuario?: number): Observable<any> {
    const params: any = {};
    if (idUsuario != null) params.idUsuario = idUsuario;
    return this.http.post(`${this.baseUrl}/${id}/desactivar`, {}, { params });
  }
}
