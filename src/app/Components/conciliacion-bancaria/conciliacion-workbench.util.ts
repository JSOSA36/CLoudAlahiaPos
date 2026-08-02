import {
  ConciliacionLineaBanco,
  ConciliacionSaldos,
  ConciliacionWorkspace
} from 'src/app/models/Tesoreria.models';

/** Estado operativo de la sesión (capa A — no usa brecha de cuenta). */
export type EstadoConciliacionSesion = 'LISTA' | 'CON_PENDIENTES' | 'CON_DIFERENCIAS_PERIODO';

export interface MetricasConciliacionUx {
  brechaBalanceCuenta: number;
  variacionHistorica: number;
  diferenciaPeriodo: number;
  extractoCompletamenteResuelto: boolean;
  hayVariacionHistorica: boolean;
  estadoSesion: EstadoConciliacionSesion;
  etiquetaEstadoSesion: string;
}

/** Predicados canónicos — deben coincidir con TesoreriaConciliacionEstados (API). */
export const ESTADOS_PENDIENTE_BANCO = [
  'PENDIENTE', 'SUGERIDO', 'AMBIGUO', 'DUPLICADO', 'DIFERENCIA'
] as const;

export const ESTADOS_CONCILIADA_BANCO = [
  'CONFIRMADO', 'AUTO_CONCILIADO', 'NUEVO_MOV', 'RESUELTO'
] as const;

export const ESTADOS_EXCLUIDA_BANCO = [
  'IGNORADO', 'DESCARTADO'
] as const;

export function esPendienteBanco(estadoMatch?: string | null): boolean {
  return !!estadoMatch && (ESTADOS_PENDIENTE_BANCO as readonly string[]).includes(estadoMatch);
}

export function esConciliadaBanco(estadoMatch?: string | null): boolean {
  return !!estadoMatch && (ESTADOS_CONCILIADA_BANCO as readonly string[]).includes(estadoMatch);
}

export function esExcluidaBanco(estadoMatch?: string | null): boolean {
  return !!estadoMatch && (ESTADOS_EXCLUIDA_BANCO as readonly string[]).includes(estadoMatch);
}

export function esResueltaBanco(estadoMatch?: string | null): boolean {
  return esConciliadaBanco(estadoMatch) || esExcluidaBanco(estadoMatch);
}

/** Seleccionable para acciones masivas: cualquier pendiente de banco. */
export function esSeleccionableMasivo(estadoMatch?: string | null): boolean {
  return esPendienteBanco(estadoMatch);
}

/** Contadores derivados de las mismas líneas del workspace (misma fuente que los listados). */
export function contarLineasBanco(lineas: ConciliacionLineaBanco[]): {
  total: number;
  pendientes: number;
  conciliadas: number;
  excluidas: number;
  resueltas: number;
} {
  let pendientes = 0;
  let conciliadas = 0;
  let excluidas = 0;
  for (const l of lineas) {
    if (esPendienteBanco(l.estadoMatch)) pendientes++;
    else if (esConciliadaBanco(l.estadoMatch)) conciliadas++;
    else if (esExcluidaBanco(l.estadoMatch)) excluidas++;
  }
  return {
    total: lineas.length,
    pendientes,
    conciliadas,
    excluidas,
    resueltas: conciliadas + excluidas
  };
}

/** Helpers puros del workbench (testeables sin Ionic). */
export function filtrarLineasBanco(
  lineas: ConciliacionLineaBanco[],
  filtro: 'PENDIENTES' | 'TODAS' | 'RESUELTAS'
): ConciliacionLineaBanco[] {
  if (filtro === 'PENDIENTES') {
    return lineas.filter(l => esPendienteBanco(l.estadoMatch));
  }
  if (filtro === 'RESUELTAS') {
    return lineas.filter(l => esResueltaBanco(l.estadoMatch));
  }
  return lineas;
}

export function puedeEditarSesion(ws: ConciliacionWorkspace | null): boolean {
  return !!ws && ws.conciliacion.estado !== 'CERRADA' && ws.conciliacion.estado !== 'ANULADA';
}

