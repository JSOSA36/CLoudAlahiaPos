import { empleadoarearesumen } from "./empleadoarearesument";



export class EmpleadosDto {
  idEmpleados: number = 0;
  nombre: string = '';

  cantidadServicios: number = 0;

  // Solo para UI
  comisiones?: empleadoarearesumen[];
}
