export interface CitaDto {
  idCita: number;
  idEmpleado: number;
  nombreEstilista?: string;

  idProducto: number;
  nombreServicio?: string;
esSeguimiento?: boolean;
  fecha: string;      
  hora: string;       
  horaFin: string;    

  duracionMinutos: number;

  estado?: string;
  nota?: string;

  costo?: number;
  nombreCliente?: string;
  telefono?: string;
  correo?: string;
  Abono: number;
  IdFacturaHeader?: number;
}
