export interface ValidarPagoDto {
  idPago: number;
  estado: string; // APROBADO | RECHAZADO
  observacion?: string;
  usuarioValida?: string;
}