/**
 * Configuración UI del documento de Compras.
 * Pantalla principal del módulo — preparada para crecer sin rediseño.
 */
export interface TipoDocumentoCompraOption {
  id: number;
  codigo: string;
  nombre: string;
  prefijoSecuencia: string;
  habilitado: boolean;
}

export interface MonedaOption {
  codigo: string;
  simbolo: string;
  nombre: string;
  habilitado: boolean;
}

export interface EstadoDocumentoCompraOption {
  codigo: string;
  etiqueta: string;
}

/** Catálogo de tipos de documento de compra (extensible). */
export const TIPOS_DOCUMENTO_COMPRA: TipoDocumentoCompraOption[] = [
  {
    id: 11,
    codigo: 'FACTC',
    nombre: 'Factura de compra',
    prefijoSecuencia: 'FACTC',
    habilitado: true
  },
  {
    id: 5,
    codigo: 'OC',
    nombre: 'Orden de compra',
    prefijoSecuencia: 'OC',
    habilitado: true
  },
  {
    id: 6,
    codigo: 'DEV',
    nombre: 'Devolución a suplidor',
    prefijoSecuencia: 'DEV',
    habilitado: false
  }
];

export const MONEDAS_COMPRA: MonedaOption[] = [
  { codigo: 'DOP', simbolo: 'RD$', nombre: 'Peso dominicano', habilitado: true },
  { codigo: 'USD', simbolo: 'US$', nombre: 'Dólar estadounidense', habilitado: false }
];

export const ESTADOS_DOCUMENTO_COMPRA: EstadoDocumentoCompraOption[] = [
  { codigo: 'BORRADOR', etiqueta: 'Borrador' },
  { codigo: 'EMITIDA', etiqueta: 'Emitida' },
  { codigo: 'ENVIADA', etiqueta: 'Enviada' },
  { codigo: 'FACTURADA', etiqueta: 'Facturada' },
  { codigo: 'CONFIRMADA', etiqueta: 'Confirmada' },
  { codigo: 'PARCIALMENTE_PAGADA', etiqueta: 'Parcialmente pagada' },
  { codigo: 'PAGADA', etiqueta: 'Pagada' },
  { codigo: 'ANULADA', etiqueta: 'Anulada' }
];

export const ESTADOS_ORDEN_COMPRA: EstadoDocumentoCompraOption[] = [
  { codigo: 'BORRADOR', etiqueta: 'Borrador' },
  { codigo: 'EMITIDA', etiqueta: 'Emitida' },
  { codigo: 'ENVIADA', etiqueta: 'Enviada al proveedor' },
  { codigo: 'FACTURADA', etiqueta: 'Facturada' },
  { codigo: 'ANULADA', etiqueta: 'Anulada' }
];

/**
 * Flags de UI: campos reservados visibles pero no operativos hasta activar en fases futuras.
 */
export const COMPRAS_DOC_UI = {
  /** Muestra slots de moneda, tipo doc extendido, tipo cambio, etc. */
  mostrarCamposReservados: true,
  /** Permite editar moneda (fase multi-moneda). */
  monedaEditable: false,
  /** Permite cambiar tipo de documento (fase OC / NC proveedor). */
  tipoDocumentoEditable: false,
  /** Permite cambiar estado manualmente (fase workflow). */
  estadoEditable: false,
  /** Muestra bloque financiero ampliado en resumen. */
  resumenFinancieroCompleto: true
};
