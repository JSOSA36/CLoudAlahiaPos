export interface CuentaContable {
  idCuentaContable: number;
  idEmpresa: number;
  codigo: string;
  nombre: string;
  tipoCuenta: string;
  idCuentaPadre?: number | null;
  nivel: number;
  permiteMovimiento: boolean;
  activa: boolean;
  hijos?: CuentaContable[];
}

export const TIPOS_CUENTA = [
  'Activo',
  'Pasivo',
  'Capital',
  'Ingresos',
  'Gastos',
  'Costos'
];
