export interface DashboardGerencialDto {
  idEmpresa: number;
  periodoDesde: string;
  periodoHasta: string;
  periodoLabel: string;
  /** Etiqueta del día actual, ej. "domingo, 2 de agosto de 2026" */
  periodoHoyLabel?: string;
  /** P&L del día (misma fórmula que el mes) */
  plHoy?: DashboardGerencialPlDto;
  pl: DashboardGerencialPlDto;
  indicadores: DashboardGerencialIndicadoresDto;
  charts: DashboardGerencialChartsDto;
  esConsolidado?: boolean;
  porSucursal?: DashboardGerencialSucursalMontoDto[];
}

export interface DashboardGerencialSucursalMontoDto {
  idSucursal: number;
  nombre: string;
  ventasNetas: number;
  ventasHoy: number;
  valorInventario: number;
  cuentasPorCobrar: number;
  cuentasPorPagar: number;
}

export interface DashboardGerencialPlDto {
  ventasBrutas: number;
  /** Descuentos de cabecera de factura. */
  descuentos?: number;
  /** Total − ITBIS (ya neto de descuento). */
  ventasNetas?: number;
  costoVenta: number;
  utilidadBruta: number;
  gastosOperativos: number;
  comisiones: number;
  perdidasInventario: number;
  otrosIngresos: number;
  otrosEgresos: number;
  utilidadOperativa: number;
  margenBrutoPct: number;
  margenOperativoPct: number;
}

export interface DashboardGerencialIndicadoresDto {
  caja: number;
  bancos: number;
  valorInventario: number;
  valorActivosFijos: number;
  cuentasPorCobrar: number;
  cuentasPorPagar: number;
}

export interface DashboardGerencialChartsDto {
  ventasVsCostosVsUtilidad: SerieNombreMontoDto[];
  evolucionVentasMes: SerieDiariaDto[];
  distribucionGastos: SerieNombreMontoDto[];
  distribucionPerdidas: SerieNombreMontoDto[];
  comisionesPorEmpleado: SerieNombreMontoDto[];
  topProductosRentables: ProductoRentabilidadDto[];
  topProductosPerdidas: SerieNombreMontoDto[];
  flujoEfectivo: SerieNombreMontoDto[];
  estadoResultados: EstadoResultadosPasoDto[];
}

export interface SerieDiariaDto {
  fecha: string;
  monto: number;
}

export interface SerieNombreMontoDto {
  nombre: string;
  monto: number;
}

export interface ProductoRentabilidadDto {
  idProducto: number;
  nombre: string;
  cantidad: number;
  ventasNetas: number;
  costo: number;
  margen: number;
  rentabilidadPct: number;
}

export interface EstadoResultadosPasoDto {
  concepto: string;
  monto: number;
  acumulado: number;
  tipo: 'base' | 'resta' | 'suma' | 'subtotal' | 'total' | string;
}
