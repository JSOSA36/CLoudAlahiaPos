export interface Reporte607Linea {
  idDocumento: number;
  tipoDocumentoAlahia: string;
  numeroDocumento?: string;
  clienteNombre?: string;
  rncCedulaComprador: string;
  tipoIdentificacion: number;
  ncf: string;
  ncfModificado?: string | null;
  tipoIngreso: number;
  fechaComprobante: string;
  fechaRetencion?: string | null;
  montoFacturado: number;
  itbisFacturado: number;
  itbisRetenidoPorTercero: number;
  itbisPercibido: number;
  isrRetenidoPorTercero: number;
  isrPercibido: number;
  impuestoSelectivoConsumo: number;
  otrosImpuestos: number;
  montoPropinaLegal: number;
  efectivo: number;
  chequeTransferenciaDeposito: number;
  tarjetaDebitoCredito: number;
  ventaCredito: number;
  bonosCertificados: number;
  permuta: number;
  otrasFormasVenta: number;
  esResumenFacturaConsumo: boolean;
  alertas: string[];
  esValidaParaEnvio: boolean;
}

export interface Reporte607 {
  idEmpresa: number;
  rncEmpresa?: string;
  nombreEmpresa?: string;
  periodo: string;
  desde: string;
  hasta: string;
  cantidadRegistros: number;
  cantidadConAlertas: number;
  totalMontoFacturado: number;
  totalItbisFacturado: number;
  resumenFcCantidad: number;
  resumenFcMonto: number;
  resumenFcItbis: number;
  contenidoTxt: string;
  lineas: Reporte607Linea[];
}
