import { ServicioDto } from "./serviciodto.models";

export interface AreaDto {
  idArea: number;
  nombre: string;
  descripcion?: string;
  servicios: ServicioDto[];
}
