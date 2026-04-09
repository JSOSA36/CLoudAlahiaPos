import { AreaDto } from "./areadto.models";

export interface EmpleadoAreaComision {
  idEmpleadoAreaComision?: number;  // PK (autonumérico)
  idEmpleado: number;               // ID del empleado
  idArea: number;                   // ID del área
 
  idEmpresa: number;                // ID de la empresa
  fechaInsercion?: Date;            // Fecha en que se registró
  area?: AreaDto | null;   
 porcientoComision?: number | null;
  montoComision?: number | null;

  tipoComision?: 'PORCIENTO' | 'MONTO';
}
