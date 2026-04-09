// src/app/models/cita.ts

// 🔥 Estados permitidos para una cita (FUENTE ÚNICA DE VERDAD)
export type EstadoCita =
  | 'Programada'
  | 'Confirmada'
  | 'En curso'
  | 'Completada'
  | 'Cancelada';

export interface Cita {
  // 🆔 Identificador
  idCita: number;
  esSeguimiento?: boolean;
  // 👨‍🎨 Estilista
  idEmpleado: number;
  nombreEstilista?: string;
  idCliente?: number;
  // 💇‍♀️ Servicio
  idProducto: number;
  nombreServicio?: string;

  // 📅 Agenda
  fecha: string;        // YYYY-MM-DD
  hora: string;         // HH:mm
  horaFin: string;      // HH:mm (calculada en backend)
  duracionMinutos: number;

  // 📌 Estado y notas
  estado: EstadoCita;   // 🔥 ya NO opcional (evita bugs)
  nota?: string;
  abono?: number;  
  banco?: string;    // 💰 Monto abonado
  // 💵 Datos comerciales
  costo: number;

  // 👤 Cliente
  nombreCliente?: string;
  telefono?: string;
  correo?: string;

  // 🏢 Empresa
  idEmpresa?: number;
    rutaReciboPago?: string; // 🔥 URL o ruta FTP del recibo
}
