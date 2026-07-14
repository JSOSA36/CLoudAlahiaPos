export class HistorialServicioCliente {
  idFacturaHeader: number = 0;
  idFacturaDetalle: number = 0;
  fechaServicio: string = '';
  hora?: string;
  numeroFactura: string = '';
  estadoFactura: string = '';
  idCliente?: number;
  nombreCliente: string = '';
  idProducto: number = 0;
  nombreServicio: string = '';
  cantidad: number = 0;
  precioUnitario: number = 0;
  total: number = 0;
  idUsuario?: number;
  nombreUsuario?: string;
}

export class UltimoServicioCliente {
  idFacturaDetalle: number = 0;
  idFacturaHeader: number = 0;
  fechaServicio: string = '';
  nombreServicio: string = '';
  precioUnitario: number = 0;
  cantidad: number = 0;
  total: number = 0;
  numeroFactura: string = '';
}
