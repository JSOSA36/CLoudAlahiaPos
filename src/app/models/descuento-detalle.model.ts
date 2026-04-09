import { productos } from "./productosdto";

export interface DescuentoDetalle {
  idDescuentoDetalle: number;
  idDescuentoHeader: number;

  idProducto: number;          // Servicio al que aplica el descuento
  producto?: productos | null;  // Opcional si lo quieres cargar para mostrar
}
