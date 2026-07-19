/** Opciones estándar de plazo de crédito (ventas). */
export interface PlazoCreditoOpcion {
  value: string;
  label: string;
  dias: number | null;
}

export const PLAZOS_CREDITO: PlazoCreditoOpcion[] = [
  { value: '0', label: 'Contado (0 días)', dias: 0 },
  { value: '15', label: '15 días', dias: 15 },
  { value: '30', label: '30 días', dias: 30 },
  { value: '45', label: '45 días', dias: 45 },
  { value: '60', label: '60 días', dias: 60 },
  { value: '90', label: '90 días', dias: 90 },
  { value: 'custom', label: 'Personalizado', dias: null },
];

export function resolverDiasPlazo(codigo: string, diasCustom?: number | null): number {
  if (codigo === 'custom') {
    const n = Number(diasCustom);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : -1;
  }
  const op = PLAZOS_CREDITO.find((p) => p.value === codigo);
  return op?.dias ?? -1;
}

/** Fecha de vencimiento = hoy (corte local) + días. Mediodía local evita problemas de UTC. */
export function calcularFechaVencimiento(dias: number, desde: Date = new Date()): Date {
  const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate(), 12, 0, 0, 0);
  d.setDate(d.getDate() + Math.max(0, dias));
  return d;
}

export function etiquetaPlazo(dias: number): string {
  return `${dias} día${dias === 1 ? '' : 's'}`;
}
