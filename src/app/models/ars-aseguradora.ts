export class ArsAseguradora {
  idArs = 0;
  idEmpresa = 0;
  nombre = '';
  rnc = '';
  telefono = '';
  direccion = '';
  email = '';
  contacto = '';
  observaciones = '';
  activo = true;
}

export interface ArsCuentaPorCobrar {
  idArs: number;
  nombreArs: string;
  rnc?: string;
  telefono?: string;
  totalOriginal: number;
  totalPagado: number;
  totalPendiente: number;
  documentos: number;
}

export interface ArsDocumentoCxC {
  idFacturaHeader: number;
  idArs: number;
  nombreArs: string;
  numeroDocumento?: string;
  ncf?: string;
  fecha: string;
  fechaVencimiento?: string;
  idCliente?: number;
  nombreCliente?: string;
  totalFactura: number;
  montoCubiertoArs: number;
  pagadoArs: number;
  pendienteArs: number;
  estadoArs: string;
  idEmpresa: number;
}

export interface ArsPagoHistorial {
  idPago: number;
  idFacturaHeader: number;
  idArs?: number;
  numeroDocumento?: string;
  formaPago?: string;
  monto: number;
  nota?: string;
  esCoberturaArs: boolean;
  fecha: string;
}

export interface ArsAntiguedad {
  idArs: number;
  nombreArs: string;
  dias0A30: number;
  dias31A60: number;
  dias61A90: number;
  diasMas90: number;
  totalPendiente: number;
}

export interface ArsVentasResumen {
  idArs: number;
  nombreArs: string;
  documentos: number;
  totalVentas: number;
  coberturaArs: number;
  pagadoPaciente: number;
  pagadoArs: number;
  pendienteArs: number;
}

export interface ArsDesgloseCaja {
  idArs: number;
  nombreArs: string;
  total: number;
}
