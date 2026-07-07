export interface PagoDTO {

  metodo: string;

  monto: number;
}

export interface FacturaDetalleBizcochoDTO {

  // 🔥 IDS
  idFacturaDetalle?: number;

  idFacturaHeader?: number;

  idProducto?: number;

  // 🔥 INFO
  descripcion?: string;

  cantidad: number;

  subTotal: number;

  // 🔥 BIZCOCHO
  tipoMasa: string;

  tipoRelleno: string;

  libras: number;
}

export interface BizcochoEncargo {

  // =====================================================
  // 🔥 FACTURA HEADER
  // =====================================================

  idFacturaHeader?: number;

  numeroDocumento?: string;
  idEmpresa?: number;

  idCliente: number;

  idTipoDocumentos?: number;

  // =====================================================
  // 🔥 CLIENTE
  // =====================================================

  cliente?: string;

  celular?: string;

  rnc?: string;

  nombreEmpresa?: string;

  // =====================================================
  // 🔥 FACTURA
  // =====================================================

  total: number;

  abono: number;

  formaPago?: string;

  estado?: string;

  nota?: string;

  ncf?: string;

  // =====================================================
  // 🔥 FECHAS
  // =====================================================

  fechaEntrega: Date;

  horaEntrega: Date;

  fechaRegistro?: Date;

  fechaInseccion?: Date;

  // =====================================================
  // 🔥 PAGOS
  // =====================================================

  detallePagos?: PagoDTO[];

  // =====================================================
  // 🔥 DETALLES
  // =====================================================

  facturaDetalles:
    FacturaDetalleBizcochoDTO[];

  // =====================================================
  // 🔥 CONTROL
  // =====================================================

  estaCancelada?: boolean;

  entregado?: boolean;
}

export interface RequestBizcochoEncargoDto {

  encargo: BizcochoEncargo;

  pagos: PagoDTO[];
}