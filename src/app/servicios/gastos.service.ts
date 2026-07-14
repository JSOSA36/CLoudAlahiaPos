// ✅ src/app/servicios/gastos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class GastosService {

  private readonly baseUrl: string;
  private readonly httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // ✅ Resultado final: https://apikds.alahiapos.com/api/Gastos
    this.baseUrl = `${this.config.apiUrl}/Gastos`;
  }

  /** 🔹 Crear un nuevo gasto */
  crearGasto(gasto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, gasto, this.httpOptions);
  }

  /** 🔹 Obtener todos los gastos de una empresa */
  getGastos(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${idEmpresa}`);
  }

  /** 🔹 Anular un gasto con motivo */
  anularGasto(payload: {
    idGasto: number;
    idEmpresa: number;
    motivoAnulacion: string;
    usuarioAnulo?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/AnularGasto`, payload, this.httpOptions);
  }

  /** 🔹 Actualizar un gasto existente */
  actualizarGasto(gasto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${gasto.idGasto}`, gasto, this.httpOptions);
  }

  /** 🔹 Obtener el total de gastos del mes actual */
  getTotalGastos(idEmpresa: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/GetTotalGastos?IdEmpresa=${idEmpresa}`);
  }
}
