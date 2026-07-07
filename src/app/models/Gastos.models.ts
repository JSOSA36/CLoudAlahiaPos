export class Gastos {

  idGasto: number = 0;

  idEmpresa: number = 0;
  idUsuario:number=0;

  idEmpleado: number | null = null;

  tipoGasto: string = '';

  monto: number = 0;

  orien: string = '';

  detalle: string = '';

  formaPago: string = 'EFECTIVO';

  idCuentaFinanciera: number | null = null;

  referencia: string = '';

  fechaRegistro: Date = new Date();

  estaAnulado: boolean = false;

}