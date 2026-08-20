import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface FichaClinicaAnamnesis {
  diabetes: boolean;
  hipertension: boolean;
  anemia: boolean;
  falcemia: boolean;
  asma: boolean;
  hemorragia: boolean;
  cardiacos: boolean;
  renales: boolean;
  gastricas: boolean;
  dolor: boolean;
  hepatitis: boolean;
  vih: boolean;
  tuberculosis: boolean;
  otraContagio?: string;
}

export interface FichaClinicaDiente {
  numero: string;
  marcado: boolean;
  nota?: string;
}

export interface FichaClinica {
  idFichaClinica: number;
  idEmpresa: number;
  idCliente: number;
  nombres?: string;
  apellidos?: string;
  sexo?: string;
  estadoCivil?: string;
  nacionalidad?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  anamnesis: FichaClinicaAnamnesis;
  dientes: FichaClinicaDiente[];
  medicamentos?: string;
  observaciones?: string;
  color?: string;
  tipoProtesis?: string;
  laboratorio?: string;
  idUsuarioCreacion: number;
  idUsuarioModificacion?: number;
  cedulaRnc?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  fechaNacimiento?: string;
}

export interface FichaClinicaCuentaLinea {
  fecha: string;
  numeroFactura?: string;
  diente?: string;
  trabajo: string;
  costo: number;
  pagos: number;
  balance: number;
  idFacturaHeader: number;
}

export interface FichaClinicaVista {
  ficha: FichaClinica;
  cliente: {
    idCliente: number;
    nombreComercial?: string;
    cedulaRnc?: string;
    telefono?: string;
    celular?: string;
    email?: string;
    direccion?: string;
    fechaNacimiento?: string;
    edad?: number;
  };
  cuenta: FichaClinicaCuentaLinea[];
  totalCosto: number;
  totalPagos: number;
  totalBalance: number;
  nombreEmpresa?: string;
  existe: boolean;
}

@Injectable({ providedIn: 'root' })
export class FichaClinicaService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, config: AppConfigService) {
    this.baseUrl = `${config.apiUrl}/FichaClinica`;
  }

  getVista(idEmpresa: number, idCliente: number): Observable<FichaClinicaVista> {
    return this.http.get<FichaClinicaVista>(`${this.baseUrl}/${idEmpresa}/${idCliente}`);
  }

  guardar(ficha: FichaClinica): Observable<FichaClinicaVista> {
    return this.http.put<FichaClinicaVista>(this.baseUrl, ficha);
  }
}
