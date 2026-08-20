export type NivelSoporte = 'STANDARD' | 'GOLD' | 'PREMIUM';

export const NIVEL_SOPORTE_ETIQUETA: Record<NivelSoporte, string> = {
  STANDARD: 'Standard',
  GOLD: 'Gold',
  PREMIUM: 'Premium'
};

export const NIVEL_SOPORTE_ICONO: Record<NivelSoporte, string> = {
  STANDARD: 'headset-outline',
  GOLD: 'star',
  PREMIUM: 'diamond-outline'
};

export const NIVEL_SOPORTE_COLOR: Record<NivelSoporte, string> = {
  STANDARD: '#2563eb',
  GOLD: '#eab308',
  PREMIUM: '#7c3aed'
};

export const NIVEL_SOPORTE_DETALLES: Record<NivelSoporte, string[]> = {
  STANDARD: [
    'Atención por los canales establecidos (ticket, chat o WhatsApp).',
    'Solo soporte del sistema Alahia ERP.',
    'Lunes a viernes en horario laboral.',
    'Tiempo de respuesta mínimo de 24 horas.',
    'No incluye atención fuera del horario laboral.',
    'No incluye soporte operativo ni de equipos.'
  ],
  GOLD: [
    'Mayor prioridad que Standard.',
    'Soporte del sistema con seguimiento preferente.',
    'Atención de lunes a viernes en horario laboral.',
    'Atención fuera del horario laboral.',
    'Respuesta más rápida en incidencias.'
  ],
  PREMIUM: [
    'Soporte operativo del negocio.',
    'Soporte en equipos y configuraciones.',
    'Atención fuera del horario laboral.',
    'Máxima prioridad en incidencias.',
    'Acompañamiento en puesta en marcha y ajustes.'
  ]
};

/** Presentación: Básico/Standard → Standard; Gold → Gold; Platinum/Elite → Premium. */
export function nivelSoporteDePlan(planId: string): NivelSoporte {
  switch ((planId || '').trim().toLowerCase()) {
    case 'gold':
      return 'GOLD';
    case 'platinum':
    case 'elite':
      return 'PREMIUM';
    default:
      return 'STANDARD';
  }
}

export function normalizarNivelSoporte(valor?: string | null): NivelSoporte {
  const v = (valor || '').trim().toUpperCase().replace(/ /g, '_');
  if (v === 'GOLD' || v === 'ORO') return 'GOLD';
  if (
    v === 'PREMIUM' ||
    v === 'PREMIUM_PLUS' ||
    v === 'PREMIUMPLUS' ||
    v === 'PLATINUM' ||
    v === 'PLATINO'
  ) {
    return 'PREMIUM';
  }
  return 'STANDARD';
}

export function etiquetaNivelSoporte(valor?: string | null): string {
  return NIVEL_SOPORTE_ETIQUETA[normalizarNivelSoporte(valor)];
}

export function iconoNivelSoporte(valor?: string | null): string {
  return NIVEL_SOPORTE_ICONO[normalizarNivelSoporte(valor)];
}
