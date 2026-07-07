export interface CrearPagoDto {
  idEmpresa: number;
  monto: number;
  imagen?: File | null;
  archivoUrl?: string;
}