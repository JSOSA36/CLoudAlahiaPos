export type MesaForma = 'round' | 'square' | 'rect';
export type MesaEstadoVisual = 'disponible' | 'ocupada' | 'reservada' | 'cuenta' | 'fuera';

export interface MesaSeat {
  x: number;
  y: number;
  angle: number;
}

export function parseCapacidad(tipo?: string | null, capacidad?: number | null): number {
  if (capacidad && capacidad > 0) {
    return Math.min(12, capacidad);
  }
  const m = String(tipo || '').match(/(\d+)/);
  const n = m ? Number(m[1]) : 4;
  return Math.min(12, Math.max(1, n || 4));
}

export function inferirForma(capacidad: number, forma?: string | null): MesaForma {
  const f = (forma || '').trim().toLowerCase();
  if (f === 'round' || f === 'square' || f === 'rect') {
    return f;
  }
  if (capacidad <= 2) {
    return 'rect';
  }
  return capacidad <= 4 ? 'square' : 'round';
}

export function asientos(capacidad: number, forma: MesaForma): MesaSeat[] {
  const cx = 100;
  const cy = 100;
  const n = Math.max(1, capacidad);

  if (forma === 'rect' && n <= 2) {
    return [
      { x: cx - 64, y: cy, angle: 90 },
      { x: cx + 64, y: cy, angle: 270 }
    ].slice(0, n);
  }

  if (forma === 'square' && n === 4) {
    return [
      { x: cx, y: cy - 60, angle: 180 },
      { x: cx + 60, y: cy, angle: 270 },
      { x: cx, y: cy + 60, angle: 0 },
      { x: cx - 60, y: cy, angle: 90 }
    ];
  }

  const radio = n > 6 ? 62 : 58;
  const seats: MesaSeat[] = [];
  const start = -90;
  for (let i = 0; i < n; i++) {
    const deg = start + (360 / n) * i;
    const rad = (deg * Math.PI) / 180;
    seats.push({
      x: cx + Math.cos(rad) * radio,
      y: cy + Math.sin(rad) * radio,
      angle: deg + 90
    });
  }
  return seats;
}

export function platosSobreMesa(ocupantes: number, forma: MesaForma): Array<{ x: number; y: number }> {
  const n = Math.min(4, Math.max(0, ocupantes));
  if (n === 0) {
    return [];
  }
  const cx = 100;
  const cy = 100;
  const r = forma === 'rect' ? 16 : 18;
  if (n === 1) {
    return [{ x: cx, y: cy }];
  }
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const rad = ((-90 + (360 / n) * i) * Math.PI) / 180;
    pts.push({ x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r });
  }
  return pts;
}

export function etiquetaEstado(estado: MesaEstadoVisual): string {
  switch (estado) {
    case 'ocupada': return 'Ocupada';
    case 'reservada': return 'Reservada';
    case 'cuenta': return 'Cuenta';
    case 'fuera': return 'Fuera de servicio';
    default: return 'Disponible';
  }
}

export function formatearMinutos(minutos?: number | null): string {
  if (minutos == null || minutos < 0) {
    return '';
  }
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
