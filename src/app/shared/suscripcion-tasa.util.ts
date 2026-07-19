/** Tasa fija de cobro SaaS: 1 USD = N DOP (fallback si la API no envía tasa). */
export const TASA_USD_DOP_DEFAULT = 60;

export function usdADop(usd: number, tasa = TASA_USD_DOP_DEFAULT): number {
  const n = Number(usd) || 0;
  const t = Number(tasa) > 0 ? Number(tasa) : TASA_USD_DOP_DEFAULT;
  return Math.round(n * t * 100) / 100;
}
