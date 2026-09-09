import { MesaEstadoVisual, MesaForma } from '../salon/mesa-layout';

export interface SalonMesa {
  idMesa: number;
  zonaId: number;
  numero: string;
  tipo: string;
  capacidad: number;
  ocupantes: number;
  forma: MesaForma | string;
  estado: MesaEstadoVisual;
  isActiva: boolean;
  posX?: number | null;
  posY?: number | null;
  rotacion?: number | null;
  escala?: number | null;
  minutosOcupada?: number | null;
  total: number;
  cantidadOrdenes: number;
  cliente?: string | null;
  zonaNombre?: string | null;
}

export interface SalonOrdenMesa {
  idFacturaHeader: number;
  numeroDocumento: string;
  nombreCuenta: string;
  total: number;
  hora: string;
  items: number;
  productos: string[];
}

export interface SalonZona {
  zonaId: number;
  nombre: string;
  mesas: SalonMesa[];
}

export interface SalonSnapshot {
  idEmpresa: number;
  zonas: SalonZona[];
  mesasDisponibles: number;
  mesasOcupadas: number;
  mesasReservadas: number;
  mesasCuenta: number;
  mesasFuera: number;
}
