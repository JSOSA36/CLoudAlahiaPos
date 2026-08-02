export interface It1Casilla {
  numero: number;
  codigo: string;
  etiqueta: string;
  seccion: string;
  cantidad?: number | null;
  monto: number;
  montoLocal?: number | null;
  montoServicios?: number | null;
  montoImportaciones?: number | null;
  origen: string;
  esCalculada: boolean;
  esEditableUsuario: boolean;
  formulaAplicada?: string | null;
  alertas: string[];
}

export interface ReporteIt1 {
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
  totalOperacionesPeriodo: number;
  totalItbisCobrado: number;
  totalItbisDeducible: number;
  impuestoAPagar: number;
  saldoAFavor: number;
  totalGeneralAPagar: number;
  cantidadAlertas: number;
  alertasGlobales: string[];
  anexoA: It1Casilla[];
  it1: It1Casilla[];
  contenidoCsv: string;
}
