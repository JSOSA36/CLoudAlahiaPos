export interface EmpresaDto {
  idEmpresa: number;
  nombreComercial: string;
  rnc?: string;
  direccion?: string;
  telefono?: string;
  correElectronico?: string;
  nota?: string;

  // 🔹 Branding / URLs
  logo?: string;          // ruta original en DB / FTP
  logoUrl?: string;       // proxy seguro desde la API
  urlCatalogo?: string;
  urlCitas: string;
  infoAgendar?: string; // texto personalizado para el botón "Agendar Cita" en el catálogo público
  // 🎨 Colores dinámicos
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  titleColor?: string;

  // 🔐 Identificador público
  guidPublico: string;

  // 📍 Ubicación GPS
  latitude?: string;
  longitude?: string;

  // 🔔 Notificaciones
  tokenNotificacion?: string;

  // 👥 Relación
  empleados?: any[];

  // =====================================
  // 📧 CONFIGURACIÓN SMTP (NUEVO)
  // =====================================
  correoSMTP?: string;        // ej: glamstudio@gmail.com
  passwordSMTP?: string;      // app password (solo backend debería usarlo)
  servidorSMTP?: string;      // smtp.gmail.com
  puertoSMTP?: number;        // 587
  usaSSL?: boolean;           // true / false
  nombreRemitente?: string;   // Glam Studio
}
