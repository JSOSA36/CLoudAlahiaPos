export interface AlmacenExistenciaDetalle {
  idAlmacen: number;
  nombreAlmacen: string;
  cantidad: number;
  esPrincipal: boolean;
}

export interface AlmacenExistenciaResumen {
  idProducto: number;
  total: number;
  detalle: AlmacenExistenciaDetalle[];
}
