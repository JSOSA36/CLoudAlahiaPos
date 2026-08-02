import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface ModuloCatalogoItem {
  id: number;
  codigo: string;
  nombre: string;
  asignable: boolean;
  seleccionado: boolean;
}

export interface EmpresaAdminListItem {
  idEmpresa: number;
  nombreComercial: string;
  rnc?: string;
  correElectronico?: string;
  telefono?: string;
  estado: boolean;
  estadoServicio: string;
  montoServicio: number;
  fechaTerminacion: string;
  esDemoVigente: boolean;
  cantidadModulos: number;
  limiteUsuario?: number;
}

export interface EmpresaAdminDetalle extends EmpresaAdminListItem {
  direccion?: string;
  codigosModulo: string[];
  modulosDisponibles: ModuloCatalogoItem[];
}

export interface EmpresaAdminAltaRequest {
  nombreComercial: string;
  rnc?: string;
  direccion: string;
  telefono?: string;
  correElectronico: string;
  adminPassword: string;
  limiteUsuario: number;
  esDemo: boolean;
  diasDemo: number;
  montoServicio: number;
  codigosModulo: string[];
}

export interface EmpresaAdminAltaResult {
  idEmpresa: number;
  user: string;
  password: string;
  fechaTerminacion: string;
  esDemo: boolean;
  idPerfil: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class EmpresaAdminService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/EmpresaAdmin`;
  }

  listado(): Observable<EmpresaAdminListItem[]> {
    return this.http.get<EmpresaAdminListItem[]>(`${this.baseUrl}/listado`);
  }

  catalogoModulos(idEmpresa?: number): Observable<ModuloCatalogoItem[]> {
    const q = idEmpresa ? `?idEmpresa=${idEmpresa}` : '';
    return this.http.get<ModuloCatalogoItem[]>(`${this.baseUrl}/catalogo-modulos${q}`);
  }

  detalle(idEmpresa: number): Observable<EmpresaAdminDetalle> {
    return this.http.get<EmpresaAdminDetalle>(`${this.baseUrl}/${idEmpresa}`);
  }

  alta(body: EmpresaAdminAltaRequest): Observable<EmpresaAdminAltaResult> {
    return this.http.post<EmpresaAdminAltaResult>(`${this.baseUrl}/alta`, body);
  }

  actualizarDemo(idEmpresa: number, body: { esDemo: boolean; diasDemo: number; montoServicio: number }) {
    return this.http.put(`${this.baseUrl}/${idEmpresa}/demo`, body);
  }

  sincronizarModulos(idEmpresa: number, codigosModulo: string[]) {
    return this.http.put(`${this.baseUrl}/${idEmpresa}/modulos`, { codigosModulo });
  }
}
