export interface EstadoCuentaClienteMovimiento {
  fecha: string;
  tipo: string;
  idDocumento?: number;
  numeroDocumento?: string;
  concepto: string;
  debito: number;
  credito: number;
  balance: number;
  formaPago?: string;
  idFacturaHeader?: number;
}

export interface EstadoCuentaClienteFacturaPendiente {
  idFacturaHeader: number;
  fecha: string;
  numeroDocumento?: string;
  fechaVencimiento?: string;
  montoOriginal: number;
  pagado: number;
  pendiente: number;
  diasVencimiento?: number | null;
  estado: string;
}

export interface EstadoCuentaCliente {
  idEmpresa: number;
  idCliente: number;
  clienteNombre?: string;
  clienteDocumento?: string;
  desde: string;
  hasta: string;
  saldoInicial: number;
  totalFacturado: number;
  totalCobrado: number;
  balancePendiente: number;
  movimientos: EstadoCuentaClienteMovimiento[];
  facturasPendientes: EstadoCuentaClienteFacturaPendiente[];
}
