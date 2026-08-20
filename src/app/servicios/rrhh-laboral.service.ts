import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface EmpleadoLaboralDto {
  idEmpleadoLaboral?: number;
  idEmpresa: number;
  idEmpleados: number;
  tipoEmpleado: string;
  cargo?: string;
  departamento?: string;
  idDepartamento?: number | null;
  idCargo?: number | null;
  fechaIngreso?: string;
  estadoLaboral: string;
  correo?: string;
  paqueteCargo?: {
    idCargo: number;
    nombre: string;
    salarioBase: number;
    moneda: string;
    frecuenciaPago: string;
    tipoEmpleado: string;
    idJornada?: number | null;
    nombreJornada?: string;
    resumenHorario?: string;
    dias?: Array<{
      diaSemana: number;
      esLaborable: boolean;
      horaEntrada?: string;
      horaSalida?: string;
      recesoInicio?: string;
      recesoFin?: string;
    }>;
    beneficios: Array<{
      idBeneficio: number;
      codigo: string;
      nombre: string;
      tipoCalculo: string;
      monto: number;
      periodicidad: string;
      enEspecie: boolean;
      formaDesembolso?: string;
      diaPagoMes?: number | null;
      metodoPago?: string | null;
      descontarConsumoNomina?: boolean;
    }>;
  } | null;
}

export interface NominaAsignacionDto {
  idAsignacion?: number;
  idEmpresa: number;
  idEmpleados: number;
  conceptCode: string;
  montoFijo?: number;
  tasa?: number;
  periodicidad: string;
  vigenteDesde?: string;
  vigenteHasta?: string;
  activo: boolean;
  nota?: string;
}

@Injectable({ providedIn: 'root' })
export class RrhhLaboralService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, config: AppConfigService) {
    this.baseUrl = `${config.apiUrl}/rrhh`;
  }

  getLaboral(idEmpresa: number, idEmpleados: number): Observable<EmpleadoLaboralDto | null> {
    return this.http.get<EmpleadoLaboralDto | null>(`${this.baseUrl}/laboral/${idEmpresa}/${idEmpleados}`);
  }

  saveLaboral(body: EmpleadoLaboralDto, motivo?: string): Observable<EmpleadoLaboralDto> {
    const q = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
    return this.http.put<EmpleadoLaboralDto>(`${this.baseUrl}/laboral${q}`, body);
  }

  getAsignaciones(idEmpresa: number, idEmpleados: number): Observable<NominaAsignacionDto[]> {
    return this.http.get<NominaAsignacionDto[]>(`${this.baseUrl}/asignaciones/${idEmpresa}/${idEmpleados}`);
  }

  saveAsignacion(body: NominaAsignacionDto): Observable<NominaAsignacionDto> {
    return this.http.put<NominaAsignacionDto>(`${this.baseUrl}/asignaciones`, body);
  }

  getConceptos(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/conceptos/${idEmpresa}`);
  }

  calcularDraft(body: {
    idEmpresa: number;
    idEmpleados: number;
    periodKey: string;
    inicio: string;
    fin: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/calcular-draft`, body);
  }
}
