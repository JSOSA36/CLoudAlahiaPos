export interface Empleado {
  idEmpleados: number;
  nombre: string;
  ocupacion: string; // ocupación
  direccion?: string;
  celular?: string;
  estado: boolean;
  idEmpresa: number;
  idSucursal?: number | null;
  sucursalNombre?: string;
}
