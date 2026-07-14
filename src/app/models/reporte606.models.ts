export interface Reporte606Linea {
  idOrdenCompraHeader: number;
  numeroDocumento?: string;
  proveedorNombre?: string;
  rncCedula: string;
  tipoId: number;
  tipoBienesServicios: number;
  ncf: string;
  ncfModificado?: string;
  fechaComprobante: string;
  fechaPago?: string;
  montoFacturadoServicios: number;
  montoFacturadoBienes: number;
  totalMontoFacturado: number;
  itbisFacturado: number;
  itbisRetenido: number;
  itbisProporcionalidad: number;
  itbisLlevadoAlCosto: number;
  itbisPorAdelantar: number;
  itbisPercibido: number;
  tipoRetencionIsr?: number | null;
  montoRetencionRenta: number;
  isrPercibido: number;
  impuestoSelectivo: number;
  otrosImpuestos: number;
  montoPropinaLegal: number;
  formaPagoDgii: number;
  estado: string;
  alertas: string[];
  esValidaParaEnvio: boolean;
}

export interface Reporte606 {
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
  totalItbisRetenido: number;
  totalRetencionRenta: number;
  contenidoTxt: string;
  lineas: Reporte606Linea[];
}
