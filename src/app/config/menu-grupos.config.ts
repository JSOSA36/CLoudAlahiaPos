/**
 * Configuración de agrupación del menú lateral.
 * Para agregar un módulo nuevo al menú: incluir su código en el grupo correspondiente.
 */
export interface MenuGrupoConfig {
  id: string;
  titulo: string;
  icono: string;
  orden: number;
  modulos: string[];
}

/** Módulos que no deben mostrarse como ítem suelto (se expanden como grupo). */
export const MODULOS_EXCLUIDOS_MENU: string[] = [
  'CONTABILIDAD',
  // Misma pantalla que POLITICAS_VERSIONES (/politicas-admin); evita duplicado en menú.
  'MACROBITS_ADMIN',
  // Capacidad interna del Centro de Conciliación Bancaria (no módulo vendible separado).
  'EXTRACTO_BANCARIO',
  // Ya cubiertos dentro de Facturación Electrónica (Configuración / Historial).
  'FE_CERTIFICADO',
  'FE_ESTADO_DGII',
  'FE_REPROCESAR'
];

/**
 * Permisos / capacidades: se asignan al perfil pero NO abren pantalla de menú.
 * Controlan acciones dentro de otra pantalla (p. ej. Centro de Producción).
 */
export const MODULOS_PERMISO_SIN_MENU: string[] = [
  'PRODUCCION_GESTIONAR',
  'PRODUCCION_CANCELAR',
  'PRODUCCION_PRIORIDAD',
  'PRODUCCION_CONFIG',
  'PRODUCCION_VER',
  'PRODUCCION_REPORTES',
  'PRODUCCION_REABRIR',
  'RRHH_CORRECCION',
  'RRHH_PERMISOS_APROBAR',
  'RRHH_NOMINA_APROBAR',
  'RRHH_NOMINA_PAGAR'
];

export function esModuloPermisoSinMenu(codigo: string | null | undefined): boolean {
  if (!codigo) return false;
  return MODULOS_PERMISO_SIN_MENU.includes(String(codigo).trim().toUpperCase());
}

/** Si el usuario tiene el módulo padre CONTABILIDAD, mostrar estos hijos en el menú. */
export const CONTABILIDAD_MODULO_PADRE = 'CONTABILIDAD';

export const CONTABILIDAD_SUBMODULOS_TITULOS: Record<string, string> = {
  CONTABILIDAD_CUENTAS: 'Catálogo de Cuentas',
  CONTABILIDAD_ASIENTOS: 'Asientos Contables',
  CONTABILIDAD_LIBRO_DIARIO: 'Libro Diario',
  CONTABILIDAD_MAYOR_GENERAL: 'Mayor General',
  CONTABILIDAD_BALANCE_COMPROBACION: 'Balance de Comprobación',
  CONTABILIDAD_ESTADO_RESULTADOS: 'Estado de Resultados',
  CONTABILIDAD_BALANCE_GENERAL: 'Balance General',
  CONTABILIDAD_CONSULTA_ASIENTOS: 'Consulta de Asientos',
  CONTABILIDAD_CIERRE: 'Cierre Contable',
  CONTABILIDAD_CONFIGURACION_INTEGRACION: 'Configuración de Integración'
};

/** Formatos DGII que un perfil Contabilidad debe ver, aunque no estén tildados uno a uno. */
export const CONTABILIDAD_REPORTES_FISCALES: string[] = [
  'REPORTE_607',
  'REPORTE_606',
  'IT1',
  'IR17',
  'IR3'
];

