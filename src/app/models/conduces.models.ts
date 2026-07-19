export interface ConduceLineaRequest {
  idFacturaDetalle: number;
  idProducto: number;
  cantidadEntregada: number;
}

export interface CrearConduceRequest {
  idEmpresa: number;
  idFacturaHeader: number;
  quienEntrega?: string;
  quienRecibe?: string;
  observacion?: string;
  idAlmacen?: number | null;
  idUsuario?: number | null;
  fecha?: string | null;
  detalles: ConduceLineaRequest[];
}

export interface ConduceDetalleDto {
  idConduceDetalle: number;
  idFacturaDetalle: number;
  idProducto: number;
  productoNombre: string;
  cantidadEntregada: number;
  cantidadFacturada: number;
  cantidadPendiente: number;
}

export interface ConduceDto {
  idConduceHeader: number;
  idFacturaHeader: number;
  numero: string;
  fecha: string;
  quienEntrega?: string;
  quienRecibe?: string;
  observacion?: string;
  idAlmacen?: number | null;
  almacenNombre?: string;
  idEmpresa: number;
  numeroFactura?: string;
  clienteNombre?: string;
  ncf?: string;
  detalles: ConduceDetalleDto[];
}

export interface FacturaParaConduceDto {
  idFacturaHeader: number;
  numeroDocumento: string;
  ncf?: string;
  fecha: string;
  clienteNombre?: string;
  idCliente?: number | null;
  total: number;
  lineasPendientes: number;
  cantidadPendienteTotal: number;
}

export interface LineaPendienteEntregaDto {
  idFacturaDetalle: number;
  idProducto: number;
  productoNombre: string;
  cantidadFacturada: number;
  cantidadDevuelta: number;
  cantidadEntregada: number;
  cantidadPendiente: number;
  /** UI: qty to deliver on this conduce */
  entregarAhora?: number;
  seleccionado?: boolean;
}

export interface EstadoEntregaFacturaDto {
  idFacturaHeader: number;
  numeroDocumento: string;
  ncf?: string;
  fechaFactura: string;
  clienteNombre?: string;
  clienteDocumento?: string;
  lineas: LineaPendienteEntregaDto[];
  conduces: ConduceDto[];
  totalFacturado: number;
  totalEntregado: number;
  totalPendiente: number;
}
