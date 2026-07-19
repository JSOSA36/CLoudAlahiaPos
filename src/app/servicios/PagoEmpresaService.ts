import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { PagoEmpresa } from '../models/PagoEmpresa.models';
import { CrearPagoDto } from '../models/CrearPagoDto.models';
import { ValidarPagoDto } from '../models/ValidarPagoDto.models';
import { RespuestaDto } from '../models/RespuestaDto.models';

@Injectable({ providedIn: 'root' })
export class PagoEmpresaService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/PagoEmpresa`;
  }

  subirPago(data: CrearPagoDto): Observable<RespuestaDto> {
    const formData = new FormData();
    formData.append('IdEmpresa', data.idEmpresa.toString());
    formData.append('Monto', data.monto.toString());
    if (data.fechaPago) formData.append('FechaPago', data.fechaPago);
    if (data.banco) formData.append('Banco', data.banco);
    if (data.referencia) formData.append('Referencia', data.referencia);
    if (data.idUsuarioReporta != null) {
      formData.append('IdUsuarioReporta', data.idUsuarioReporta.toString());
    }
    if (data.imagen) {
      formData.append('Imagen', data.imagen);
    }
    return this.http.post<RespuestaDto>(`${this.baseUrl}/SubirPago`, formData);
  }

  obtenerPagos(): Observable<PagoEmpresa[]> {
    return this.http.get<PagoEmpresa[]>(`${this.baseUrl}/ObtenerPagos`);
  }

  obtenerPagosEmpresa(idEmpresa: number): Observable<PagoEmpresa[]> {
    return this.http.get<PagoEmpresa[]>(`${this.baseUrl}/ObtenerPagosPorEmpresa/${idEmpresa}`);
  }

  validarPago(data: ValidarPagoDto): Observable<RespuestaDto> {
    return this.http.post<RespuestaDto>(`${this.baseUrl}/ValidarPago`, data);
  }
}
