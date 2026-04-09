export interface EmpresaPlan {
  id: number;
  empresaId: number;
  precioBaseUSD: number;
  usuariosIncluidos: number;
  activo: boolean;
  fechaInicio: Date;
  fechaFin?: Date;
}
