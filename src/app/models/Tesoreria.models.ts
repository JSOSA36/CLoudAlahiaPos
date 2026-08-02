export interface MovimientoFinancieroFiltro {
  idEmpresa: number;
  idCuentaFinanciera?: number;
  desde?: string;
  hasta?: string;
  tipoMovimiento?: string;
  categoria?: string;
  estado?: string;
  documentoReferencia?: string;
  referenciaTipo?: string;
  referenciaId?: number;
  estadoConciliacion?: string;
  search?: string;
}

export interface MovimientoFinancieroListado {
  idMovimientoFinanciero: number;
  idEmpresa: number;
  idUsuario: number;
  idCuentaOrigen?: number;
  idCuentaDestino?: number;
  tipoMovimiento: string;
  categoria?: string;
  referenciaId?: number;
  referenciaTipo?: string;
  monto: number;
  motivo?: string;
  observacion?: string;
  fechaMovimiento: string;
  fechaRegistro: string;
  estado: string;
  estadoConciliacion: string;
  idTesoreriaConciliacion?: number;
  fechaConciliacion?: string;
  numeroComprobante?: string;
  claveIdempotencia?: string;
  saldoAcumulado: number;
}

export interface EstadoCuenta {
  idCuentaFinanciera: number;
  nombreCuenta: string;
  saldoInicial: number;
  saldoFinal: number;
  desde?: string;
  hasta?: string;
  movimientos: MovimientoFinancieroListado[];
}

export interface RegistrarAjustePayload {
  idEmpresa: number;
  idUsuario: number;
  idCuentaFinanciera: number;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  monto: number;
  motivo: string;
  observacion?: string;
  claveIdempotencia?: string;
}

export interface AnularMovimientoPayload {
  idMovimientoFinanciero: number;
  idEmpresa: number;
  idUsuario: number;
  motivo: string;
}

export type AccionExtractoPendiente =
  | 'CREAR_GASTO'
  | 'CREAR_INGRESO'
  | 'CREAR_AJUSTE'
  | 'ASOCIAR'
  | 'IGNORAR'
  | 'RECLASIFICAR_PAGO';

export interface TesoreriaConciliacion {
  idTesoreriaConciliacion: number;
  idEmpresa: number;
  idCuentaFinanciera: number;
  periodoDesde: string;
  periodoHasta: string;
  saldoLibrosInicial: number;
  saldoLibrosFinal: number;
  saldoBancoInicial?: number;
  saldoBancoFinal?: number;
  estado: string;
  idUsuario?: number;
  fechaCreacion: string;
  fechaCierre?: string;
  observacion?: string;
  toleranciaDiferencia: number;
  saldoConciliado?: number;
  diferencia?: number;
  idExtractoPrincipal?: number;
}

export interface ConciliacionResumen {
  idTesoreriaConciliacion: number;
  idCuentaFinanciera: number;
  nombreCuenta?: string;
  periodoDesde: string;
  periodoHasta: string;
  saldoLibrosInicial: number;
  saldoLibrosFinal: number;
  saldoBancoFinal?: number;
  saldoConciliado?: number;
  diferencia?: number;
  toleranciaDiferencia: number;
  estado: string;
  fechaCreacion: string;
  fechaCierre?: string;
  movimientosConciliados: number;
  movimientosPendientes: number;
}

export interface CrearConciliacionPayload {
  idEmpresa: number;
  idUsuario: number;
  idCuentaFinanciera: number;
  periodoDesde: string;
  periodoHasta: string;
  saldoBancoFinal: number;
  saldoBancoInicial?: number;
  toleranciaDiferencia?: number;
  observacion?: string;
  idTesoreriaExtractoImport?: number;
}

export interface ConciliacionSaldos {
  saldoLibrosInicial: number;
  saldoLibrosFinal: number;
  saldoBancoInicial?: number;
  saldoBancoFinal?: number;
  montoConciliadoBanco: number;
  montoPendienteBanco: number;
  montoPendienteLibro: number;
  /** Compat: alias de brechaBalanceCuenta (no es “diferencia de conciliación”). */
  diferencia: number;
  /** Cierre extracto − libros acumulados (capa C). */
  brechaBalanceCuenta?: number;
  /** Libros ERP al inicio del marco del extracto. */
  saldoLibrosInicioExtracto?: number;
  /** Saldo inicial del extracto, si existe. */
  saldoBancoInicioExtracto?: number;
  /** Gap atribuible a apertura / movimientos previos (capa B). */
  variacionHistorica?: number;
  /** Diferencia de conciliación del período/extracto (capa A). */
  diferenciaPeriodo?: number;
  toleranciaDiferencia: number;
  /** Sin líneas de banco pendientes. */
  extractoCompletamenteResuelto?: boolean;
}

