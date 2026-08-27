import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface RecetaItemDto {
  idRecetaItem?: number;
  idProducto: number;
  nombreProducto?: string;
  cantidad: number;
  idUnidadMedida?: number | null;
  unidad?: string | null;
  orden?: number;
}

export interface RecetaDto {
  idReceta: number;
  idEmpresa: number;
  idProductoTerminado: number;
  nombreProducto?: string;
  nombre: string;
  rendimientoBase: number;
  idUnidadMedida?: number | null;
  unidad?: string | null;
  activa: boolean;
  observacion?: string | null;
  items: RecetaItemDto[];
}

export interface ExplosionMaterialDto {
  idProducto: number;
  nombreProducto?: string;
  idUnidadMedida?: number | null;
  unidad?: string | null;
  cantidadTeorica: number;
  cantidadReal?: number | null;
  disponible: number;
  faltante: number;
  precioCompra: number;
  costoLinea: number;
  idProveedor?: number | null;
  nombreProveedor?: string | null;
}

export interface ExplosionDto {
  idReceta: number;
  idProductoTerminado: number;
  nombreProducto?: string;
  rendimientoBase: number;
  cantidad: number;
  factor: number;
  idAlmacenOrigen?: number | null;
  hayFaltantes: boolean;
  materiales: ExplosionMaterialDto[];
}

export interface OrdenProduccionDto {
  idOrdenProduccion: number;
  idEmpresa: number;
  numero: string;
  idReceta: number;
  nombreReceta?: string;
  idProductoTerminado: number;
  nombreProducto?: string;
  cantidadPlanificada: number;
  cantidadReal?: number | null;
  idAlmacenOrigen: number;
  nombreAlmacenOrigen?: string;
  idAlmacenDestino: number;
  nombreAlmacenDestino?: string;
  fecha: string;
  idUsuarioResponsable?: number | null;
  observacion?: string | null;
  estado: string;
  idMovimientoSalida?: number | null;
  idMovimientoEntrada?: number | null;
  costoMateriales: number;
  costoUnitario: number;
  fechaInicio?: string | null;
  fechaCompletado?: string | null;
  hayFaltantes: boolean;
  materiales: ExplosionMaterialDto[];
}

export interface GuardarOrdenProduccionRequest {
  idOrdenProduccion: number;
  idEmpresa: number;
  idUsuario: number;
  idReceta: number;
  cantidadPlanificada: number;
  idAlmacenOrigen: number;
  idAlmacenDestino: number;
  fecha?: string | null;
  idUsuarioResponsable?: number | null;
  observacion?: string | null;
}

export interface CompletarOrdenProduccionRequest {
  idEmpresa: number;
  idUsuario: number;
  cantidadReal: number;
  consumos: { idProducto: number; cantidadReal: number }[];
}

export interface RequerimientoCompraResultadoDto {
  idOrdenesCompra: number[];
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ManufacturaService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, config: AppConfigService) {
    this.baseUrl = `${config.apiUrl}/manufactura`;
  }

  recetas(idEmpresa: number, idProducto?: number, soloActivas = false): Observable<RecetaDto[]> {
    let params = new HttpParams().set('soloActivas', String(soloActivas));
    if (idProducto) params = params.set('idProducto', idProducto);
    return this.http.get<RecetaDto[]>(`${this.baseUrl}/recetas/${idEmpresa}`, { params });
  }

  receta(idEmpresa: number, idReceta: number): Observable<RecetaDto> {
    return this.http.get<RecetaDto>(`${this.baseUrl}/recetas/${idEmpresa}/${idReceta}`);
  }

  guardarReceta(body: Partial<RecetaDto> & { idEmpresa: number; idUsuario: number }): Observable<RecetaDto> {
    return this.http.put<RecetaDto>(`${this.baseUrl}/recetas`, body);
  }

  explotar(idEmpresa: number, idReceta: number, cantidad: number, idAlmacenOrigen?: number): Observable<ExplosionDto> {
    let params = new HttpParams().set('cantidad', String(cantidad));
    if (idAlmacenOrigen) params = params.set('idAlmacenOrigen', idAlmacenOrigen);
    return this.http.get<ExplosionDto>(`${this.baseUrl}/recetas/${idEmpresa}/${idReceta}/explotar`, { params });
  }

  ordenes(idEmpresa: number, estado?: string): Observable<OrdenProduccionDto[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<OrdenProduccionDto[]>(`${this.baseUrl}/ordenes/${idEmpresa}`, { params });
  }

  orden(idEmpresa: number, idOrden: number): Observable<OrdenProduccionDto> {
    return this.http.get<OrdenProduccionDto>(`${this.baseUrl}/ordenes/${idEmpresa}/${idOrden}`);
  }

  guardarOrden(body: GuardarOrdenProduccionRequest): Observable<OrdenProduccionDto> {
    return this.http.put<OrdenProduccionDto>(`${this.baseUrl}/ordenes`, body);
  }

  planificar(idEmpresa: number, idOrden: number, idUsuario: number): Observable<OrdenProduccionDto> {
    return this.http.post<OrdenProduccionDto>(
      `${this.baseUrl}/ordenes/${idEmpresa}/${idOrden}/planificar`,
      {},
      { params: { idUsuario } }
    );
  }

  iniciar(idEmpresa: number, idOrden: number, idUsuario: number): Observable<OrdenProduccionDto> {
    return this.http.post<OrdenProduccionDto>(
      `${this.baseUrl}/ordenes/${idEmpresa}/${idOrden}/iniciar`,
      {},
      { params: { idUsuario } }
    );
  }

  completar(idOrden: number, body: CompletarOrdenProduccionRequest): Observable<OrdenProduccionDto> {
    return this.http.post<OrdenProduccionDto>(`${this.baseUrl}/ordenes/${idOrden}/completar`, body);
  }

  cancelar(idEmpresa: number, idOrden: number, idUsuario: number): Observable<OrdenProduccionDto> {
    return this.http.post<OrdenProduccionDto>(
      `${this.baseUrl}/ordenes/${idEmpresa}/${idOrden}/cancelar`,
      {},
      { params: { idUsuario } }
    );
  }

  requerimientoCompra(idEmpresa: number, idOrden: number, idUsuario: number): Observable<RequerimientoCompraResultadoDto> {
    return this.http.post<RequerimientoCompraResultadoDto>(
      `${this.baseUrl}/ordenes/${idEmpresa}/${idOrden}/requerimiento-compra`,
      {},
      { params: { idUsuario } }
    );
  }
}
