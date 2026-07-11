export interface Almacen {
  idAlmacen: number;
  nombre: string;
  descripcion?: string;
  idEmpresa: number;
  esPrincipal: boolean;
  activo: boolean;
  fechaCreacion?: string;
  idUsuarioCreacion?: number;
}
