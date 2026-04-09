export interface CitaDto {
  idCita?: number;
  idCliente?: number;
  idEmpleado?: number;
  idEmpresa?: number;
  nombreCliente?: string;
  nombreEstilista?: string;
  servicio?: string;
  fecha?: string;     // "2025-11-10T00:00:00"
  hora?: string;      // "10:00:00"
  estado?: string;
  nota?: string;
  costo?: number;
  telefono?: string;
  correo?: string;
}
