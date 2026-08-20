import { clientes } from "./clientes";
import { facturadetalles } from "./facturadetalles";

/** El API serializa IDCliente como idCliente; el DTO histórico usa iDCliente. */
export function idClienteDeFactura(f: any): number {
  const nested = f?.clientes || {};
  return Number(
    f?.iDCliente ||
      f?.idCliente ||
      f?.IDCliente ||
      nested.idCliente ||
      nested.iDCliente ||
      nested.IDCliente ||
      0
  ) || 0;
}

export function normalizarIdClienteFactura<T extends { iDCliente?: number }>(f: T): T {
  const id = idClienteDeFactura(f);
  if (id > 0) {
    f.iDCliente = id;
  }
  return f;
}

export class facturaheader
{
    idFacturaHeader:number=0;
    plazo:string="";
    tipoFactura:string="";
    moneda:string="";
    idEmpleados:number=0;
    idMoso:number=0;
    idMesa:number=0;
    idTipoDocumentos:number=0;
    nCF:string="";
    formaPago:string="";
    nombreCuenta:string=""
    iDCliente:number=0;
    efectivo:number=0;
    montoPropina:number=0;
    subTotal:number=0;
    montoTarjeta:number=0;
    cambio:number=0;
    total:number=0;
    totalItbis:number=0;
    totalDescuento:number=0;
    idEmpresa:number=0;
    estaCancelada:boolean=false;
    motivoAnulacion:string="";
    montoNotaCredito:number=0;
    estaCerrada :boolean=false;
    nota:string="";
    fechaBencimiento:Date=new Date();
    estado:string="";
    pagado:number=0;
    pendiente:number=0;
    hora:string="";
    Estado_Orden:string="";
    ajustadoInventario:boolean=false;
    facturaDetalles:facturadetalles[]=[];
    numeroDocumento:string="";
    rnc:string="";
    nombreEmpresa:string="";
    ncf:string="";
    /** Llevar | ComerAqui | Delivery | DeliveryExterno */
    tipoOrden:string="";
    clientes?: clientes;
    
}