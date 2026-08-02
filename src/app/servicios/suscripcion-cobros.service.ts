import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface SuscripcionResumen {
  activas: number;
  pendientePago: number;
  pagoReportado: number;
  suspendidas: number;
  canceladas: number;
  pagosPendientesValidacion: number;
  ciclosAbiertos: SuscripcionCiclo[];
}

export interface SuscripcionCiclo {
  idCiclo: number;
  idEmpresa: number;
  nombreEmpresa?: string;
  anio: number;
  mes: number;
  fechaGeneracion: string;
  monto: number;
  idPlan?: number;
  estado: string;
}

export interface SuscripcionEvento {
  idEvento: number;
  idEmpresa: number;
  idCiclo?: number;
  tipo: string;
  detalle?: string;
  canal?: string;
  idUsuario?: number;
  fecha: string;
}

export interface SuscripcionEmpresaCobro {
  idEmpresa: number;
  nombreComercial: string;
  estadoServicio: string;
  pagadoServicio: boolean;
  idPlan?: number;
  nombrePlan?: string;
  montoServicio?: number;
  cargoAdicional?: number;
  limiteFacturacion?: number;
  totalCiclo?: number;
  /** @deprecated */
  precioPlanCatalogo?: number;
  /** @deprecated */
  precioPlanEspecialUsd?: number | null;
}

export interface SuscripcionCuentaCobro {
  id: number;
  banco: string;
  numeroCuenta: string;
  titular: string;
  cedula: string;
  correo?: string;
  cuentaEstandar?: string;
  activo: boolean;
  orden: number;
}

@Injectable({ providedIn: 'root' })
export class SuscripcionCobrosService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/SuscripcionCobros`;
  }

  resumen(): Observable<SuscripcionResumen> {
    return this.http.get<SuscripcionResumen>(`${this.baseUrl}/resumen`);
  }

  empresas(): Observable<SuscripcionEmpresaCobro[]> {
    return this.http.get<SuscripcionEmpresaCobro[]>(`${this.baseUrl}/empresas`);
  }

  ciclos(idEmpresa?: number): Observable<SuscripcionCiclo[]> {
    const params: any = {};
    if (idEmpresa != null) params.idEmpresa = idEmpresa;
    return this.http.get<SuscripcionCiclo[]>(`${this.baseUrl}/ciclos`, { params });
  }

  eventos(idEmpresa: number, top = 100): Observable<SuscripcionEvento[]> {
    return this.http.get<SuscripcionEvento[]>(`${this.baseUrl}/eventos/${idEmpresa}`, {
      params: { top: top.toString() }
    });
  }

  calculo(idEmpresa: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/calculo/${idEmpresa}`);
  }

  detalleCiclo(idCiclo: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ciclo/${idCiclo}/detalle`);
  }

  procesarDiario(): Observable<any> {
    return this.http.post(`${this.baseUrl}/procesar-diario`, {});
  }

  /** Null en precio = quitar especial y volver al catálogo. */
  precioPlanEspecial(idEmpresa: number, precioPlanEspecialUsd: number | null, idUsuario?: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/precio-plan-especial`, {
      idEmpresa,
      precioPlanEspecialUsd,
      idUsuario
    });
  }

  /** Tarifa dinámica por empresa (sin catálogo de planes). */
  tarifaEmpresa(
    idEmpresa: number,
    montoServicio: number,
    cargoAdicional: number,
    limiteFacturacion: number,
    idUsuario?: number,
    cargoReconexionDop?: number
  ): Observable<any> {
    return this.http.put(`${this.baseUrl}/tarifa-empresa`, {
      idEmpresa,
      montoServicio,
      cargoAdicional,
      limiteFacturacion,
      cargoReconexionDop,
      idUsuario
    });
  }

  cuentasCobro(soloActivas = true): Observable<SuscripcionCuentaCobro[]> {
    return this.http.get<SuscripcionCuentaCobro[]>(`${this.baseUrl}/cuentas-cobro`, {
      params: { soloActivas: String(soloActivas) }
    });
  }

  guardarCuentaCobro(dto: Partial<SuscripcionCuentaCobro> & {
    banco: string;
    numeroCuenta: string;
    titular: string;
    cedula: string;
  }): Observable<SuscripcionCuentaCobro> {
    return this.http.post<SuscripcionCuentaCobro>(`${this.baseUrl}/cuentas-cobro`, dto);
  }

  eliminarCuentaCobro(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cuentas-cobro/${id}`);
  }
}
