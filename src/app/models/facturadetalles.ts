import { productos } from "./productos";

export class facturadetalles
{
    idFacturaDetalle:number=0;
    idFacturaHeader :number=0;
    comentario:string="";
    idProducto:number=0;
    dias:number=0;
    cantidad:number=0;
    idEmpresa:number=0;
    itbis:number=0;
    subTotal:number=0;
    descuento:number=0;
    precioOferta :number=0;
    idEmpleadoComision:number=0;
    enviadococina:boolean=false;
    productos:productos=new productos();
    nombreEmpleadoComision:string="";
}