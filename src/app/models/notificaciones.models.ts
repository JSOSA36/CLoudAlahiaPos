export type NotificacionDestinoTipo = 'USUARIO' | 'EMPRESA' | 'ROL';
export type NotificacionPrioridad = 'INFO' | 'ADVERTENCIA' | 'ERROR' | 'EXITO';

export interface NotificacionItem {
  idNotificacion: number;
  idEmpresa: number;
  destinoTipo: NotificacionDestinoTipo | string;
  idUsuarioDestino?: number | null;
  idRolDestino?: number | null;
  rolCodigo?: string | null;
  tipo: string;
  prioridad: NotificacionPrioridad | string;
  titulo: string;
  mensaje: string;
  ruta?: string | null;
  referenciaTipo?: string | null;
  referenciaId?: number | null;
  leida: boolean;
  archivada?: boolean;
  fechaCreacion: string;
}

export function toastColorPrioridad(prioridad?: string): string {
  switch ((prioridad || '').toUpperCase()) {
    case 'ADVERTENCIA': return 'warning';
    case 'ERROR': return 'danger';
    case 'EXITO': return 'success';
    default: return 'primary';
  }
}

export function cssPrioridad(prioridad?: string): string {
  switch ((prioridad || '').toUpperCase()) {
    case 'ADVERTENCIA': return 'prio-warn';
    case 'ERROR': return 'prio-error';
    case 'EXITO': return 'prio-ok';
    default: return 'prio-info';
  }
}
