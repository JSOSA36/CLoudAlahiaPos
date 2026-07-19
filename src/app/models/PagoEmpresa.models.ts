export interface PagoEmpresa {
  id: number;
  idEmpresa: number;
  monto: number;
  idFacturaHeader?: number;
  fechaSubida: string;
  archivoUrl: string;
  estado: string;
  observacion?: string;
  fechaValidacion?: string;
  nombreEmpresa?: string;
  usuarioValida?: string;
  mostrarImagen?: boolean;
  fechaPago?: string;
  banco?: string;
  referencia?: string;
  idCiclo?: number;
}
