// src/app/servicios/mesas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesas } from '../models/mesas';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class MesasService {

  private readonly baseUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Resultado final: https://apikds.alahiapos.com/api/Mesas
    this.baseUrl = `${this.config.apiUrl}/Mesas`;
  }

  UpdateMesa(mesa: Mesas): Observable<Mesas> {
    return this.httpClient.put<Mesas>(`${this.baseUrl}/`, mesa, this.httpOptions);
  }

  GetMesasByZonas(Id: number): Observable<Mesas[]> {
    return this.httpClient.get<Mesas[]>(`${this.baseUrl}/ByZona/${Id}`);
  }
}
