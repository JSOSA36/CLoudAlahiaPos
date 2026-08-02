import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CotizadorCatalogo {
  tiposNegocio: TipoNegocio[];
  categorias: { codigo: string; nombre: string; orden: number }[];
  modulos: ModuloComercial[];
  dependencias: { codigoModulo: string; codigoRequerido: string; tipo: string; mensaje?: string }[];
  parametros: Record<string, string>;
  tramosDocumentos: { desdeDocs: number; hastaDocs?: number; cargoUSD: number; etiqueta?: string }[];
}

export interface TipoNegocio {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  modulosPreseleccionados: string[];
}

export interface ModuloComercial {
  moduloId: number;
  codigo: string;
  nombre: string;
  descripcionComercial?: string;
  categoriaComercial: string;
  nivel: string;
  participaPrecio: boolean;
  precioBaseUSD: number;
  orden: number;
  icono?: string;
  tiposNegocio: string[];
}

export interface CotizadorCalcularRequest {
  tipoNegocioCodigo?: string;
  codigosModulos: string[];
  usuarios: number;
  sucursales: number;
  usaFacturacionElectronica: boolean;
  documentosElectronicosMensuales: number;
}

export interface CotizadorPropuesta {
  tipoNegocioCodigo?: string;
  modulosSeleccionados: string[];
  modulosIncluidos: string[];
  recomendaciones: {
    codigo: string;
    nombre: string;
    tipo: string;
    mensaje: string;
    origenCodigo: string;
  }[];
  desglose: { concepto: string; tipoLinea: string; codigoModulo?: string; montoUSD: number }[];
  subtotalUSD: number;
  ajustePisoUSD: number;
  precioMensualUSD: number;
  moneda: string;
  aplicoPisoMinimo: boolean;
  pisoMensualUSD: number;
  usuariosIncluidos: number;
  usuarios: number;
  sucursales: number;
  usaFacturacionElectronica: boolean;
  documentosElectronicosMensuales: number;
  explicaciones: string[];
  resumen: string;
}

@Injectable({ providedIn: 'root' })
export class CotizadorService {
  private readonly base = `${environment.apiUrl}/Cotizador`;

  constructor(private http: HttpClient) {}

  catalogo(): Observable<CotizadorCatalogo> {
    return this.http.get<CotizadorCatalogo>(`${this.base}/catalogo`);
  }

  calcular(body: CotizadorCalcularRequest): Observable<CotizadorPropuesta> {
    return this.http.post<CotizadorPropuesta>(`${this.base}/calcular`, body);
  }

  guardar(seleccion: CotizadorCalcularRequest, propuesta?: CotizadorPropuesta) {
    return this.http.post<{ folio: string; cotizacionId: number; propuesta: CotizadorPropuesta }>(
      `${this.base}/guardar`,
      { seleccion, propuesta }
    );
  }

  enviarCorreo(folio: string, correo: string, nombre?: string) {
    return this.http.post(`${this.base}/enviar-correo`, { folio, correo, nombre });
  }

  solicitar(payload: {
    folio?: string;
    tipo: string;
    nombre?: string;
    correo?: string;
    telefono?: string;
    mensaje?: string;
    seleccion?: CotizadorCalcularRequest;
  }) {
    return this.http.post(`${this.base}/solicitar`, payload);
  }

  vistaPublica(folio: string): Observable<CotizadorVistaPublica> {
    return this.http.get<CotizadorVistaPublica>(
      `${this.base}/publica/${encodeURIComponent(folio)}`
    );
  }

  /** Link absoluto para abrir la cotización sin login. */
  buildLinkPublico(folio: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/cotizador/ver/${encodeURIComponent(folio)}`;
  }
}

export interface CotizadorVistaPublica {
  folio: string;
  fechaCreacion: string;
  tipoNegocioCodigo?: string;
  usuarios: number;
  sucursales: number;
  usaFacturacionElectronica: boolean;
  documentosElectronicosMensuales: number;
  precioMensualUSD: number;
  moneda: string;
  resumen: string;
  desglose: { concepto: string; tipoLinea: string; codigoModulo?: string; montoUSD: number }[];
  explicaciones: string[];
  aviso: string;
}
