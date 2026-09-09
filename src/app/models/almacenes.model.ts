export interface Almacen {
  idAlmacen: number;
  nombre: string;
  descripcion?: string;
  idEmpresa: number;
  idSucursal?: number | null;
  esPrincipal: boolean;
  activo: boolean;
  fechaCreacion?: string;
  idUsuarioCreacion?: number;
}
