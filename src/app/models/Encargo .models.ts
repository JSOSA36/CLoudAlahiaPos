export interface Encargo {
  id?: number;
  cliente: string;
  celular: string;
  tipoMasa: string;
  tipoRelleno: string;
  libras: number;
  precioTotal: number;
  abono: number;
  pendiente: number;
  nota: string;
  fechaEntrega: Date;
  estado: 'Pendiente' | 'Entregado' | 'Vencido';
}