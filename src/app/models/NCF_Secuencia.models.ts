export class NCF_Secuencia {
  idSecuencia: number = 0;
  idEmpresa: number = 0;
  tipoNCF: string = '';
  serie: string = '';
  secuenciaActual: number = 0;
  secuenciaFinal: number = 0;
  fechaVencimiento: string = '';
  stockMinimo: number = 0;
  activo: boolean = true;
  fechaCreacion: Date = new Date();
}