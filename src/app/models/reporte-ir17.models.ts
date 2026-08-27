export interface Ir17Casilla {
  numero: number;
  codigo: string;
  etiqueta: string;
  seccion: string;
  tasa?: number | null;
  cantidad?: number | null;
  montoImponible: number;
  impuesto: number;
  origen: string;
  esCalculada: boolean;
  esEditableUsuario: boolean;
  formulaAplicada?: string | null;
  tipoRetencionIsr606?: number | null;
  alertas: string[];
}

export interface Ir17LineaOrigen {
  idOrdenCompraHeader: number;
  ncf?: string | null;
  numeroDocumento?: string | null;
  tipoRetencionIsr?: number | null;
  casilla: number;
  montoImponible: number;
  impuesto: number;
  fechaPagoFiscal?: string | null;
}

export interface ReporteIr17 {
  idEmpresa: number;
  rncEmpresa?: string;
  razonSocial?: string;
  nombreComercial?: string;
  correoElectronico?: string;
  telefono?: string;
  periodo: string;
  desde: string;
  hasta: string;
  fechaLimitePago?: string;
  tipoDeclaracion: string;
  versionInstructivo: string;
  cantidadRetenciones: number;
  totalMontoImponible: number;
  totalOtrasRetenciones: number;
  impuestoAPagar: number;
  saldoAFavor: number;
  totalGeneralAPagar: number;
  cantidadAlertas: number;
  alertasGlobales: string[];
  otrasRetenciones: Ir17Casilla[];
  liquidacion: Ir17Casilla[];
  lineasOrigen: Ir17LineaOrigen[];
  contenidoCsv: string;
}
