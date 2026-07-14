import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { Proveedor } from '../models/proveedores';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly baseUrl: string;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/Proveedores`;
  }

  listar(idEmpresa: number, soloActivos = true): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(
      `${this.baseUrl}/${idEmpresa}?soloActivos=${soloActivos}`
    );
  }

  obtener(id: number, idEmpresa: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.baseUrl}/GetbyId/${id}/${idEmpresa}`);
  }

  crear(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.baseUrl}`, proveedor, this.httpOptions);
  }

  actualizar(id: number, proveedor: Proveedor): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, proveedor, this.httpOptions);
  }

  desactivar(id: number, idEmpresa: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/Desactivar/${id}/${idEmpresa}`, {}, this.httpOptions);
  }

  tieneDocumentos(id: number): Observable<{ tieneDocumentos: boolean }> {
    return this.http.get<{ tieneDocumentos: boolean }>(`${this.baseUrl}/TieneDocumentos/${id}`);
  }
}
