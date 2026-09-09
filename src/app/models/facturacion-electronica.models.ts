export interface SecuenciaEcfDisponible {
  tipoEcfDgii: number;
  descripcion: string;
  serie: string;
  restantes: number;
  stockMinimo: number;
  agotada: boolean;
  vencida: boolean;
  fechaVencimiento: string | null;
}

export interface SecuenciaEcfAsignacionDto {
  idAsignacion: number;
  idSecuencia: number;
  idSucursal: number;
  nombreSucursal?: string | null;
  secuenciaInicial: number;
  secuenciaActual: number;
  proximaSecuencia?: number;
  secuenciaFinal: number;
  activo: boolean;
}

export interface SecuenciaEcfAsignarDto {
  idSucursal: number;
  secuenciaInicial: number;
  secuenciaFinal: number;
  proximaSecuencia?: number;
}

export interface SecuenciaEcfDto {
  idSecuencia: number;
  idEmpresa: number;
  tipoEcfDgii: number;
  tipoNCF: string;
  descripcion: string;
  serie: string;
  secuenciaInicial: number;
  secuenciaActual: number;
  proximaSecuencia?: number;
  secuenciaFinal: number;
  fechaVencimiento: string | null;
  stockMinimo: number;
  activo: boolean;
  ambiente: string;
  fechaCreacion: string;
  idSucursal?: number | null;
  nombreSucursal?: string | null;
  asignaciones?: SecuenciaEcfAsignacionDto[];
  numerosSinAsignar?: number;
  siguienteHuecoInicial?: number | null;
  siguienteHuecoFinal?: number | null;
}

export interface SecuenciaEcfCreateDto {
  idEmpresa: number;
  tipoEcfDgii: number;
  descripcion?: string;
  serie: string;
  secuenciaInicial: number;
  proximaSecuencia?: number;
  secuenciaActual?: number;
  secuenciaFinal: number;
  fechaVencimiento?: string;
  stockMinimo?: number;
  ambiente?: string;
  numeroResolucion?: string;
}

export interface SecuenciaEcfUpdateDto {
  secuenciaInicial?: number;
  proximaSecuencia?: number;
  secuenciaActual?: number;
  secuenciaFinal?: number;
  fechaVencimiento?: string;
  stockMinimo?: number;
  activo?: boolean;
}

export interface EmisionEcfRequest {
  idEmpresa: number;
  tipoEcfDgii: number;
  origenDocumento: number;
  idOrigen: number;
  idUsuario: number;
  idSucursal?: number | null;
}

export interface EmisionEcfResultado {
  exitoso: boolean;
  encf: string | null;
  idEcf: number | null;
  mensajeError: string | null;
  secuenciasRestantes: number;
}

export interface EmisionEcfResultadoCompleto extends EmisionEcfResultado {
  trackId: string | null;
  estadoDgii: string | null;
  urlQR: string | null;
  securityCode: string | null;
  mensajesDgii: string[];
  rncEmisor: string | null;
  razonSocialEmisor: string | null;
}

export interface TipoComprobanteOption {
  value: number | null;
  label: string;
  disabled: boolean;
  alertaBaja: boolean;
  restantes: number;
}
