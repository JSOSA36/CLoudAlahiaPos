export interface AplicacionPagoFactura {
  idFacturaHeader: number;
  monto: number;
}

export interface RegistrarPagoLoteRequest {
  idEmpresa: number;
  idCliente: number;
  formaPago: string;
  nota?: string;
  aplicaciones: AplicacionPagoFactura[];
}

export interface RegistrarPagoLoteResult {
  facturasAfectadas: number;
  montoTotal: number;
  message: string;
}
