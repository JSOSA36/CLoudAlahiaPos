export interface CrearPagoDto {
  idEmpresa: number;
  monto: number;
  imagen?: File | null;
  archivoUrl?: string;
  fechaPago?: string;
  banco?: string;
  referencia?: string;
  idUsuarioReporta?: number;
}
