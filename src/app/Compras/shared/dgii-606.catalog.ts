/** Catálogos Formato 606 DGII (NG 07-2018 / 05-2019) — códigos oficiales. */

export interface CatalogoDgiiItem {
  codigo: number;
  etiqueta: string;
}

/** Tipo de Bienes y Servicios Comprados (campo 3 del 606). */
export const TIPOS_BIENES_SERVICIOS_606: CatalogoDgiiItem[] = [
  { codigo: 1, etiqueta: '01 - Gastos de personal' },
  { codigo: 2, etiqueta: '02 - Gastos por trabajos, suministros y servicios' },
  { codigo: 3, etiqueta: '03 - Arrendamientos' },
  { codigo: 4, etiqueta: '04 - Gastos de activos fijos' },
  { codigo: 5, etiqueta: '05 - Gastos de representación' },
  { codigo: 6, etiqueta: '06 - Otras deducciones admitidas' },
  { codigo: 7, etiqueta: '07 - Gastos financieros' },
  { codigo: 8, etiqueta: '08 - Gastos extraordinarios' },
  { codigo: 9, etiqueta: '09 - Compras y gastos que formarán parte del costo de venta' },
  { codigo: 10, etiqueta: '10 - Adquisiciones de activos' },
  { codigo: 11, etiqueta: '11 - Gastos de seguros' },
];

/** Forma de Pago DGII (campo 23 del 606). */
export const FORMAS_PAGO_606: CatalogoDgiiItem[] = [
  { codigo: 1, etiqueta: '01 - Efectivo' },
  { codigo: 2, etiqueta: '02 - Cheques / Transferencias / Depósito' },
  { codigo: 3, etiqueta: '03 - Tarjeta crédito / débito' },
  { codigo: 4, etiqueta: '04 - Compra a crédito' },
  { codigo: 5, etiqueta: '05 - Permuta' },
  { codigo: 6, etiqueta: '06 - Notas de crédito' },
  { codigo: 7, etiqueta: '07 - Mixto' },
];

/** Tipo de Retención en ISR (campo 17 del 606). */
export const TIPOS_RETENCION_ISR_606: CatalogoDgiiItem[] = [
  { codigo: 1, etiqueta: '01 - Alquileres' },
  { codigo: 2, etiqueta: '02 - Honorarios por servicios' },
  { codigo: 3, etiqueta: '03 - Otras rentas' },
  { codigo: 4, etiqueta: '04 - Otras rentas (rentas presuntas)' },
  { codigo: 5, etiqueta: '05 - Intereses pagados a personas jurídicas residentes' },
  { codigo: 6, etiqueta: '06 - Intereses pagados a personas físicas residentes' },
  { codigo: 7, etiqueta: '07 - Retención por proveedores del Estado' },
  { codigo: 8, etiqueta: '08 - Juegos telefónicos' },
  { codigo: 9, etiqueta: '09 - Retenciones subsector ganadería carne bovina' },
];

/** Destino del ITBIS pagado — Anexo A casillas 45–53 (IT-1 2020). */
export const DESTINOS_ITBIS_ANEXO_A: CatalogoDgiiItem[] = [
  { codigo: 1, etiqueta: '01 - No deducible: productores de bienes/servicios exentos' },
  { codigo: 2, etiqueta: '02 - No deducible: incluir en activos (categoría I)' },
  { codigo: 3, etiqueta: '03 - Otros ITBIS no deducibles' },
  { codigo: 4, etiqueta: '04 - Deducible: producción/venta bienes exportados' },
  { codigo: 5, etiqueta: '05 - Deducible: producción/venta bienes gravados' },
  { codigo: 6, etiqueta: '06 - Deducible: prestación de servicios gravados' },
  { codigo: 7, etiqueta: '07 - Sujeto a proporcionalidad (Art. 349)' },
];

/**
 * Nombres operativos que en AlahiaPOS significan cuenta bancaria /
 * transferencia / depósito (aunque digan solo "POPULAR", "BHD", etc.).
 * Se reportan en 606 como código 2.
 */
const BANCOS_O_TRANSFERENCIA = [
  'POPULAR',
  'BANRESERVAS',
  'BHD',
  'BILLET',
  'APAP',
  'SCOTIABANK',
  'SCOTIA',
  'SANTA CRUZ',
  'PROMERICA',
  'CITI',
  'CITIBANK',
  'LOPE DE VEGA',
  'LOPEDEVEGA',
  'QIK',
  'ASOCIACION',
  'ASOCIACIÓN',
  'BANCO',
  'ACH',
  'WIRE',
];

const PALABRAS_TRANSFERENCIA = [
  'TRANSF',
  'TRANSFER',
  'DEPOSITO',
  'DEPÓSITO',
  'CHEQUE',
  'CHECK',
  'CUENTA',
];

export function etiquetaFormaPagoDgii(codigo: number | null | undefined): string {
  if (!codigo) {
    return '—';
  }
  return FORMAS_PAGO_606.find(f => f.codigo === codigo)?.etiqueta
    ?? `Código ${codigo}`;
}

/**
 * Mapea la forma de pago operativa del ERP → código oficial DGII 606.
 *
 * Operativo (interno): EFECTIVO, TARJETA, POPULAR, BHD, BANRESERVAS...
 * Fiscal (DGII): solo 1–7.
 *
 * Regla:
 * - Crédito → 4
 * - Efectivo / cash → 1
 * - Tarjeta → 3
 * - Bancos / transferencias / cheques / depósitos → 2
 * - Permuta / NC / Mixto si el nombre lo indica
 * - Desconocido: 2 si parece banco, si no 1
 */
export function sugerirFormaPagoDgii(
  condicion: string,
  metodoOperativo?: string
): number {
  if ((condicion || '').toLowerCase() === 'credito') {
    return 4;
  }

  const m = normalizarMetodo(metodoOperativo);

  if (!m) {
    return 1;
  }

  if (m.includes('MIXTO')) {
    return 7;
  }
  if (m.includes('PERMUT')) {
    return 5;
  }
  if ((m.includes('NOTA') && m.includes('CREDITO')) || m.includes('NOTA CRED')) {
    return 6;
  }

  if (
    m.includes('TARJETA')
    || m.includes('CARD')
    || m.includes('VISA')
    || m.includes('MASTERCARD')
    || m.includes('AMEX')
  ) {
    return 3;
  }

  if (
    m.includes('EFECTIVO')
    || m.includes('CASH')
    || m === 'CAJA'
    || m.includes('CAJA CHICA')
  ) {
    return 1;
  }

  if (esTransferenciaOBanco(m)) {
    return 2;
  }

  // Contado con método desconocido: no asumir efectivo si parece nombre de producto bancario corto
  return 1;
}

function normalizarMetodo(metodo?: string): string {
  return (metodo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function esTransferenciaOBanco(m: string): boolean {
  if (PALABRAS_TRANSFERENCIA.some(p => m.includes(p))) {
    return true;
  }
  return BANCOS_O_TRANSFERENCIA.some(b => m.includes(b));
}
