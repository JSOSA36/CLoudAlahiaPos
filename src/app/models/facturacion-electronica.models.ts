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

export interface SecuenciaEcfDto {
  idSecuencia: number;
  idEmpresa: number;
  tipoEcfDgii: number;
  tipoNCF: string;
  descripcion: string;
  serie: string;
  secuenciaInicial: number;
  secuenciaActual: number;
  secuenciaFinal: number;
  fechaVencimiento: string | null;
  stockMinimo: number;
  activo: boolean;
  ambiente: string;
  fechaCreacion: string;
}

export interface SecuenciaEcfCreateDto {
  idEmpresa: number;
  tipoEcfDgii: number;
  descripcion?: string;
  serie: string;
  secuenciaInicial?: number;
  secuenciaFinal: number;
  fechaVencimiento?: string;
  stockMinimo?: number;
  ambiente?: string;
  numeroResolucion?: string;
}

export interface SecuenciaEcfUpdateDto {
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