export const MENU_GRUPOS: MenuGrupoConfig[] = [
  {
    id: 'dashboard',
    titulo: 'Panel Gerencial',
    icono: 'chart-bar',
    orden: 1,
    modulos: ['DASHBOARD', 'ALAHIA_AI']
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    icono: 'cash-register',
    orden: 2,
    modulos: [
      'POS',
      'ORDENES',
      'CENTRO_PRODUCCION',
      'PEDIDOS_ONLINE',
      'HISTORICO_FACTURAS',
      'LISTADO_DEVOLUCIONES',
      'NOTAS_CREDITO_APLICADAS',
      'SALDOS_A_FAVOR',
      'DESCUENTOS',
      'CUMPLEANEROS',
      'BIZCOCHO_ENCARGO'
    ]
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    icono: 'users',
    orden: 3,
    modulos: [
      'CLIENTES',
      'CUENTAS_COBRAR',
      'NOTAS_CREDITO'
    ]
  },
  {
    id: 'inventario',
    titulo: 'Inventario',
    icono: 'box-open',
    orden: 4,
    modulos: [
      'CATEGORIAS',
      'PRODUCTOS',
      'ALMACENES',
      'MOVIMIENTO_INVENTARIO',
      'CONDUCES',
      'REPORTE_PERDIDAS',
      'REPORTE_CRUCE_STOCK'
    ]
  },
  {
    id: 'manufactura',
    titulo: 'Producción',
    icono: 'cogs',
    orden: 4.5,
    modulos: ['MANUFACTURA_RECETAS', 'MANUFACTURA_ORDENES']
  },
  {
    id: 'compras',
    titulo: 'Compras',
    icono: 'truck',
    orden: 5,
    modulos: [
      'PROVEEDORES',
      'ORDENES_COMPRA',
      'FACTURAS_COMPRA',
      'CUENTAS_PAGAR_PROVEEDOR',
      'ANALISIS_COMPRAS_PRODUCTO'
    ]
  },
  {
    id: 'finanzas',
    titulo: 'Finanzas y Caja',
    icono: 'wallet',
    orden: 6,
    modulos: [
      'LISTADO_CAJA',
      'MOVIMIENTO_CAJA',
      'CIERRE_CAJA',
      'CUENTAS_FINANCIERAS',
      'MOVIMIENTO_FINANCIERO',
      'CONCILIACION_BANCARIA',
      'METODO_PAGO_CUENTAS',
      'TRANSFERENCIAS_FINANCIERAS',
      'GASTOS',
      'INGRESOS',
      'LISTADO_PAGOS'
    ]
  },
  {
    id: 'contabilidad',
    titulo: 'Contabilidad',
    icono: 'calculator',
    orden: 7,
    modulos: [
      'CONTABILIDAD_CUENTAS',
      'CONTABILIDAD_ASIENTOS',
      'CONTABILIDAD_LIBRO_DIARIO',
      'CONTABILIDAD_MAYOR_GENERAL',
      'CONTABILIDAD_BALANCE_COMPROBACION',
      'CONTABILIDAD_ESTADO_RESULTADOS',
      'CONTABILIDAD_BALANCE_GENERAL',
      'CONTABILIDAD_CONSULTA_ASIENTOS',
      'CONTABILIDAD_CIERRE',
      'CONTABILIDAD_CONFIGURACION_INTEGRACION'
    ]
  },
  {
    id: 'salon',
    titulo: 'Agenda y Servicios',
    icono: 'layer-group',
    orden: 8,
    modulos: [
      'AREAS',
      'CITAS',
      'HORARIO_ESTILISTA',
      'EMPLEADOS_COMISION'
    ]
  },
  {
    id: 'dental',
    titulo: 'Clínica Dental',
    icono: 'file-medical',
    orden: 9,
    modulos: [
      'FICHA_CLINICA',
      'DOCUMENTOS_CLINICOS',
      'HISTORIAL_SERVICIOS'
    ]
  },
  {
    id: 'lavado',
    titulo: 'Lavado de Vehículos',
    icono: 'tint',
    orden: 10,
    modulos: ['CONSUMO_LAVADORES']
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    icono: 'chart-line',
    orden: 11,
    modulos: [
      'REPORTE_VENTA',
      'REPORTE_SERVICIOS',
      'REPORTE_COMISIONES',
      'REPORTE_607',
      'REPORTE_606',
      'IT1',
      'IR17',
      'IR3',
      'ANTIGUEDAD_CXC',
      'ANTIGUEDAD_CXP',
      'ACTIVOS_FIJOS',
      'REPORTE_PRODUCTOS',
      'REPORTE_PROVEEDORES',
      'REPORTE_CLIENTES',
      'REPORTE_EMPLEADOS'
    ]
  },
  {
    id: 'facturacion-electronica',
    titulo: 'Facturación Electrónica',
    icono: 'file-invoice',
    orden: 12,
    modulos: [
      'FE_CONFIGURACION',
      'FE_SECUENCIAS',
      'FE_HISTORIAL',
      'FE_MONITOREO'
    ]
  },
  {
    id: 'configuracion',
    titulo: 'Configuración',
    icono: 'cog',
    orden: 13,
    modulos: [
      'EMPRESA',
      'IMPRESION_TERMICA',
      'PARAMETROS',
      'USUARIOS',
      'PERFILES',
      'ALAHIA_AI',
      'POLITICAS_VERSIONES',
      'POLITICAS_ACEPTACIONES',
      'MACROBITS_ADMIN',
      'EMPRESAS_ADMIN',
      'SUSCRIPCIONES_COBROS',
      'PAGO_SUSCRIPCION',
      'TICKETS',
      'TICKETS_ADMIN'
    ]
  },
  {
    id: 'rrhh',
    titulo: 'RRHH y Nómina',
    icono: 'user-tie',
    orden: 8,
    modulos: ['EMPLEADOS', 'RRHH_DEPARTAMENTOS', 'RRHH_CARGOS', 'RRHH_BENEFICIOS', 'RRHH_LABORAL', 'RRHH_PONCHADOR', 'RRHH_ASISTENCIA', 'RRHH_PERMISOS', 'RRHH_NOMINA']
  }
];

