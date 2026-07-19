import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface FiscalFeatureFlags {
  idEmpresa: number;
  tieneConfiguracion: boolean;
  fiscalActivo: boolean;
  generar606: boolean;
  generar607: boolean;
  generarIt1: boolean;
  facturacionElectronicaActiva: boolean;
  it1Activo?: boolean;
  fotoVentaRelevante?: boolean;
  fotoCompraRelevante?: boolean;
}

export interface DgiiConfiguracionEmpresa {
  idEmpresa: number;
  fiscalActivo: boolean;
  generar606: boolean;
  generar607: boolean;
  generarIt1: boolean;
  facturacionElectronicaActiva: boolean;
  regimenTributarioCodigo?: string;
  versionInstructivoPreferida?: string;
  activo?: boolean;
  razonSocial?: string;
  declaranteNombre?: string;
  declaranteCalidad?: string;
}

@Injectable({ providedIn: 'root' })
export class DgiiConfigService {
  private readonly baseUrl: string;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/DgiiConfig`;
  }

  getFeatures(idEmpresa: number): Observable<FiscalFeatureFlags> {
    return this.http.get<FiscalFeatureFlags>(`${this.baseUrl}/${idEmpresa}/features`);
  }

  getConfig(idEmpresa: number): Observable<DgiiConfiguracionEmpresa> {
    return this.http.get<DgiiConfiguracionEmpresa>(`${this.baseUrl}/${idEmpresa}`);
  }

  upsert(idEmpresa: number, dto: DgiiConfiguracionEmpresa): Observable<DgiiConfiguracionEmpresa> {
    return this.http.put<DgiiConfiguracionEmpresa>(
      `${this.baseUrl}/${idEmpresa}`,
      dto,
      this.httpOptions
    );
  }
}
