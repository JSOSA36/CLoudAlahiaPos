export class Ingresos {
  idIngreso: number = 0;
  descripcion: string = '';
  categoria: string = '';
  origen: string = ''; // Ej: "Abono a Factura", "Arrendamiento", etc.
  monto: number = 0;
  formaPago: string = ''; // Efectivo, Tarjeta, Transferencia...
  referencia: string = '';
  nota: string = '';
  idCliente: number = 0;
  idFacturaHeader: number = 0;
  idEmpresa: number = 0;
  idUsuario:number=0;
  fechaRegistro: string="";
}
