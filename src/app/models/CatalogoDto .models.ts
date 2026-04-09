import { AreaDto } from "./areadto.models";

export interface CatalogoDto {
  idEmpresa: number;
  nombreComercial: string;
  direccion: string;
  telefono: string;
  logoUrl?: string;        // URL pública del logo
  areas: AreaDto[];

  // 🔹 Colores dinámicos del salón
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
}