export interface ConciliacionEstadisticas {
  lineasBancoTotal: number;
  lineasConciliadas: number;
  lineasSugeridas: number;
  lineasPendientes: number;
  lineasAmbiguas: number;
  lineasBancariasPurasPendientes: number;
  lineasOperativasPendientes: number;
  movimientosLibroPendientes: number;
  autoMatches: number;
  matchesManuales: number;
  movimientosCreados: number;
  ignorados: number;
}

export interface ConciliacionLineaBanco {
  idTesoreriaExtractoLinea: number;
  fechaMovimiento: string;
  descripcion?: string;
  referencia?: string;
  debito: number;
  credito: number;
  montoNeto: number;
  balance?: number;
  estadoMatch: string;
  idMovimientoFinanciero?: number;
  scoreSugerido?: number;
  categoriaSugerida?: string;
  accionTomada?: string;
  esAutoConciliado?: boolean;
  accionRecomendada?: AccionExtractoPendiente | string;
  clasificacionLinea?: string;
  moduloOrigenSugerido?: string;
  reglaMatch?: string;
  explicacionMatch?: string;
  instruccionUsuario?: string;
  movimientoSugerido?: MovimientoFinancieroListado;
  esCandidatoReclasificacion?: boolean;
  confianzaReclasificacion?: string;
  evidenciasReclasificacion?: string[];
  idCuentaOrigenSugerida?: number;
  nombreCuentaOrigenSugerida?: string;
  metodoPagoOriginalSugerido?: string;
  metodoPagoEfectivoSugerido?: string;
  idFacturaHeaderSugerida?: number;
  numeroDocumentoSugerido?: string;
  clienteSugerido?: string;
  tratamientoPrevisto?: string;
  cajaOrigenCerrada?: boolean;
  periodoOriginalCerrado?: boolean;
  idPagoReclasificacion?: number;
}

export interface ConciliacionAuditoria {
  idTesoreriaConciliacionAuditoria: number;
  idTesoreriaConciliacion: number;
  idEmpresa: number;
  idUsuario?: number;
  accion: string;
  detalle?: string;
  idTesoreriaExtractoLinea?: number;
  idMovimientoFinanciero?: number;
  fecha: string;
}

export interface ConciliacionWorkspace {
  conciliacion: TesoreriaConciliacion;
  nombreCuenta?: string;
  extracto?: TesoreriaExtractoImport;
  saldos: ConciliacionSaldos;
  estadisticas: ConciliacionEstadisticas;
  puedeCerrar: boolean;
  motivoNoCerrar: string;
  bloqueos: string[];
  lineasBanco: ConciliacionLineaBanco[];
  movimientosLibroPendientes: MovimientoFinancieroListado[];
  auditoriaReciente: ConciliacionAuditoria[];
}

export interface ResolverLineaConciliacionPayload {
  idTesoreriaConciliacion: number;
  idTesoreriaExtractoLinea: number;
  idEmpresa: number;
  idUsuario: number;
  accion: AccionExtractoPendiente;
  idMovimientoFinanciero?: number;
  categoria?: string;
  motivo?: string;
}

export interface DeshacerMatchPayload {
  idTesoreriaConciliacion: number;
  idTesoreriaExtractoLinea: number;
  idEmpresa: number;
  idUsuario: number;
  motivo?: string;
}

export interface BuscarCandidatosPayload {
  idTesoreriaConciliacion: number;
  idTesoreriaExtractoLinea: number;
  idEmpresa: number;
  search?: string;
  desde?: string;
  hasta?: string;
  monto?: number;
  top?: number;
  incluirOtrasCuentas?: boolean;
}

export interface MarcarConciliacionPayload {
  idTesoreriaConciliacion: number;
  idEmpresa: number;
  idUsuario: number;
  idMovimientosFinancieros: number[];
}

export interface RegistrarCargoInteresPayload {
  idTesoreriaConciliacion: number;
  idEmpresa: number;
  idUsuario: number;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  monto: number;
  motivo: string;
  observacion?: string;
}

export interface ReabrirConciliacionPayload {
  idTesoreriaConciliacion: number;
  idEmpresa: number;
  idUsuario: number;
  motivo: string;
}

export interface ImportarExtractoPayload {
  idEmpresa: number;
  idCuentaFinanciera: number;
  idUsuario: number;
  nombreArchivo: string;
  contenidoCsv: string;
}

