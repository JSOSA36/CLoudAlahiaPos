// src/app/servicios/pago-empresa.service.ts
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
    // 👉 https://apikds.alahiapos.com/api/PagoEmpresa
    this.baseUrl = `${this.config.apiUrl}/PagoEmpresa`;
  }

  // =====================================================
  // 🔹 SUBIR PAGO (FORMDATA)
  // =====================================================
  subirPago(data: CrearPagoDto): Observable<RespuestaDto> {

    const formData = new FormData();

    formData.append('IdEmpresa', data.idEmpresa.toString());
    formData.append('Monto', data.monto.toString());

    if (data.imagen) {
      formData.append('Imagen', data.imagen);
    }

    return this.http.post<RespuestaDto>(
      `${this.baseUrl}/SubirPago`,
      formData
    );
  }

  // =====================================================
  // 🔹 OBTENER TODOS LOS PAGOS (ADMIN)
  // =====================================================
  obtenerPagos(): Observable<PagoEmpresa[]> {
    return this.http.get<PagoEmpresa[]>(
      `${this.baseUrl}/ObtenerPagos`
    );
  }

  // =====================================================
  // 🔹 VALIDAR PAGO (APROBAR / RECHAZAR)
  // =====================================================
  validarPago(data: ValidarPagoDto): Observable<RespuestaDto> {
    return this.http.post<RespuestaDto>(
      `${this.baseUrl}/ValidarPago`,
      data
    );
  }

}