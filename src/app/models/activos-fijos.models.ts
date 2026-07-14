export type EstadoActivoFijo =
  | 'PENDIENTE_DATOS'
  | 'ACTIVO'
  | 'BAJA'
  | 'EN_MANTENIMIENTO';

export interface ActivoFijo {
  idActivoFijo: number;
  idEmpresa: number;
  idProducto?: number | null;
  nombreProducto?: string | null;
  idOrdenCompraHeader?: number | null;
  numeroDocumentoCompra?: string | null;
  idOrdenCompraDetalle?: number | null;
  codigoActivo: string;
  descripcion: string;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  fechaAdquisicion: string;
  fechaRecepcion?: string | null;
  valorAdquisicion: number;
  valorResidual: number;
  vidaUtilMeses?: number | null;
  estado: string;
  idCuentaContable?: number | null;
  idAlmacenRecepcion?: number | null;
  nombreAlmacenRecepcion?: string | null;
  ubicacion?: string | null;
  responsable?: string | null;
  observacion?: string | null;
  fechaCreacion: string;
  activo: boolean;
}

export interface ActualizarActivoFijoRequest {
  idEmpresa: number;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  valorResidual?: number | null;
  vidaUtilMeses?: number | null;
  estado?: string;
  ubicacion?: string;
  responsable?: string;
  observacion?: string;
  idCuentaContable?: number | null;
}

export interface ResumenActivosFijos {
  idEmpresa: number;
  cantidadActivos: number;
  cantidadPendienteDatos: number;
  cantidadDadosDeBaja: number;
  valorActivosFijos: number;
  valorActivosOperativos: number;
}

export const ESTADOS_ACTIVO_FIJO: { codigo: EstadoActivoFijo; etiqueta: string }[] = [
  { codigo: 'PENDIENTE_DATOS', etiqueta: 'Pendiente datos' },
  { codigo: 'ACTIVO', etiqueta: 'Activo' },
  { codigo: 'EN_MANTENIMIENTO', etiqueta: 'En mantenimiento' },
  { codigo: 'BAJA', etiqueta: 'Dado de baja' },
];

export function etiquetaEstadoActivo(estado?: string | null): string {
  const e = (estado || '').toUpperCase();
  return ESTADOS_ACTIVO_FIJO.find(x => x.codigo === e)?.etiqueta || estado || '—';
}
