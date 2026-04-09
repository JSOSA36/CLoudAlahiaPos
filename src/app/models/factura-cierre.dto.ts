export interface FacturaCierreDTO {

  idFactura: number;
  formaPago: string;
  idCliente: number;

  pagos?: {
    metodo: string;
    monto: number;
  }[];

}
