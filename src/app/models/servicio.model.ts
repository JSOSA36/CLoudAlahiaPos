export interface Servicio {
  idServicio: number;
  nombre: string;
  descripcion?: string;
  precioVenta: number;
  idArea: number;
  idEmpresa: number;
  isActivo: boolean;
  controlarStock: boolean;
}
