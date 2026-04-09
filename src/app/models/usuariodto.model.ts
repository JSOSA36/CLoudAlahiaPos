// src/app/models/UsuarioDto.ts
export interface UsuarioDto {
  idusuario?: number;    // opcional (0 si es nuevo, útil para edición)
  idEmpresa: number;       // empresa a la que pertenece

  nombre: string;          // nombre del empleado
  correo: string;          // correo (también será el username)
  password?: string;       // contraseña (puede ser opcional en edición)

  rol: string;             // rol: Admin, User, Manager
  estado: boolean;         // estado activo/inactivo

  direccion?: string;      // opcional
  celular?: string;        // opcional
  userPassoword?: string;  // opcional
 puedeEliminarOrden: boolean ;
  // 🔹 nuevo campo para FCM
  
}
