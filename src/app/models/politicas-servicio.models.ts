export interface PoliticasVersionDto {
  idVersion: number;
  numeroVersion: string;
  titulo: string;
  contenido: string;
  estado: string;
  fechaCreacion: string;
  idUsuarioCreacion?: number;
  fechaPublicacion?: string;
  idUsuarioPublicacion?: number;
  notas?: string;
}

export interface PoliticasEstadoDto {
  requiereAceptacion: boolean;
  esAdministrador: boolean;
  versionActiva?: PoliticasVersionDto | null;
}

export interface AceptarPoliticasRequest {
  idEmpresa: number;
  idUsuario: number;
  idVersion: number;
  direccionIp?: string;
  navegador?: string;
  sistemaOperativo?: string;
}

export interface AceptarPoliticasResultado {
  exitoso: boolean;
  mensaje: string;
  idAceptacion?: number;
  correoEnviado: boolean;
}

export interface CrearPoliticasVersionRequest {
  numeroVersion: string;
  titulo: string;
  contenido: string;
  notas?: string;
  idUsuario: number;
}

export interface PublicarPoliticasRequest {
  idVersion: number;
  idUsuario: number;
}

export interface PoliticasAceptacionDto {
  idAceptacion: number;
  idVersion: number;
  numeroVersion: string;
  tituloVersion: string;
  idEmpresa: number;
  nombreEmpresa?: string;
  idUsuario: number;
  nombreUsuario?: string;
  fechaAceptacion: string;
  direccionIp?: string;
  navegador?: string;
  sistemaOperativo?: string;
  correoEnviado: boolean;
  fechaCorreoEnviado?: string;
}
