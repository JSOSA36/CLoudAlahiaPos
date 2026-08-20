export type ProduccionSemaforo = 'OK' | 'ADVERTENCIA' | 'RETRASADO' | 'COMPLETADO' | 'EN_COLA';

export type ProduccionSlaModo = 'CREACION' | 'INICIO_PREPARACION';

export interface ProduccionTrabajoItem {
  idTrabajoItem: number;
  origenDetalleId?: number | null;
  idEstacion?: number | null;
  codigoItem?: string | null;
  nombreItem: string;
  cantidad: number;
  observacion?: string | null;
  variacionesTexto?: string | null;
  codigoEstado: string;
  orden: number;
  rowVersion: string;
}

export interface ProduccionTrabajo {
  idTrabajo: number;
  idEmpresa: number;
  tipoTrabajoCodigo: string;
  idFlujo: number;
  codigoEstadoActual: string;
  nombreEstadoActual?: string | null;
  origenModulo: string;
  origenTipo: string;
  origenId: number;
  numeroVisible: string;
  nombreVisible: string;
  referencia?: string | null;
  etiquetaContexto?: string | null;
  observacion?: string | null;
  idUsuarioSolicita?: number | null;
  prioridad: string;
  slaObjetivoSegundosSnapshot: number;
  slaAdvertenciaSegundosSnapshot: number;
  slaModoInicioSnapshot?: ProduccionSlaModo | string;
  fechaCreacion: string;
  fechaLimiteObjetivo?: string | null;
  fechaInicio?: string | null;
  fechaCompletado?: string | null;
  fechaCancelacion?: string | null;
  motivoCancelacion?: string | null;
  activoEnTablero: boolean;
  plantillaCodigo?: string | null;
  semaforoSla: ProduccionSemaforo | string;
  segundosTranscurridos: number;
  segundosEnCola?: number;
  segundosPreparacion?: number;
  segundosTotal?: number;
  rowVersion: string;
  items: ProduccionTrabajoItem[];
}

export interface ProduccionFlujoEstado {
  codigo: string;
  nombreVisible: string;
  orden: number;
  esInicial: boolean;
  esTerminal: boolean;
  cuentaParaCompletar: boolean;
  colorHint?: string | null;
}

export interface ProduccionFlujo {
  idFlujo: number;
  tipoTrabajoCodigo: string;
  nombre: string;
  version: number;
  slaObjetivoSegundos: number;
  slaAdvertenciaSegundos: number;
  slaModoInicio?: ProduccionSlaModo | string;
  estados: ProduccionFlujoEstado[];
}

export interface ProduccionConfiguracion {
  idEmpresa: number;
  activo: boolean;
  usarEstaciones: boolean;
  usarEstadosPorItem: boolean;
  sonidoActivo: boolean;
  tiempoAdvertenciaSegDefault: number;
  tiempoCriticoSegDefault: number;
  permitirCompletarDesdeEstacion: boolean;
  idEstacionPredeterminada?: number | null;
  modoOscuroDefault: boolean;
  mostrarNombreCliente: boolean;
  mostrarUsuarioSolicita: boolean;
}

export interface ProduccionDashboardResumen {
  pendientes: number;
  enEjecucion: number;
  completadosHoy: number;
  retrasados: number;
  tiempoPromedioSegundosHoy?: number | null;
}

export interface ProduccionEstadoOrigen {
  origenId: number;
  idTrabajo: number;
  codigoEstado: string;
  nombreEstado?: string | null;
  activoEnTablero: boolean;
}

export interface ProduccionHistorial {
  idHistorial: number;
  idTrabajo: number;
  idTrabajoItem?: number | null;
  codigoEstadoAnterior?: string | null;
  codigoEstadoNuevo: string;
  idUsuario?: number | null;
  fecha: string;
  motivo?: string | null;
  origen: string;
}

export interface ProduccionTransicionRequest {
  codigoEstadoEsperado: string;
  codigoEstadoNuevo: string;
  rowVersion: string;
  motivo?: string | null;
  idUsuario: number;
}

export interface ProduccionCancelarRequest {
  codigoEstadoEsperado: string;
  rowVersion: string;
  motivo: string;
  idUsuario: number;
}

export interface ProduccionPrioridadRequest {
  prioridad: string;
  rowVersion: string;
  codigoEstadoEsperado: string;
  idUsuario: number;
}

export const PRODUCCION_TIPO_POS_ORDEN = 'POS_ORDEN';
export const PRODUCCION_PRIORIDADES = ['Normal', 'Alta', 'Urgente'] as const;
export const PRODUCCION_SLA_MODO_CREACION = 'CREACION';
export const PRODUCCION_SLA_MODO_INICIO = 'INICIO_PREPARACION';

