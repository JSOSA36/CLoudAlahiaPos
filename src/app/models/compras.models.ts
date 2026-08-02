export class Proveedor {
  idProveedor = 0;
  idEmpresa = 0;
  rnc = '';
  nombreComercial = '';
  telefono = '';
  isActivo = true;
  direccion = '';
  nota = '';
  email = '';
}

export interface FacturaCompraDetalle {
  idOrdenCompraDetalle?: number;
  idProducto: number;
  cantidad: number;
  cantidadRecibida?: number;
  cantidadPendienteRecepcion?: number;
  precioCompra: number;
  descuento: number;
  itbis: number;
  subTotal?: number;
  nombreProducto?: string;
  tipoComportamientoLinea?: string;
  requiereRecepcionFisica?: boolean;
}

export interface FacturaCompra {
  idOrdenCompraHeader: number;
  idEmpresa: number;
  idProveedor: number;
  proveedorNombre?: string;
  numeroDocumento?: string;
  numeroComprobanteProveedor?: string;
  ncfModificado?: string;
  fechaDocumento: string;
  condicionFactura: string;
  fechaVencimiento?: string;
  idAlmacen?: number;
  comentario?: string;
  idTipoBienesServicios?: number | null;
  formaPagoDgii?: number | null;
  montoFacturadoServicios?: number;
  montoFacturadoBienes?: number;
  itbisRetenido?: number;
  itbisProporcionalidad?: number;
  itbisLlevadoAlCosto?: number;
  tipoRetencionIsr?: number | null;
  montoRetencionRenta?: number;
  fechaPagoFiscal?: string;
  destinoItbis?: number | null;
  destinoItbisSugerido?: number | null;
  clasificacionConfirmada?: boolean;
  itbisComprasLocales?: number;
  itbisServicios?: number;
  itbisImportaciones?: number;
  codigoNormaRetencionItbis?: string;
  baseRetencionItbis?: number;
  totalDescuento: number;
  totalItbis: number;
  total: number;
  pagado: number;
  pendiente: number;
  estado: string;
  estadoRecepcion?: string;
  fechaUltimaRecepcion?: string;
  ajustadaInventario: boolean;
  idTipoDocumentos?: number;
  idDocumentoOrigen?: number;
  numeroDocumentoOrigen?: string;
  fechaEnvioProveedor?: string;
  detalles: FacturaCompraDetalle[];
}

export interface ConfirmarRecepcionCompraRequest {
  idEmpresa: number;
  idUsuario: number;
  idAlmacen: number;
  observacion?: string;
  lineas: { idOrdenCompraDetalle: number; cantidadRecibir: number }[];
}

export interface GuardarFacturaCompraDetalleRequest {
  idProducto: number;
  cantidad: number;
  precioCompra: number;
  descuento: number;
  itbis: number;
}

export interface GuardarFacturaCompraRequest {
  idOrdenCompraHeader: number;
  idEmpresa: number;
  idProveedor: number;
  numeroComprobanteProveedor?: string;
  ncfModificado?: string;
  fechaDocumento: string;
  condicionFactura: string;
  fechaVencimiento?: string;
  idAlmacen?: number;
  comentario?: string;
  idTipoBienesServicios?: number | null;
  formaPagoDgii?: number | null;
  montoFacturadoServicios?: number;
  montoFacturadoBienes?: number;
  itbisRetenido?: number;
  itbisProporcionalidad?: number;
  itbisLlevadoAlCosto?: number;
  tipoRetencionIsr?: number | null;
  montoRetencionRenta?: number;
  fechaPagoFiscal?: string;
  destinoItbis?: number | null;
  clasificacionConfirmada?: boolean;
  itbisComprasLocales?: number;
  itbisServicios?: number;
  itbisImportaciones?: number;
  codigoNormaRetencionItbis?: string;
  baseRetencionItbis?: number;
  detalles: GuardarFacturaCompraDetalleRequest[];
}

export interface ConfirmarFacturaCompraRequest {
  idEmpresa: number;
  idUsuario: number;
  formaPago?: string;
}

export interface RegistrarPagoProveedorRequest {
  idEmpresa: number;
  idUsuario: number;
  monto: number;
  formaPago: string;
  nota?: string;
  idCuentaFinanciera?: number;
}

export interface PagoProveedor {
  idPagoProveedor: number;
  idOrdenCompraHeader: number;
  numeroDocumento?: string;
  monto: number;
  formaPago: string;
  nota?: string;
  fechaInseccion: string;
  idCuentaFinanciera?: number | null;
  idUsuario?: number | null;
}

export interface EstadoCuentaMovimiento {
  fecha: string;
  tipo: string;
  idDocumento?: number;
  numeroDocumento?: string;
  concepto: string;
  debito: number;
  credito: number;
  balance: number;
  formaPago?: string;
  idOrdenCompraHeader?: number;
}

export interface EstadoCuentaFacturaPendiente {
  idOrdenCompraHeader: number;
  fecha: string;
  numeroDocumento?: string;
  fechaVencimiento?: string;
  montoOriginal: number;
  pagado: number;
  pendiente: number;
  diasVencimiento?: number | null;
  estado: string;
}

export interface EstadoCuentaProveedor {
  idEmpresa: number;
  idProveedor: number;
  proveedorNombre?: string;
  proveedorRnc?: string;
  desde: string;
  hasta: string;
  saldoInicial: number;
  totalComprado: number;
  totalPagado: number;
  balancePendiente: number;
  movimientos: EstadoCuentaMovimiento[];
  facturasPendientes: EstadoCuentaFacturaPendiente[];
}

export interface AnalisisCompraLinea {
  fecha: string;
  idProveedor: number;
  proveedorNombre?: string;
  idOrdenCompraHeader: number;
  numeroDocumento?: string;
  idProducto: number;
  productoNombre?: string;
  idAlmacen?: number;
  cantidad: number;
  precioUnitario: number;
  itbis: number;
  descuento: number;
  total: number;
}

export interface AnalisisCompraProveedorResumen {
  idProveedor: number;
  proveedorNombre?: string;
  ultimoPrecio: number;
  precioPromedio: number;
  mejorPrecio: number;
  peorPrecio: number;
  vecesComprado: number;
  cantidadTotal: number;
  ultimaFecha?: string;
}

export interface AnalisisCompraIndicadores {
  ultimoPrecio?: number;
  ultimoProveedor?: string;
  ultimaFecha?: string;
  precioPromedio?: number;
  mejorPrecio?: number;
  peorPrecio?: number;
  vecesComprado: number;
  cantidadTotal: number;
  mayorCantidad: number;
  proveedorMasBarato?: string;
  proveedorMasFrecuente?: string;
}

export interface AnalisisProductoProveedor {
  idEmpresa: number;
  idProducto?: number;
  productoNombre?: string;
  desde?: string;
  hasta?: string;
  indicadores: AnalisisCompraIndicadores;
  resumenProveedores: AnalisisCompraProveedorResumen[];
  historial: AnalisisCompraLinea[];
  evolucionPrecio: { fecha: string; precioUnitario: number; idProveedor: number; proveedorNombre?: string; numeroDocumento?: string }[];
}
