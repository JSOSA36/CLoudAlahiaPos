import { empresas } from "./empresas";

export class usuarios
{
    idEmpleados:number=0;
    cedula:string="";
    nombre:string="";
    direccion:string="";
    correo:string="";
    telefono:string="";

    celular:string="";
    roles :string="";
    estado :boolean=false;
    userName:string="";
    nota:string="";
    userPassWord:string="";
    empresas:empresas=new empresas();
    dispositivoGuardado : string="";
    puedeEliminarOrden: boolean = false;
}