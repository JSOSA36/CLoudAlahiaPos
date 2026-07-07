export interface PagoEmpresa {
  id: number;
  idEmpresa: number;
  monto: number;
  idFacturaHeader?: number;
  fechaSubida: string;
  archivoUrl: string;
  estado: string; // PENDIENTE | APROBADO | RECHAZADO
  observacion?: string;
  fechaValidacion?: string;
  nombreEmpresa?: string;
  usuarioValida?: string;
  mostrarImagen?: boolean;
}