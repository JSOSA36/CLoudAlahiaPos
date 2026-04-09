export class empresas
{
        public idEmpresa:number=0;
        public IdPlanes :number=0;
        public nombreComercial:string="";
        public RNC:string="";
        public  Direccion :string="";
        public  Telefono :string="";
        public  Logo :string="";
        public  CorreElectronico:string="";
        public  Nota :string="";
        public  estado:boolean=false;
        public urlCitas:string="";
        public  FechaTerminacion:Date=new Date();
        public guidPublico:string="";
        public tokenNotificacion?: string;
        public titleColor?:string;
         public correoSMTP?: string;        // ej: glamstudio@gmail.com
  public passwordSMTP?: string;      // app password (solo backend debería usarlo)
 public  servidorSMTP?: string;      // smtp.gmail.com
  public puertoSMTP?: number;        // 587
  public usaSSL?: boolean;           // true / false
  public nombreRemitente?: string;   // Glam Studio
}