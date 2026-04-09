export interface PerfilUpdate {
  idPerfil: number;
  idEmpresa: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  modulos: number[];
}
