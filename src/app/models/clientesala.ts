import { clientes } from './clientes';

export type EstadoTurno = 'Esperando' | 'Recortando' | 'Lavando' | 'Color' | 'Pagando' | 'Finalizado';

export interface ClienteEnSala {
  idCliente: number;
  nombre: string;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  nota?: string;
  estado: EstadoTurno;   // flujo (string)
  activo?: boolean;      // opcional: estado lógico (boolean)
  turno?: number;
  llegadaISO?: string;
  fotoUrl?: string;
}
/** Adapta tu modelo base a la UI sin mutarlo. */
export function adaptarClienteEnSala(
  base: clientes,
  estado: EstadoTurno = 'Esperando',
  extras: Partial<ClienteEnSala> = {}
): ClienteEnSala {
  return {
    idCliente: base.iDCliente,
    nombre: base.nombreComercial ?? '',
    telefono: base.telefono,
    celular: base.celular,
    email: base.email,
    direccion: base.direccion,
    nota: base.nota,
    estado,
    ...extras
  };
}
