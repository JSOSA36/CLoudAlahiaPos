export interface ReporteVentaPago {
  formaPago: string;
  monto: number;
}

export interface ReporteVentaLinea {
  idProducto: number;
  codigo: string;
  producto: string;
  esServicio: boolean;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  itbis: number;
  subTotal: number;
  total: number;
}

export interface ReporteVentaFactura {
  idFacturaHeader: number;
  numeroDocumento: string;
  fecha: string;
  cliente: string;
  ncf: string;
  tieneNcf: boolean;
  tieneItbis: boolean;
  tipoFactura: string;
  estado: string;
  formaPago: string;
  subTotal: number;
  totalDescuento: number;
  totalItbis: number;
  total: number;
  idSucursal?: number;
  nombreSucursal?: string;
  pagos: ReporteVentaPago[];
  lineas: ReporteVentaLinea[];
}

export interface ReporteVentaFormaPagoGrupo {
  formaPago: string;
  cantidadFacturas: number;
  subTotal: number;
  totalDescuento: number;
  totalItbis: number;
  total: number;
  facturas: ReporteVentaFactura[];
}

export interface ReporteVentaFacturas {
  desde: string;
  hasta: string;
  cantidadFacturas: number;
  conNcf: number;
  sinNcf: number;
  subTotal: number;
  totalDescuento: number;
  totalItbis: number;
  total: number;
  grupos: ReporteVentaFormaPagoGrupo[];
  gruposSucursal?: ReporteVentaSucursalGrupo[];
  esConsolidado?: boolean;
}

export interface ReporteVentaSucursalGrupo {
  idSucursal: number;
  nombreSucursal: string;
  cantidadFacturas: number;
  subTotal: number;
  totalDescuento: number;
  totalItbis: number;
  total: number;
}

export interface ReporteVentaProducto {
  idProducto: number;
  codigo: string;
  nombre: string;
  esServicio: boolean;
  cantidad: number;
  cantidadFacturas: number;
  precioPromedio: number;
  descuento: number;
  itbis: number;
  subTotal: number;
  total: number;
}

export interface ReporteVentaProductos {
  desde: string;
  hasta: string;
  cantidadProductos: number;
  cantidadVendida: number;
  totalDescuento: number;
  totalItbis: number;
  total: number;
  productos: ReporteVentaProducto[];
}
