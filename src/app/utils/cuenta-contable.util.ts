import { CuentaContable } from '../models/CuentaContable.models';

export interface CuentaContableNodoVista {
  cuenta: CuentaContable;
  nivel: number;
  tieneHijos: boolean;
  expandido: boolean;
  coincideBusqueda: boolean;
}

export type ModoSeleccionCuenta = 'movimiento' | 'agrupacion';

export function normalizarTexto(valor: string): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function cuentaCoincideBusqueda(cuenta: CuentaContable, termino: string): boolean {
  const term = normalizarTexto(termino);
  if (!term) return true;

  return (
    normalizarTexto(cuenta.codigo).includes(term) ||
    normalizarTexto(cuenta.nombre).includes(term)
  );
}

export function construirArbolCuentas(cuentas: CuentaContable[]): CuentaContable[] {
  const mapa = new Map<number, CuentaContable>();

  [...cuentas]
    .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
    .forEach(c => {
      mapa.set(c.idCuentaContable, { ...c, hijos: [] });
    });

  const raices: CuentaContable[] = [];

  mapa.forEach(cuenta => {
    if (cuenta.idCuentaPadre && mapa.has(cuenta.idCuentaPadre)) {
      mapa.get(cuenta.idCuentaPadre)!.hijos!.push(cuenta);
    } else {
      raices.push(cuenta);
    }
  });

  return raices;
}

export function obtenerMapaCuentas(cuentas: CuentaContable[]): Map<number, CuentaContable> {
  return new Map(cuentas.map(c => [c.idCuentaContable, c]));
}

export function obtenerAncestrosIds(
  cuentas: CuentaContable[],
  idCuenta: number
): Set<number> {
  const mapa = obtenerMapaCuentas(cuentas);
  const ids = new Set<number>();
  let actual = mapa.get(idCuenta);

  while (actual?.idCuentaPadre) {
    ids.add(actual.idCuentaPadre);
    actual = mapa.get(actual.idCuentaPadre);
  }

  return ids;
}

export function obtenerIdsVisiblesPorBusqueda(
  cuentas: CuentaContable[],
  termino: string
): Set<number> | null {
  const term = normalizarTexto(termino);
  if (!term) return null;

  const ids = new Set<number>();
  const coincidencias = cuentas.filter(c => cuentaCoincideBusqueda(c, term));

  coincidencias.forEach(c => {
    ids.add(c.idCuentaContable);
    obtenerAncestrosIds(cuentas, c.idCuentaContable).forEach(id => ids.add(id));
  });

  return ids;
}

export function inicializarExpandidos(cuentas: CuentaContable[]): Set<number> {
  const expandidos = new Set<number>();
  const hijosPorPadre = new Map<number, number>();

  cuentas.forEach(c => {
    if (c.idCuentaPadre) {
      hijosPorPadre.set(c.idCuentaPadre, (hijosPorPadre.get(c.idCuentaPadre) || 0) + 1);
    }
  });

  cuentas.forEach(c => {
    if (!c.permiteMovimiento && (hijosPorPadre.get(c.idCuentaContable) || 0) > 0) {
      expandidos.add(c.idCuentaContable);
    }
  });

  return expandidos;
}

export function aplanarArbolVisible(
  nodos: CuentaContable[],
  nivel: number,
  expandidos: Set<number>,
  idsVisibles: Set<number> | null,
  terminoBusqueda: string,
  resultado: CuentaContableNodoVista[] = []
): CuentaContableNodoVista[] {
  nodos.forEach(nodo => {
    if (idsVisibles && !idsVisibles.has(nodo.idCuentaContable)) {
      return;
    }

    const hijos = nodo.hijos || [];
    const tieneHijos = hijos.length > 0;
    const expandido = expandidos.has(nodo.idCuentaContable);

    resultado.push({
      cuenta: nodo,
      nivel,
      tieneHijos,
      expandido,
      coincideBusqueda: cuentaCoincideBusqueda(nodo, terminoBusqueda)
    });

    if (tieneHijos && expandido) {
      aplanarArbolVisible(hijos, nivel + 1, expandidos, idsVisibles, terminoBusqueda, resultado);
    }
  });

  return resultado;
}

export function esCuentaSeleccionable(
  cuenta: CuentaContable,
  modo: ModoSeleccionCuenta
): boolean {
  if (modo === 'movimiento') {
    return cuenta.permiteMovimiento && cuenta.activa;
  }

  return !cuenta.permiteMovimiento && cuenta.activa;
}

export function obtenerEtiquetaCuenta(cuenta?: CuentaContable | null): string {
  if (!cuenta) return '';
  return `${cuenta.codigo} — ${cuenta.nombre}`;
}

export function paddingNodoCuenta(nivel: number, esAgrupacion: boolean): number {
  const base = Math.max(0, nivel - 1) * 18;
  return esAgrupacion ? base + 8 : base + 28;
}
