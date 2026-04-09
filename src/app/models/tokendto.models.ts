export interface TokenDto {
  idToken?: number;       // ID interno opcional
  idEmpleado: number;     // A quién pertenece este token
  token: string;          // Token de Firebase
  fechaRegistro?: string; // Fecha en que se guardó
}
