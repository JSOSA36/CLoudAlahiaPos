export interface AsientoContableDetalle {
  idAsientoContableDetalle?: number;
  idAsientoContable?: number;
  idCuentaContable: number;
  debito: number;
  credito: number;
  referencia?: string;
  codigoCuenta?: string;
  nombreCuenta?: string;
}

export interface AsientoContable {
  idAsientoContable?: number;
  idEmpresa: number;
  numero?: string;
  fecha: string;
  concepto: string;
  estado: string;
  idUsuario?: number;
  origenModulo?: string;
  origenReferenciaId?: number;
  esAutomatico?: boolean;
  detalles: AsientoContableDetalle[];
}

export interface LibroDiarioLinea {
  idAsientoContable: number;
  numero: string;
  fecha: string;
  concepto: string;
  estado: string;
  codigoCuenta: string;
  nombreCuenta: string;
  debito: number;
  credito: number;
  referencia?: string;
  origenModulo: string;
  origenReferenciaId?: number | null;
  tipoOperacion?: string;
  esAutomatico?: boolean;
}

/** Asiento agrupado para presentación tipo ERP del Libro Diario. */
export interface LibroDiarioAsientoGrupo {
  idAsientoContable: number;
  numero: string;
  fecha: string;
  concepto: string;
  estado: string;
  origenModulo: string;
  origenLabel: string;
  origenReferenciaId?: number | null;
  tipoOperacion?: string;
  esAutomatico?: boolean;
  lineas: LibroDiarioLinea[];
  totalDebito: number;
  totalCredito: number;
  cuadrado: boolean;
  puedeAbrirOrigen: boolean;
}

export interface MayorGeneralLinea {
  fecha: string;
  numeroAsiento: string;
  concepto: string;
  referencia?: string;
  debito: number;
  credito: number;
  saldo: number;
}

export interface MayorGeneralResumen {
  idCuentaContable: number;
  codigoCuenta: string;
  nombreCuenta: string;
  tipoCuenta: string;
  totalDebito: number;
  totalCredito: number;
  saldo: number;
  movimientos: MayorGeneralLinea[];
}
