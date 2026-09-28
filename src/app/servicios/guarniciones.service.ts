import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { Guarnicion } from '../models/guarnicion.model';

@Injectable({ providedIn: 'root' })
export class GuarnicionesService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/Guarniciones`;
  }

  listar(idEmpresa: number): Observable<Guarnicion[]> {
    return this.http.get<Guarnicion[]>(`${this.baseUrl}/${idEmpresa}`);
  }

  crear(row: Partial<Guarnicion>): Observable<Guarnicion> {
    return this.http.post<Guarnicion>(this.baseUrl, row);
  }

  actualizar(id: number, row: Partial<Guarnicion>): Observable<Guarnicion> {
    return this.http.put<Guarnicion>(`${this.baseUrl}/${id}`, row);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
