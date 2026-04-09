export interface PagosFacturasClientes {
  /** 🔹 Identificador único del pago */
  id: number;

  /** 🔹 Id de la factura a la que pertenece el pago */
  idFacturaHeader: number;

  /** 🔹 Número de documento (opcional, si aplica al comprobante o referencia) */
  numeroDocumento: string;

  /** 🔹 Id del cliente asociado (puede ser null si no aplica) */
  idCliente?: number | null;

  /** 🔹 Forma de pago utilizada (Ej: Efectivo, Transferencia, Tarjeta, etc.) */
  formaPago: string;

  /** 🔹 Monto del pago o abono */
  monto: number;

  /** 🔹 Fecha del pago (ISO string para enviar al backend) */
  fechaInseccion?: string;

  /** 🔹 Notas u observaciones adicionales del pago */
  nota?: string;
}
