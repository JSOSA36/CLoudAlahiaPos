export class Gastos {
  idGasto: number = 0;
  idEmpresa: number = 0;
  idUsuario: number = 0;
  idEmpleado: number | null = null;

  /** Nombre de categoría (se sincroniza al guardar). */
  tipoGasto: string = '';

  idCategoriaGasto: number | null = null;

  tipoComprobante: string = 'Sin comprobante';
  numeroComprobante: string = '';
  fechaComprobante: string | null = null;
  rncEmisorComprobante: string = '';
  nombreEmisorComprobante: string = '';

  monto: number = 0;
  orien: string = '';
  detalle: string = '';
  formaPago: string = 'EFECTIVO';
  idCuentaFinanciera: number | null = null;
  referencia: string = '';
  fechaRegistro: Date = new Date();
  estaAnulado: boolean = false;
}

export interface CategoriaGasto {
  idCategoriaGasto: number;
  idEmpresa: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  orden: number;
  idCuentaContable?: number | null;
  fechaCreacion?: string;
}

export const TIPOS_COMPROBANTE_GASTO = [
  'Sin comprobante',
  'Comprobante para Gastos Menores',
] as const;

export const TIPO_COMPROBANTE_GASTOS_MENORES = 'Comprobante para Gastos Menores';
