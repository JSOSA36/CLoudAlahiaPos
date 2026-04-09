import { Area } from "./area.model";

export interface DescuentoAreaDetalle {
  idDescuentoAreaDetalle: number;
  idDescuentoHeader: number;

  idArea: number;             // Área a la que aplica el descuento
  area?: Area | null;         // Información opcional para mostrar en UI
}
