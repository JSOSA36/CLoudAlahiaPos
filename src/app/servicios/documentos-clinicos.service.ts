import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { DocumentoClinico } from '../models/documento-clinico.models';

@Injectable({
  providedIn: 'root'
})
export class DocumentosClinicosService {

  private readonly baseUrl: string;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/DocumentosClinicos`;
  }

  getByEmpresa(idEmpresa: number): Observable<DocumentoClinico[]> {
    return this.http.get<DocumentoClinico[]>(
      `${this.baseUrl}/empresa/${idEmpresa}`
    );
  }

  getByCliente(idEmpresa: number, idCliente: number): Observable<DocumentoClinico[]> {
    return this.http.get<DocumentoClinico[]>(
      `${this.baseUrl}/cliente/${idEmpresa}/${idCliente}`
    );
  }

  getById(id: number): Observable<DocumentoClinico> {
    return this.http.get<DocumentoClinico>(`${this.baseUrl}/${id}`);
  }

  crear(documento: DocumentoClinico): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, documento, this.httpOptions);
  }

  actualizar(documento: DocumentoClinico): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}`, documento, this.httpOptions);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
