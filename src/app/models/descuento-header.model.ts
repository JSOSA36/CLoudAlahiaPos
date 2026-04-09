export interface DescuentoHeader {
  idDescuentoHeader: number;
  idEmpresa: number;

  nombreEvento: string;
  descripcion: string;

  tipoDescuento: 'PORCENTAJE' | 'MONTO';
  valor: number;

  diasSemana: string;

  fechaInicio?: string | null;
  fechaFin?: string | null;

  horaInicio?: string | null;
  horaFin?: string | null;

  aplicaATodos: boolean;
  activo: boolean;

  // 🔹 IDs de servicios
  servicios: number[];

  // 🔹 IDs de áreas
  areas: number[];
}
