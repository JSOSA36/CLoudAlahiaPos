import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { LibroDiarioLinea, MayorGeneralResumen } from '../models/AsientoContable.models';

@Injectable({ providedIn: 'root' })
export class ContabilidadLibrosService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/ContabilidadLibros`;
  }

  getLibroDiario(idEmpresa: number, desde: string, hasta: string): Observable<LibroDiarioLinea[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<LibroDiarioLinea[]>(`${this.baseUrl}/libro-diario/${idEmpresa}`, { params });
  }

  getMayorGeneral(idEmpresa: number, idCuenta: number, desde: string, hasta: string): Observable<MayorGeneralResumen> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<MayorGeneralResumen>(`${this.baseUrl}/mayor-general/${idEmpresa}/${idCuenta}`, { params });
  }

  getMayorGeneralResumen(idEmpresa: number, desde: string, hasta: string): Observable<MayorGeneralResumen[]> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<MayorGeneralResumen[]>(`${this.baseUrl}/mayor-general-resumen/${idEmpresa}`, { params });
  }
}
