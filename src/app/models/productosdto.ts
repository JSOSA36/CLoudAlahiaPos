export class productos{
    idproducto:number=0;
    descripcion:string="";
    costo:number=0;
    precio:number=0;
    cantidad:number=0;
    stockminimo:number=0;
     imagen!: Blob; // o
     isActiva:boolean=false;
     isproductobelleza:boolean=false;
     idcategoria:number=0;
duracionServicio?: number;        // Duración en minutos
  disponibleEnCitas?: boolean; 
}