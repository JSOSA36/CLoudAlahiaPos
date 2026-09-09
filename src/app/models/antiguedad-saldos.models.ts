export interface AntiguedadSaldosLinea {
  idDocumento: number;
  documento: string;
  idTercero: number;
  terceroNombre: string;
  fechaDocumento: string;
  fechaVencimiento?: string | null;
  diasVencidos: number;
  saldoPendiente: number;
  rango0a30: number;
  rango31a60: number;
  rango61a90: number;
  rangoMas90: number;
  rangoCodigo: string;
  rangoEtiqueta: string;
  estado: string;
}

export interface AntiguedadSaldosTotales {
  totalPendiente: number;
  total0a30: number;
  total31a60: number;
  total61a90: number;
  totalMas90: number;
  cantidadDocumentos: number;
  cantidadTerceros: number;
}

export interface AntiguedadSaldosIndicadores {
  totalTerceros: number;
  promedioPorTercero: number;
  saldoPromedioDocumento: number;
  mayorDeuda: number;
  terceroMayorDeuda?: string | null;
  idTerceroMayorDeuda?: number | null;
  promedioDiasVencidos: number;
}

export interface AntiguedadSaldosTopTercero {
  idTercero: number;
  nombre: string;
  saldo: number;
  cantidadDocumentos: number;
  maxDiasVencidos: number;
}

export interface AntiguedadSaldosRango {
  codigo: string;
  etiqueta: string;
  monto: number;
  cantidad: number;
  porcentaje: number;
}

export interface AntiguedadSaldosReporte {
  idEmpresa: number;
  nombreEmpresa?: string;
  fechaCorte: string;
  tipo: 'CXC' | 'CXP' | string;
  lineas: AntiguedadSaldosLinea[];
  totales: AntiguedadSaldosTotales;
  indicadores?: AntiguedadSaldosIndicadores;
  distribucion: AntiguedadSaldosRango[];
  topTerceros?: AntiguedadSaldosTopTercero[];
}

export interface AntiguedadSaldosFiltro {
  idTercero?: number;
  documento?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  soloVencidas?: boolean;
  soloPendientes?: boolean;
  fechaCorte?: string;
  idSucursalFiltro?: number;
}

export type AntiguedadModo = 'cxc' | 'cxp';
