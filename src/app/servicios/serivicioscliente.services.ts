import { ServicioDto } from '../models/serviciodto.models';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogoDto } from '../models/CatalogoDto .models';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class ServiciosClientesService {
  private readonly baseUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Resultado esperado: https://apikds.alahiapos.com/api/Empresa
    this.baseUrl = `${this.config.apiUrl}/Empresa`;
  }

  // 🔹 Obtener catálogo por IdEmpresa (uso interno en admin)
  getServiciosByEmpresa(idEmpresa: number): Observable<CatalogoDto> {
    return this.httpClient.get<CatalogoDto>(
      `${this.baseUrl}/Catalogo/${idEmpresa}`
    );
  }

  // 🔹 Obtener catálogo por GuidPublico (uso público en URLs)
  getServiciosByGuid(guid: string): Observable<CatalogoDto> {
    return this.httpClient.get<CatalogoDto>(
      `${this.baseUrl}/CatalogoGuid/${guid}`
    );
  }

  // 🔹 Obtener servicios por área
  getServiciosByArea(idArea: number): Observable<ServicioDto[]> {
    return this.httpClient.get<ServicioDto[]>(
      `${this.baseUrl}/area/${idArea}`
    );
  }

  // 🔹 Obtener un servicio específico
  getServicioById(idServicio: number): Observable<ServicioDto> {
    return this.httpClient.get<ServicioDto>(
      `${this.baseUrl}/${idServicio}`
    );
  }
}