export interface TesoreriaExtractoImport {
  idTesoreriaExtractoImport: number;
  idEmpresa: number;
  idCuentaFinanciera: number;
  nombreArchivo: string;
  formato: string;
  periodoDesde?: string;
  periodoHasta?: string;
  idUsuario?: number;
  estado: string;
  fechaCarga: string;
  observacion?: string;
  banco?: string;
  numeroCuentaBanco?: string;
  moneda?: string;
  saldoInicial?: number;
  saldoFinal?: number;
  totalDebitos?: number;
  totalCreditos?: number;
  idTesoreriaConciliacion?: number;
}

/**
 * Contrato de vista previa de extracto (wizard de importación).
 * Si el backend final difiere, ajustar aquí y en TesoreriaExtractoService.
 */
export interface ExtractoPreviewLinea {
  idTesoreriaExtractoLinea?: number;
  numeroLinea?: number;
  fechaMovimiento: string;
  descripcion?: string;
  referencia?: string;
  debito: number;
  credito: number;
  balance?: number | null;
}

export interface ExtractoPreview {
  idTesoreriaExtractoImport: number;
  idEmpresa: number;
  idCuentaFinanciera: number;
  nombreArchivo: string;
  formato: string;
  estado: string;
  /** Adapter/parser que interpretó el archivo (informativo). Alias FE de adapterUsado. */
  adapter?: string;
  adapterUsado?: string;
  /** Advertencias no bloqueantes detectadas al analizar. */
  warnings?: string[];
  banco?: string;
  numeroCuentaBanco?: string;
  moneda?: string;
  periodoDesde?: string;
  periodoHasta?: string;
  saldoInicial?: number | null;
  saldoFinal?: number | null;
  totalDebitos?: number;
  totalCreditos?: number;
  cantidadLineas?: number;
  observacion?: string;
  lineas: ExtractoPreviewLinea[];
}

export interface ActualizarExtractoPreviewPayload {
  idEmpresa: number;
  idUsuario: number;
  banco?: string;
  numeroCuentaBanco?: string;
  moneda?: string;
  periodoDesde?: string;
  periodoHasta?: string;
  saldoInicial?: number | null;
  saldoFinal?: number | null;
  observacion?: string;
  /** Reemplazo completo de líneas (contrato backend ActualizarLineasPreviewDto.reemplazarTodas). */
  reemplazarTodas: Array<{
    fechaMovimiento: string;
    descripcion?: string;
    referencia?: string;
    debito: number;
    credito: number;
    balance?: number | null;
  }>;
}

export interface ExtractoLineaMatch {
  idTesoreriaExtractoLinea: number;
  fechaMovimiento: string;
  descripcion?: string;
  referencia?: string;
  debito: number;
  credito: number;
  montoNeto: number;
  balance?: number;
  estadoMatch: string;
  idMovimientoFinanciero?: number;
  scoreSugerido?: number;
  movimientoSugerido?: MovimientoFinancieroListado;
  categoriaSugerida?: string;
  accionTomada?: string;
  esAutoConciliado?: boolean;
  accionRecomendada?: AccionExtractoPendiente | string;
}

export interface ResolverExtractoLineaPayload {
  idTesoreriaExtractoLinea: number;
  idEmpresa: number;
  idUsuario: number;
  accion: AccionExtractoPendiente;
  idMovimientoFinanciero?: number;
  categoria?: string;
  motivo?: string;
}

export interface ResolverExtractoLineaResultado {
  idTesoreriaExtractoLinea: number;
  accion: AccionExtractoPendiente;
  idMovimientoFinanciero?: number;
  categoria?: string;
  entidadCreada: string;
  yaResuelta: boolean;
}

export interface ExtractoResumen {
  idTesoreriaExtractoImport: number;
  saldoInicialEstado: number;
  saldoFinalEstado: number;
  totalDebitos: number;
  totalCreditos: number;
  cantidadConciliada: number;
  montoConciliado: number;
  cantidadPendiente: number;
  montoPendiente: number;
  gastos: number;
  ingresos: number;
  ajustes: number;
  ignorados: number;
  saldoLibrosFinalConciliado: number;
  diferencia: number;
  puedeCerrar: boolean;
}

export interface ConfirmarExtractoMatchPayload {
  idTesoreriaExtractoLinea: number;
  idEmpresa: number;
  idUsuario: number;
  idMovimientoFinanciero?: number;
}

export interface CrearMovimientoDesdeExtractoPayload {
  idTesoreriaExtractoLinea: number;
  idEmpresa: number;
  idUsuario: number;
  motivo?: string;
}
