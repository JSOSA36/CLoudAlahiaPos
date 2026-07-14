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
export const MODULOS_EXCLUIDOS_MENU: string[] = ['CONTABILIDAD'];

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

export const MENU_GRUPOS: MenuGrupoConfig[] = [
  {
    id: 'dashboard',
    titulo: 'Panel Gerencial',
    icono: 'chart-bar',
    orden: 1,
    modulos: ['DASHBOARD']
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    icono: 'cash-register',
    orden: 2,
    modulos: [
      'POS',
      'ORDENES',
      'HISTORICO_FACTURAS',
      'LISTADO_DEVOLUCIONES',
      'NOTAS_CREDITO_APLICADAS',
      'CUENTAS_COBRAR',
      'DESCUENTOS',
      'CLIENTES',
      'CUMPLEANEROS',
      'BIZCOCHO_ENCARGO'
    ]
  },
  {
    id: 'inventario',
    titulo: 'Inventario',
    icono: 'box-open',
    orden: 3,
    modulos: [
      'CATEGORIAS',
      'PRODUCTOS',
      'ALMACENES',
      'MOVIMIENTO_INVENTARIO',
      'REPORTE_PERDIDAS'
    ]
  },
  {
    id: 'compras',
    titulo: 'Compras',
    icono: 'truck',
    orden: 4,
    modulos: [
      'PROVEEDORES',
      'ORDENES_COMPRA',
      'FACTURAS_COMPRA',
      'ANALISIS_COMPRAS_PRODUCTO',
      'REPORTE_606',
      'CUENTAS_PAGAR_PROVEEDOR'
    ]
  },
  {
    id: 'finanzas',
    titulo: 'Finanzas y Caja',
    icono: 'wallet',
    orden: 5,
    modulos: [
      'LISTADO_CAJA',
      'MOVIMIENTO_CAJA',
      'CIERRE_CAJA',
      'CUENTAS_FINANCIERAS',
      'MOVIMIENTO_FINANCIERO',
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
    orden: 6,
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
    titulo: 'Salón y Servicios',
    icono: 'layer-group',
    orden: 6,
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
    orden: 7,
    modulos: [
      'DOCUMENTOS_CLINICOS',
      'HISTORIAL_SERVICIOS'
    ]
  },
  {
    id: 'lavado',
    titulo: 'Lavado de Vehículos',
    icono: 'tint',
    orden: 8,
    modulos: ['CONSUMO_LAVADORES']
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    icono: 'chart-line',
    orden: 9,
    modulos: [
      'REPORTE_VENTA',
      'REPORTE_SERVICIOS',
      'REPORTE_COMISIONES',
      'REPORTE_607',
      'REPORTE_606',
      'ACTIVOS_FIJOS',
      'REPORTE_PRODUCTOS',
      'REPORTE_PROVEEDORES',
      'REPORTE_CLIENTES',
      'REPORTE_EMPLEADOS'
    ]
  },
  {
    id: 'configuracion',
    titulo: 'Configuración',
    icono: 'cog',
    orden: 10,
    modulos: [
      'EMPRESA',
      'PARAMETROS',
      'NCF_SECUENCIAS',
      'EMPLEADOS',
      'USUARIOS',
      'PERFILES'
    ]
  }
];

export const MENU_GRUPO_OTROS: MenuGrupoConfig = {
  id: 'otros',
  titulo: 'Otros',
  icono: 'ellipsis-h',
  orden: 99,
  modulos: []
};
