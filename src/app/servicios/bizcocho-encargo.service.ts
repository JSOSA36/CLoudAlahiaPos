// src/app/servicios/bizcocho-encargo.service.ts

import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, map } from 'rxjs';

import { AppConfigService } from './app-config.service';

import {
  BizcochoEncargo,
  RequestBizcochoEncargoDto
} from '../models/BizcochoEncargo.models';

import { FacturaDto } from '../models/factura.model';

@Injectable({
  providedIn: 'root'
})
export class BizcochoEncargoService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {

    this.baseUrl =
      `${this.config.apiUrl}/BizcochoEncargo`;
  }

  // =========================
  // 📦 CRUD
  // =========================

  getAll(idEmpresa: number): Observable<BizcochoEncargo[]> {

    return this.http
      .get<BizcochoEncargo[]>(`${this.baseUrl}?idEmpresa=${idEmpresa}`)
      .pipe(
        map(list =>
          list.map(e => this.normalize(e))
        )
      );
  }

  getById(id: number): Observable<BizcochoEncargo> {

    return this.http
      .get<BizcochoEncargo>(
        `${this.baseUrl}/${id}`
      )
      .pipe(
        map(e => this.normalize(e))
      );
  }

  create(
    encargo: RequestBizcochoEncargoDto
  ): Observable<any> {

    return this.http.post(
      this.baseUrl,
      encargo
    );
  }

  update(
    encargo: BizcochoEncargo
  ): Observable<void> {

    return this.http.put<void>(
      this.baseUrl,
      encargo
    );
  }

  delete(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/${id}`
    );
  }

  // =========================
  // 🔍 FILTROS
  // =========================

  getPendientes():
    Observable<BizcochoEncargo[]> {

    return this.http
      .get<BizcochoEncargo[]>(
        `${this.baseUrl}/pendientes`
      )
      .pipe(
        map(list =>
          list.map(e => this.normalize(e))
        )
      );
  }

  getPorFecha(
    fecha: Date
  ): Observable<BizcochoEncargo[]> {

    const f = fecha.toISOString();

    return this.http
      .get<BizcochoEncargo[]>(
        `${this.baseUrl}/fecha?fecha=${f}`
      )
      .pipe(
        map(list =>
          list.map(e => this.normalize(e))
        )
      );
  }

  buscar(
    filtro: string
  ): Observable<BizcochoEncargo[]> {

    return this.http
      .get<BizcochoEncargo[]>(
        `${this.baseUrl}/buscar?filtro=${filtro}`
      )
      .pipe(
        map(list =>
          list.map(e => this.normalize(e))
        )
      );
  }

  // =========================
  // 💳 PAGOS
  // =========================

 pagar(dto: {

  idEncargo: number;
  idEmpresa: number;
  // 🔥 SUBTOTAL
  monto: number;

  // 🔥 ITBIS
  itbis: number;

  // 🔥 TOTAL FINAL
  totalPago: number;

  formaPago: string;

  tipoComprobante?: string;

  rnc?: string;

  nombreEmpresa?: string;

}): Observable<any> {

  return this.http.post(

    `${this.baseUrl}/pagar`,
    dto
  );
}

  entregar(
    idEncargo: number
  ): Observable<any> {

    return this.http.post(
      `${this.baseUrl}/entregar?idEncargo=${idEncargo}`,
      {}
    );
  }

  // =========================
  // 📊 REPORTES
  // =========================

  getTotalHoy(): Observable<number> {

    return this.http.get<number>(
      `${this.baseUrl}/total-hoy`
    );
  }

  getFacturas(
    desde: Date,
    hasta: Date
  ): Observable<FacturaDto[]> {

    return this.http.get<FacturaDto[]>(
      `${this.baseUrl}/facturas?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`
    );
  }

  // =========================
  // 🔥 HELPERS
  // =========================

  getTotal(
    e: BizcochoEncargo
  ): number {

    return e.total || 0;
  }

  getPendiente(
    e: BizcochoEncargo
  ): number {

    return this.getTotal(e)
      - (e.abono || 0);
  }

  estaPagado(
    e: BizcochoEncargo
  ): boolean {

    return this.getPendiente(e) <= 0;
  }

  // =========================
  // 🧠 NORMALIZE
  // =========================

  private normalize(
    e: BizcochoEncargo
  ): BizcochoEncargo {

    return {

      ...e,

      fechaEntrega:
        e.fechaEntrega
          ? new Date(e.fechaEntrega)
          : new Date(),

      horaEntrega:
        e.horaEntrega
          ? new Date(e.horaEntrega)
          : new Date(),

      fechaRegistro:
        e.fechaRegistro
          ? new Date(e.fechaRegistro)
          : new Date(),

      fechaInseccion:
        e.fechaInseccion
          ? new Date(e.fechaInseccion)
          : new Date(),

      facturaDetalles:
        e.facturaDetalles || []
    };
  }
}