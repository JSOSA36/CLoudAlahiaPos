export interface FacturaDto {

  numeroFactura: string;

  fecha: Date;

  metodoPago: string;

  total: number;

  ncf?: string;

  rnc?: string;

  nombreEmpresa?: string;

}