/** Títulos preferidos en menú (sobreescriben el nombre de BD cuando aplica). */
export const MODULO_TITULOS_MENU: Record<string, string> = {
  CUENTAS_COBRAR: 'Facturas por cobrar',
  CLIENTES: 'Clientes',
  NOTAS_CREDITO: 'Notas de Crédito',
  ANTIGUEDAD_CXC: 'Antigüedad CxC',
  ANTIGUEDAD_CXP: 'Antigüedad CxP',
  CUENTAS_PAGAR_PROVEEDOR: 'Facturas por pagar',
  CUENTAS_FINANCIERAS: 'Bancos y Cuentas Financieras',
  MOVIMIENTOS_FINANCIEROS: 'Libro de movimientos',
  CONCILIACION_BANCARIA: 'Conciliación Bancaria',
  RRHH_DEPARTAMENTOS: 'Departamentos',
  EMPLEADOS: 'Empleados',
  RRHH_CARGOS: 'Cargos',
  RRHH_BENEFICIOS: 'Beneficios',
  RRHH_LABORAL: 'Expediente Laboral',
  RRHH_PONCHADOR: 'Ponchador',
  RRHH_ASISTENCIA: 'Asistencia',
  RRHH_PERMISOS: 'Permisos y licencias',
  RRHH_NOMINA: 'Nómina',
  FICHA_CLINICA: 'Ficha del paciente',
  TRANSFERENCIAS_FINANCIERAS: 'Transferencias',
  METODO_PAGO_CUENTAS: 'Métodos de pago → cuenta',
  REPORTE_606: 'Formato 606 (Compras)',
  REPORTE_607: 'Formato 607 (Ventas)',
  REPORTE_CRUCE_STOCK: 'Cruce stock vs ventas',
  CONFIGURACION_DGII: 'Configuración fiscal DGII',
  IT1: 'Declaración IT-1',
  IR17: 'Declaración IR-17',
  IR3: 'Declaración IR-3',
  DGII_FISCAL: 'Fiscal DGII',
  FE_CONFIGURACION: 'Configuración',
  FE_SECUENCIAS: 'Secuencias e-CF',
  FE_CERTIFICADO: 'Certificado Digital',
  FE_ESTADO_DGII: 'Estado DGII',
  FE_HISTORIAL: 'Historial de Envíos',
  FE_MONITOREO: 'Monitoreo de Respuestas',
  POLITICAS_VERSIONES: 'Políticas del Servicio',
  POLITICAS_ACEPTACIONES: 'Aceptaciones de Políticas',
  MACROBITS_ADMIN: 'Admin MacroBits',
  EMPRESAS_ADMIN: 'Empresas (alta)',
  IMPRESION_TERMICA: 'Impresión térmica',
  SUSCRIPCIONES_COBROS: 'Cobros y Suscripciones',
  PAGO_SUSCRIPCION: 'Pago de Suscripción',
  TICKETS: 'Tickets de Soporte',
  TICKETS_ADMIN: 'Tickets (Admin)',
  CENTRO_PRODUCCION: 'Centro de Producción',
  KDS: 'Centro de Producción',
  PEDIDOS_ONLINE: 'Pedidos online',
  MANUFACTURA_RECETAS: 'Recetas',
  MANUFACTURA_ORDENES: 'Órdenes de producción',
  ALAHIA_AI: 'Alahia AI',
  HORARIO_ESTILISTA: 'Horario Empleados'
};
export const MENU_GRUPO_OTROS: MenuGrupoConfig = {
  id: 'otros',
  titulo: 'Otros',
  icono: 'ellipsis-h',
  orden: 99,
  modulos: []
};
