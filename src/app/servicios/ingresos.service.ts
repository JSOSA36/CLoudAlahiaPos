import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ingresos } from '../models/ingresos.models';
import { HistoricoIngresosDto } from '../models/historico-ingresos.dto';
import { CierreCajaDto } from '../models/CierreCajaDto.models';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class IngresosService {

  private readonly baseUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private httpClient: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/Ingresos`;
  }

  // =====================================================
  // 🔹 MÉTODOS CRUD BÁSICOS
  // =====================================================

  getAllIngresos(idEmpresa: number): Observable<Ingresos[]> {
    return this.httpClient.get<Ingresos[]>(
      `${this.baseUrl}/GetAllIngresos/${idEmpresa}`
    );
  }

  getIngresoById(idIngreso: number): Observable<Ingresos> {
    return this.httpClient.get<Ingresos>(
      `${this.baseUrl}/GetIngresoById/${idIngreso}`
    );
  }

  insertIngreso(ingreso: Ingresos): Observable<any> {
    return this.httpClient.post<any>(
      `${this.baseUrl}`,
      ingreso,
      this.httpOptions
    );
  }

  updateIngreso(idIngreso: number, ingreso: Ingresos): Observable<any> {
    return this.httpClient.put<any>(
      `${this.baseUrl}/${idIngreso}`,
      ingreso,
      this.httpOptions
    );
  }

  deleteIngreso(idIngreso: number): Observable<any> {
    return this.httpClient.delete<any>(
      `${this.baseUrl}/${idIngreso}`
    );
  }

  getIngresosByFecha(
    idEmpresa: number,
    fechaInicio: string,
    fechaFin: string,
    idSucursalFiltro = 0
  ): Observable<Ingresos[]> {
    return this.httpClient.get<Ingresos[]>(
      `${this.baseUrl}/GetIngresosByFecha/${idEmpresa}/${fechaInicio}/${fechaFin}?idSucursalFiltro=${idSucursalFiltro || 0}`
    );
  }

  // =====================================================
  // 🔥 NUEVO MÉTODO: CIERRE DE CAJA (INGRESOS REALES)
  // =====================================================

  /**
   * 🔐 Obtiene el cierre de caja real,
   * agrupado por forma de pago.
   */
  getIngresosByFechaCaja(
    idEmpresa: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<CierreCajaDto[]> {
    return this.httpClient.get<CierreCajaDto[]>(
      `${this.baseUrl}/GetIngresosByFechaCaja/${idEmpresa}/${fechaInicio}/${fechaFin}`
    );
  }
getIngresosPorLinea(idEmpresa: number, desde: string, hasta: string) {
  return this.httpClient.get<any[]>(
    `${this.baseUrl}/ingresos-por-linea`,
    {
      params: {
        idEmpresa: idEmpresa,
        fechaInicio: desde,
        fechaFin: hasta
      }
    }
  );
}
  // =====================================================
  // 🔹 MÉTODOS PARA DASHBOARD
  // =====================================================

  getTotalDia(idEmpresa: number): Observable<number> {
    return this.httpClient.get<number>(
      `${this.baseUrl}/GetTotalDia/${idEmpresa}`
    );
  }

  getTotalMes(idEmpresa: number): Observable<number> {
    return this.httpClient.get<number>(
      `${this.baseUrl}/GetTotalMes/${idEmpresa}`
    );
  }

  getHistorico(idEmpresa: number): Observable<HistoricoIngresosDto[]> {
    return this.httpClient.get<HistoricoIngresosDto[]>(
      `${this.baseUrl}/GetHistorico/${idEmpresa}`
    );
  }
}
