export interface Cita {
  idCita: number;
  idCliente: number;
  idEmpleado: number;   // Estilista
  servicio: string;
  fecha: string;        // formato ISO "YYYY-MM-DD"
  hora: string;         // "HH:mm"
  estado: string;
  nota: string;
  costo: number;
}
