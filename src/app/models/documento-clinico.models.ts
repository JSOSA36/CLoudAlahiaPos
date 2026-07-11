export class DocumentoClinico {
  idDocumentoClinico: number = 0;
  idEmpresa: number = 0;
  idCliente: number = 0;
  idPlantilla: number = 0;
  tipoDocumento: string = '';
  numeroDocumento: string = '';
  fechaEmision: string = '';
  nombreDoctor: string = '';
  horasReposo?: number | null;
  procedimiento: string = '';
  observaciones: string = '';
  medicamentos: string = '';
  indicaciones: string = '';
  contenidoHTMLFinal: string = '';
  datosJSON: string = '';
  idUsuarioCreacion: number = 0;
  estado: string = 'EMITIDO';
  fechaCreacion?: string;
  nombreCliente?: string;
}
