export interface PagoEmpresaDto {
  id: number;
  idEmpresa: number;
  monto: number;
  fechaSubida: string;
  archivoUrl: string;
  estado: string;
  observacion?: string;
  fechaValidacion?: string;
  usuarioValida?: string;
}