export interface PerfilCreate {
  idEmpresa: number;
  nombre: string;
  descripcion?: string;
  modulos: number[];
  activo: boolean;
}
