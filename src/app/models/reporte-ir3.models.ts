export interface Ir3Casilla {
  numero: number;
  codigo: string;
  etiqueta: string;
  seccion: string;
  cantidad?: number | null;
  monto: number;
  origen: string;
  esCalculada: boolean;
  esEditableUsuario: boolean;
  formulaAplicada?: string | null;
  alertas: string[];
}

export interface Ir3LineaAsalariado {
  idNominaProceso: number;
  periodKey: string;
  estadoNomina: string;
  idEmpleados: number;
  cedula?: string | null;
  nombre?: string | null;
  salarioBase: number;
  horasExtra: number;
  comisiones: number;
  bonificaciones: number;
  otrosIngresos: number;
  bruto: number;
  afpEmpleado: number;
  sfsEmpleado: number;
  baseImponibleIsr: number;
  isrRetenido: number;
  fechaInicio: string;
  fechaFin: string;
  fechaPago?: string | null;
}

export interface Ir3NominaIncluida {
  idNominaProceso: number;
  periodKey: string;
  estado: string;
  frecuencia: string;
  fechaInicio: string;
  fechaFin: string;
  fechaPago?: string | null;
  empleados: number;
  totalBruto: number;
  totalIsr: number;
}

export interface ReporteIr3 {
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
  cantidadEmpleados: number;
  cantidadNominas: number;
  totalRemuneraciones: number;
  totalAfpEmpleado: number;
  totalSfsEmpleado: number;
  totalBaseImponible: number;
  totalIsrRetenido: number;
  impuestoAPagar: number;
  saldoAFavor: number;
  totalGeneralAPagar: number;
  cantidadAlertas: number;
  alertasGlobales: string[];
  resumen: Ir3Casilla[];
  liquidacion: Ir3Casilla[];
  nominasIncluidas: Ir3NominaIncluida[];
  lineasAsalariados: Ir3LineaAsalariado[];
  contenidoCsv: string;
}
