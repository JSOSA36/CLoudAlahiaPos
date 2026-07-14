/**
 * Desglose de costo/precio cuando el producto tiene marcado
 * "Precio / costo incluye ITBIS" (Productos.Itbis = true).
 */

export const TASA_ITBIS_RD = 0.18;

export interface DesgloseItbis {
  /** Precio/costo sin ITBIS (unitario). */
  neto: number;
  /** ITBIS unitario. */
  itbisUnitario: number;
  /** Bruto unitario (neto + itbis). */
  bruto: number;
  tasa: number;
}

/** Si el monto ya incluye ITBIS: bruto → neto + ITBIS. */
export function desglosarMontoConItbis(
  bruto: number,
  tasa: number = TASA_ITBIS_RD
): DesgloseItbis {
  const b = Math.max(0, Number(bruto) || 0);
  const t = tasa > 0 ? tasa : TASA_ITBIS_RD;
  if (b <= 0) {
    return { neto: 0, itbisUnitario: 0, bruto: 0, tasa: t };
  }
  const neto = +(b / (1 + t)).toFixed(2);
  const itbisUnitario = +(b - neto).toFixed(2);
  return { neto, itbisUnitario, bruto: b, tasa: t };
}

/** ITBIS de línea = ITBIS unitario × cantidad. */
export function itbisLineaDesdeUnitario(itbisUnitario: number, cantidad: number): number {
  return +((Number(itbisUnitario) || 0) * (Number(cantidad) || 0)).toFixed(2);
}
