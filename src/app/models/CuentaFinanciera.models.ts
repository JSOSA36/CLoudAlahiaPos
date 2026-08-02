export interface CuentaFinanciera {
  idCuentaFinanciera: number;
  idEmpresa: number;
  nombre: string;
  tipoCuenta: string; // CAJA | BANCO | TARJETA
  banco?: string;
  numeroCuenta?: string;
  balanceInicial: number;
  saldoDisponible?: number;
  activa: boolean;
  color?: string;
  icono?: string;
  fechaCreacion?: Date | string;
  codigo?: string;
  idTesoreriaSubtipoCuenta?: number | null;
  moneda?: string;
  idCuentaContable?: number | null;
  esPrincipal?: boolean;
  permiteSaldoNegativo?: boolean;
  descripcion?: string;
  fechaSaldoInicial?: string | Date | null;
  permiteMovimientosManuales?: boolean;
  fechaUltimaConciliacion?: string | Date | null;
  ultimoSaldoConciliado?: number | null;
}

export interface TesoreriaSaldoResumen {
  idCuentaFinanciera: number;
  idEmpresa: number;
  nombre: string;
  codigo?: string;
  tipoCuenta: string;
  subtipoCodigo?: string;
  subtipoNombre?: string;
  moneda?: string;
  balanceInicial: number;
  saldoDisponible: number;
  saldoCalculado: number;
  diferenciaSaldo: number;
  activa: boolean;
  esPrincipal: boolean;
  idCuentaContable?: number | null;
}
