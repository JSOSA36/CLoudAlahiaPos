export interface HorarioEstilista {
  idHorario: number;
  idEmpleado: number;
  idEmpresa: number;
  diaSemana: number;   // 0 = Domingo ... 6 = Sábado
  horaInicio: string;  // "09:00:00"
  horaFin: string;     // "18:00:00"

  recesoInicio?: string | null; // "12:00:00"
  recesoFin?: string | null;    // "13:00:00"

  estilista?: string;
}
