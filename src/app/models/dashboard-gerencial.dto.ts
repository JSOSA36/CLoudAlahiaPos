export interface DashboardGerencialDto {
  idEmpresa: number;
  periodoDesde: string;
  periodoHasta: string;
  periodoLabel: string;
  pl: DashboardGerencialPlDto;
  indicadores: DashboardGerencialIndicadoresDto;
  charts: DashboardGerencialChartsDto;
}

export interface DashboardGerencialPlDto {
  ventasBrutas: number;
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