export function metricasTiempoCliente(t: ProduccionTrabajo, ahoraMs = Date.now()) {
  const creacion = new Date(t.fechaCreacion).getTime();
  const inicio = t.fechaInicio ? new Date(t.fechaInicio).getTime() : null;
  const fin = t.fechaCompletado ? new Date(t.fechaCompletado).getTime() : ahoraMs;

  const segundosEnCola = Math.max(0, Math.floor(((inicio ?? ahoraMs) - creacion) / 1000));
  const segundosPreparacion = inicio == null
    ? 0
    : Math.max(0, Math.floor((fin - inicio) / 1000));
  const segundosTotal = Math.max(0, Math.floor((fin - creacion) / 1000));

  const modo = (t.slaModoInicioSnapshot || PRODUCCION_SLA_MODO_CREACION).toUpperCase();
  let segundosSla = 0;
  if (modo === PRODUCCION_SLA_MODO_INICIO) {
    if (inicio != null) segundosSla = Math.max(0, Math.floor((fin - inicio) / 1000));
  } else {
    segundosSla = segundosTotal;
  }

  return { segundosEnCola, segundosPreparacion, segundosTotal, segundosSla };
}

export function calcularSemaforoCliente(t: ProduccionTrabajo, ahoraMs = Date.now()): ProduccionSemaforo {
  if (!t.activoEnTablero
    || t.codigoEstadoActual === 'CANCELADA'
    || t.codigoEstadoActual === 'ENTREGADA') {
    return 'COMPLETADO';
  }

  const modo = (t.slaModoInicioSnapshot || PRODUCCION_SLA_MODO_CREACION).toUpperCase();
  let inicioMs: number | null = null;
  if (modo === PRODUCCION_SLA_MODO_INICIO) {
    if (!t.fechaInicio) return 'EN_COLA';
    inicioMs = new Date(t.fechaInicio).getTime();
  } else {
    inicioMs = new Date(t.fechaCreacion).getTime();
  }

  const limiteMs = t.fechaLimiteObjetivo
    ? new Date(t.fechaLimiteObjetivo).getTime()
    : inicioMs + (t.slaObjetivoSegundosSnapshot || 0) * 1000;
  const advertenciaMs = inicioMs + (t.slaAdvertenciaSegundosSnapshot || 0) * 1000;

  if (ahoraMs >= limiteMs) return 'RETRASADO';
  if (ahoraMs >= advertenciaMs) return 'ADVERTENCIA';
  return 'OK';
}

export function formatearDuracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function siguienteEstadoFlujo(
  flujo: ProduccionFlujo | null | undefined,
  codigoActual: string
): ProduccionFlujoEstado | null {
  if (!flujo?.estados?.length) return null;
  const linea = [...flujo.estados]
    .filter(e => e.codigo !== 'CANCELADA')
    .sort((a, b) => a.orden - b.orden);
  const idx = linea.findIndex(e => e.codigo === codigoActual);
  if (idx < 0 || idx >= linea.length - 1) return null;
  return linea[idx + 1];
}

export function columnasTablero(flujo: ProduccionFlujo | null | undefined): ProduccionFlujoEstado[] {
  if (!flujo?.estados?.length) return [];
  return [...flujo.estados]
    .filter(e => !e.esTerminal)
    .sort((a, b) => a.orden - b.orden)
    .map(e => ({
      ...e,
      nombreVisible: etiquetaEstadoFlujo(e.codigo, e.nombreVisible)
    }));
}

export const PRODUCCION_ETIQUETAS_ESTADO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparación',
  LISTA: 'Lista',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada'
};

export function etiquetaEstadoFlujo(codigo: string, fallback?: string | null): string {
  return PRODUCCION_ETIQUETAS_ESTADO[codigo] || fallback || codigo;
}

export function claseSemaforo(s: string): string {
  switch (s) {
    case 'RETRASADO': return 'cp-sem-retrasado';
    case 'ADVERTENCIA': return 'cp-sem-advertencia';
    case 'EN_COLA': return 'cp-sem-cola';
    case 'COMPLETADO': return 'cp-sem-completado';
    default: return 'cp-sem-ok';
  }
}

export function etiquetaSemaforo(s: string): string {
  switch (s) {
    case 'RETRASADO': return 'Retrasado';
    case 'ADVERTENCIA': return 'Advertencia';
    case 'EN_COLA': return 'En cola';
    case 'COMPLETADO': return 'Completado';
    default: return 'A tiempo';
  }
}
