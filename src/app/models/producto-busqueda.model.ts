export interface ProductoBusquedaCompra {
  idProducto: number;
  codigoBarra?: string;
  nombre?: string;
  cantidad: number;
  existenciaAlmacen: number;
  precioCompra: number;
  controlarStock: boolean;
  esServicio: boolean;
  tipoComportamiento?: string;
  /** true = costo/precio del producto incluye ITBIS (desglosar en factura de compra). */
  itbis?: boolean;
}

export interface ProductoBusquedaCompraResult {
  items: ProductoBusquedaCompra[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
