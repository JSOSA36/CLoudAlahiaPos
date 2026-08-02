export interface BalanceComprobacionLinea {
  idCuentaContable: number;
  codigoCuenta: string;
  nombreCuenta: string;
  tipoCuenta: string;
  saldoInicial: number;
  totalDebito: number;
  totalCredito: number;
  saldoFinal: number;
  saldoDeudor?: number;
  saldoAcreedor?: number;
}

export interface BalanceComprobacionResumen {
  desde: string;
  hasta: string;
  lineas: BalanceComprobacionLinea[];
  totalDebitos: number;
  totalCreditos: number;
  totalSaldoDeudor?: number;
  totalSaldoAcreedor?: number;
  cuadra?: boolean;
}

export interface EstadoResultadosLinea {
  codigoCuenta: string;
  nombreCuenta: string;
  monto: number;
}

export interface EstadoResultadosSeccion {
  titulo: string;
  lineas: EstadoResultadosLinea[];
  total: number;
}

export interface EstadoResultados {
  desde: string;
  hasta: string;
  ingresos: EstadoResultadosSeccion;
  costos: EstadoResultadosSeccion;
  utilidadBruta: number;
  gastos: EstadoResultadosSeccion;
  utilidadNeta: number;
}

export interface BalanceGeneralLinea {
  codigoCuenta: string;
  nombreCuenta: string;
  saldo: number;
}

export interface BalanceGeneralSeccion {
  titulo: string;
  lineas: BalanceGeneralLinea[];
  total: number;
}

export interface BalanceGeneral {
  fechaCorte: string;
  activos: BalanceGeneralSeccion;
  pasivos: BalanceGeneralSeccion;
  capital: BalanceGeneralSeccion;
  totalActivos: number;
  totalPasivos: number;
  totalCapital: number;
  totalPasivoCapital: number;
  resultadoEjercicio: number;
  diferencia: number;
  cuadra: boolean;
}

export interface PeriodoContable {
  idPeriodoContable?: number;
  idEmpresa: number;
  anio: number;
  mes: number;
  estado: string;
  fechaCierre?: string;
  observacion?: string;
  nombreMes: string;
  bloqueoActivo: boolean;
  mensaje: string;
}

export interface CerrarPeriodoRequest {
  idEmpresa: number;
  anio: number;
  mes: number;
  idUsuario: number;
  observacion?: string;
}
