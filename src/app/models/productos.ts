export class productos
{
         idProducto:number=0;

        codigoBarra:string="";
        
_descuentoTipo?: string
_descuentoValor?: number
        nombre:string="";
        descripcion:string="";
        rentado:number=0;
        disponible:number=0;
        idProveedor:number=0;
        comentario:string="";
        _cantidad:number=0;
        cantidad:number=0;
        stock:number=0;
        preciooferta:number=0;
        tipoOperacion:string="";
        idArea:number=0;
        precioVenta:number=0;
        precioVentaMasItbis:number=0;
        idUnidadMedida :number=0;
        idEmpleadoComision:number=0;
        idCategoria :number=0;
        idAlmacen :number=0;
        impuesto :number=0;
        descuento :number=0;
        precioDolar:number=0;
        esProductoBelleza:boolean=false;
        idRecetasHeader :number=0;
        porcientoDescuento :number=0;
        porcientoGanancia :number=0;
        precioCompra :number=0;
        fechaVencimiento =new Date();
        imagen1 :string="";
       _precioOriginal:number=0;
       duracionServicio?: number;        // Duración en minutos
        disponibleEnCitas?: boolean; 
        nota :string="";
        seCompra:boolean=false;
        seAlquila :boolean=false;
        seVende :boolean=false;
        controlarStock :boolean=false;
        isActivo :boolean=false;
        esServicio:boolean=false;
        nombreCategoria?: string;
        ganancia :number=0;
        precioOriginal:number=0;
        itbis:boolean=false;

}