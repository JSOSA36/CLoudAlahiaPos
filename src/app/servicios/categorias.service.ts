// src/app/servicios/categorias.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { categorias } from '../models/categorias';
import { categoriadto } from '../models/categoriadto';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  private readonly baseUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    // Queda: https://apikds.alahiapos.com/api/Categorias
    this.baseUrl = `${this.config.apiUrl}/Categorias`;
  }

  GetListadoCategorias(IdEmpresa: number): Observable<categorias[]> {
    return this.httpClient.get<categorias[]>(`${this.baseUrl}/${IdEmpresa}`);
  }
  GetCategoriaVenta(IdEmpresa: number): Observable<categorias[]> {
    return this.httpClient.get<categorias[]>(`${this.baseUrl}/GetCategoriaVenta/${IdEmpresa}`);
  }

  DeleteIten(id: number): Observable<number> {
    return this.httpClient.delete<number>(`${this.baseUrl}/${id}`);
  }

  EnviarItem(value: FormData): Observable<any> {
    return this.httpClient.post<any>(this.baseUrl + '/', value);
  }

  EditarCategoria(value: FormData): Observable<any> {
    return this.httpClient.put<any>(this.baseUrl + '/', value);
  }
}