function parseFechaDia(valor?: string | null): Date | null {
  if (!valor) return null;
  const soloDia = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
  if (soloDia) {
    const y = Number(soloDia[1]);
    const m = Number(soloDia[2]) - 1;
    const d = Number(soloDia[3]);
    const local = new Date(y, m, d);
    if (Number.isNaN(local.getTime())) return null;
    return local;
  }
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatearDia(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/** Rango visible del período de la sesión. */
export function etiquetaPeriodoConciliacion(desde?: string | null, hasta?: string | null): string {
  const d = parseFechaDia(desde);
  const h = parseFechaDia(hasta);
  if (!d || !h) return 'Período no definido';
  return `${formatearDia(d)} – ${formatearDia(h)}`;
}

/**
 * Etiqueta del extracto: día único, mes completo o rango parcial.
 * Usa periodo del import; si falta, deriva de las líneas del banco.
 */
export function etiquetaExtractoCubierto(
  extracto: { idTesoreriaExtractoImport: number; periodoDesde?: string | null; periodoHasta?: string | null } | null | undefined,
  lineas: Array<{ fechaMovimiento?: string | null }> = []
): string {
  if (!extracto) return 'Sin extracto';

  let d = parseFechaDia(extracto.periodoDesde);
  let h = parseFechaDia(extracto.periodoHasta);

  if (!d || !h) {
    const fechas = lineas
      .map(l => parseFechaDia(l.fechaMovimiento))
      .filter((x): x is Date => !!x)
      .sort((a, b) => a.getTime() - b.getTime());
    if (fechas.length) {
      d = fechas[0];
      h = fechas[fechas.length - 1];
    }
  }

  const id = extracto.idTesoreriaExtractoImport;
  if (!d || !h) return `#${id}`;

  if (d.getTime() === h.getTime()) {
    return `#${id} (${formatearDia(d)})`;
  }

  const ultimoDiaMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const esMesCompleto =
    d.getFullYear() === h.getFullYear()
    && d.getMonth() === h.getMonth()
    && d.getDate() === 1
    && h.getDate() === ultimoDiaMes;

  if (esMesCompleto) {
    return `${MESES_ES[d.getMonth()]} ${d.getFullYear()} (#${id})`;
  }

  return `#${id} (${formatearDia(d)} – ${formatearDia(h)})`;
}

/**
 * Normaliza métricas UX a partir del DTO de saldos (Fase 1) y conteos operativos.
 * No usa la brecha acumulada como “diferencia de fallo”.
 */
export function metricasConciliacionUx(
  saldos: ConciliacionSaldos | null | undefined,
  pendientesBanco: number,
  pendientesLibroPeriodo: number
): MetricasConciliacionUx {
  const tol = Number(saldos?.toleranciaDiferencia) || 0;
  const brecha = Number(
    saldos?.brechaBalanceCuenta ?? saldos?.diferencia ?? 0
  );
  const variacion = Number(saldos?.variacionHistorica ?? 0);
  const extractoOk = saldos?.extractoCompletamenteResuelto
    ?? pendientesBanco === 0;

  let diferenciaPeriodo: number;
  if (saldos?.diferenciaPeriodo != null && !Number.isNaN(Number(saldos.diferenciaPeriodo))) {
    diferenciaPeriodo = Number(saldos.diferenciaPeriodo);
  } else if (extractoOk && pendientesLibroPeriodo === 0) {
    diferenciaPeriodo = 0;
  } else {
    diferenciaPeriodo = brecha + variacion;
  }

  let estadoSesion: EstadoConciliacionSesion = 'LISTA';
  if (pendientesBanco > 0 || pendientesLibroPeriodo > 0) {
    estadoSesion = 'CON_PENDIENTES';
  } else if (Math.abs(diferenciaPeriodo) > tol) {
    estadoSesion = 'CON_DIFERENCIAS_PERIODO';
  }

  const etiquetaEstadoSesion =
    estadoSesion === 'LISTA'
      ? 'Lista'
      : estadoSesion === 'CON_PENDIENTES'
        ? 'Con pendientes'
        : 'Con diferencias del período';

  return {
    brechaBalanceCuenta: brecha,
    variacionHistorica: variacion,
    diferenciaPeriodo,
    extractoCompletamenteResuelto: extractoOk,
    hayVariacionHistorica: Math.abs(variacion) > tol,
    estadoSesion,
    etiquetaEstadoSesion
  };
}

export function mensajeCierreExitoso(metricas: MetricasConciliacionUx): string {
  if (metricas.hayVariacionHistorica) {
    return 'Conciliación del extracto completada. Hay una brecha de saldo de cuenta explicada por historia previa; no indica líneas del extracto sin resolver.';
  }
  return 'Conciliación del extracto completada. Lista para cerrar.';
}

/**
 * Detecta bloqueos legacy que usan la brecha acumulada (Banco−Libros)
 * como si fuera diferencia de conciliación. Esos mensajes NO deben
 * impedir el cierre ni mostrarse como error operativo.
 */
export function esBloqueoBrechaAcumulada(texto: string): boolean {
  const n = (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (!n.includes('excede la tolerancia')) return false;
  if (n.includes('diferencia del periodo')) return false;
  if (n.includes('diferencia de conciliacion')) return false;
  return n.startsWith('la diferencia ');
}

/** Quita bloqueos de brecha histórica; conserva pendientes y diferencia del período. */
export function filtrarBloqueosCierre(
  bloqueos: string[] | null | undefined,
  metricas: MetricasConciliacionUx
): string[] {
  const lista = (bloqueos || []).filter(b => !!b && !!String(b).trim());
  // Si el período está limpio, nunca mostrar bloqueos de brecha acumulada.
  if (metricas.estadoSesion === 'LISTA' || Math.abs(metricas.diferenciaPeriodo) <= 0.0001) {
    return lista.filter(b => !esBloqueoBrechaAcumulada(b));
  }
  return lista.filter(b => !esBloqueoBrechaAcumulada(b));
}

/**
 * Decisión de cierre alineada al contrato: pendientes + diferenciaPeriodo.
 * No usa brechaBalanceCuenta / diferencia acumulada.
 */
export function puedeCerrarPorContrato(
  metricas: MetricasConciliacionUx,
  bloqueosApi: string[] | null | undefined,
  opts: { tieneExtractoOLineas: boolean; hayReclasificacionPendiente?: boolean }
): { puedeCerrar: boolean; bloqueos: string[]; motivo: string } {
  const bloqueos = filtrarBloqueosCierre(bloqueosApi, metricas);

  if (!opts.tieneExtractoOLineas) {
    const msg = 'Adjunte o importe un estado de cuenta bancario.';
    if (!bloqueos.includes(msg)) bloqueos.unshift(msg);
  }

  if (opts.hayReclasificacionPendiente) {
    const msg = 'Hay reclasificaciones de pago pendientes de contabilizar.';
    if (!bloqueos.some(b => b.toLowerCase().includes('reclasific'))) {
      bloqueos.push(msg);
    }
  }

  if (metricas.estadoSesion === 'CON_PENDIENTES') {
    // Los pendientes ya deberían venir en bloqueosApi; si no, sintetizar.
    if (!bloqueos.some(b => b.toLowerCase().includes('pendiente') || b.toLowerCase().includes('sin resolver'))) {
      bloqueos.push('Hay pendientes de banco o de libro del período sin resolver.');
    }
  } else if (metricas.estadoSesion === 'CON_DIFERENCIAS_PERIODO') {
    if (!bloqueos.some(b => {
      const x = b.toLowerCase();
      return x.includes('diferencia del período')
        || x.includes('diferencia del periodo')
        || x.includes('diferencia de conciliación')
        || x.includes('diferencia de conciliacion');
    })) {
      bloqueos.push(
        `La diferencia de conciliación del período ${metricas.diferenciaPeriodo.toFixed(2)} excede la tolerancia.`
      );
    }
  }

  const motivo = bloqueos.join(' ');
  return { puedeCerrar: bloqueos.length === 0, bloqueos, motivo };
}

/** True si el extracto cubre todo el período de la conciliación. */
export function extractoCubrePeriodoCompleto(
  periodoDesde?: string | null,
  periodoHasta?: string | null,
  extractoDesde?: string | null,
  extractoHasta?: string | null,
  lineas: Array<{ fechaMovimiento?: string | null }> = []
): boolean {
  const pDesde = parseFechaDia(periodoDesde);
  const pHasta = parseFechaDia(periodoHasta);
  if (!pDesde || !pHasta) return true;

  let eDesde = parseFechaDia(extractoDesde);
  let eHasta = parseFechaDia(extractoHasta);
  if (!eDesde || !eHasta) {
    const fechas = lineas
      .map(l => parseFechaDia(l.fechaMovimiento))
      .filter((x): x is Date => !!x)
      .sort((a, b) => a.getTime() - b.getTime());
    if (!fechas.length) return true; // sin fechas no alertar
    eDesde = fechas[0];
    eHasta = fechas[fechas.length - 1];
  }

  return eDesde.getTime() <= pDesde.getTime() && eHasta.getTime() >= pHasta.getTime();
}
