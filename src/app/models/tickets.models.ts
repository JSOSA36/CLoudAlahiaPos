export type TicketEstado =
  | 'ABIERTO'
  | 'EN_PROCESO'
  | 'PENDIENTE_CLIENTE'
  | 'RESUELTO'
  | 'CERRADO'
  | 'REABIERTO';

export type TicketPrioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export const TICKET_CATEGORIAS = [
  'Acceso al Sistema',
  'Facturación Electrónica',
  'Facturación',
  'Inventario',
  'Compras',
  'Ventas',
  'Contabilidad',
  'Banco',
  'Reportes',
  'Configuración',
  'Error del Sistema',
  'Solicitud de Mejora',
  'Otro'
] as const;

export const TICKET_ESTADOS: TicketEstado[] = [
  'ABIERTO',
  'EN_PROCESO',
  'PENDIENTE_CLIENTE',
  'RESUELTO',
  'CERRADO',
  'REABIERTO'
];

export const TICKET_PRIORIDADES: TicketPrioridad[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

export interface TicketAdjunto {
  idAdjunto: number;
  idTicket: number;
  idMensaje?: number | null;
  nombreArchivo: string;
  url: string;
  contentType?: string;
  tamanoBytes?: number;
  fechaCreacion: string;
}

export interface TicketMensaje {
  idMensaje: number;
  idTicket: number;
  idUsuario: number;
  nombreUsuario: string;
  esRespuestaAdmin: boolean;
  mensaje: string;
  fechaCreacion: string;
  adjuntos: TicketAdjunto[];
}

export interface TicketListItem {
  idTicket: number;
  numero: string;
  idEmpresa: number;
  nombreEmpresa: string;
  nombreCliente?: string;
  asunto: string;
  categoria: string;
  prioridad: TicketPrioridad | string;
  estado: TicketEstado | string;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioCrea?: string;
  cantidadMensajes: number;
  sinResponder: boolean;
  fechaUltimaRespuestaAdmin?: string;
  horasEstimadasMin?: number | null;
  horasEstimadasMax?: number | null;
  fechaEstimadaResolucion?: string | null;
}

export interface TicketDetalle extends TicketListItem {
  descripcion: string;
  idUsuarioCrea: number;
  versionSistema?: string;
  dispositivo?: string;
  navegador?: string;
  sistemaOperativo?: string;
  fechaResolucion?: string;
  fechaCierre?: string;
  mensajes: TicketMensaje[];
  adjuntos: TicketAdjunto[];
}

export interface TicketMetricas {
  abiertos: number;
  enProceso: number;
  pendientesCliente: number;
  resueltos: number;
  cerrados: number;
  reabiertos: number;
  total: number;
  tiempoPromedioRespuestaHoras?: number | null;
  tiempoPromedioResolucionHoras?: number | null;
}

export interface TicketNotificacion {
  idNotificacion: number;
  idEmpresa: number;
  idTicket: number;
  numeroTicket?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
}

export interface TicketFiltroAdmin {
  q?: string;
  estado?: string;
  prioridad?: string;
  categoria?: string;
  idEmpresa?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
  orden?: string;
}

export function etiquetaEstado(estado: string): string {
  return (estado || '').replace(/_/g, ' ');
}

export function claseEstado(estado: string): string {
  switch ((estado || '').toUpperCase()) {
    case 'ABIERTO': return 'st-abierto';
    case 'EN_PROCESO': return 'st-proceso';
    case 'PENDIENTE_CLIENTE': return 'st-pendiente';
    case 'RESUELTO': return 'st-resuelto';
    case 'CERRADO': return 'st-cerrado';
    case 'REABIERTO': return 'st-reabierto';
    default: return 'st-abierto';
  }
}

export function clasePrioridad(prioridad: string): string {
  switch ((prioridad || '').toUpperCase()) {
    case 'BAJA': return 'pr-baja';
    case 'MEDIA': return 'pr-media';
    case 'ALTA': return 'pr-alta';
    case 'CRITICA': return 'pr-critica';
    default: return 'pr-media';
  }
}

/** Texto del rango estimado (2h–24h). */
export function textoEstimadoAtencion(
  min?: number | null,
  max?: number | null
): string | null {
  if (min == null || max == null || min <= 0 || max <= 0) return null;
  if (min === max) return `${min} hora${min === 1 ? '' : 's'}`;
  return `${min}–${max} horas`;
}
