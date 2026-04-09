export interface EmpresaUsuario {
  id: number;
  empresaId: number;
  usuarioId: number;
  activo: boolean;
  fechaAsignacion?: Date;
}
