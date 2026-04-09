import { Modulo } from './modulo.model';

export interface EmpresaModulo {
  id: number;
  empresaId: number;
  moduloId: number;
  activo: boolean;
  fechaActivacion?: Date;

  // navegación (cuando el backend hace include)
  modulo?: Modulo;
}
