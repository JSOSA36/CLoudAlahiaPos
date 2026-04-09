export interface ServicioDto {
  idServicio: number;
  idArea: number;
  idEmpresa: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  isServicio:boolean;
  imagen:string;
  duracionMinutos?: number;
}
