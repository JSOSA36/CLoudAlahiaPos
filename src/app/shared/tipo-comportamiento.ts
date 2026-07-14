/**
 * Comportamiento ERP en compras/contabilidad.
 * Independiente de EsServicio (naturaleza comercial: Producto vs Servicio).
 */
export const TIPO_COMPORTAMIENTO = {
  INVENTARIO: 'Inventario',
  SERVICIO: 'Servicio',
  GASTO: 'Gasto',
  ACTIVO_FIJO: 'ActivoFijo',
} as const;

export type TipoComportamiento =
  typeof TIPO_COMPORTAMIENTO[keyof typeof TIPO_COMPORTAMIENTO];

export interface TipoComportamientoOpcion {
  value: TipoComportamiento;
  label: string;
  descripcion: string;
}

export const TIPOS_COMPORTAMIENTO_OPCIONES: TipoComportamientoOpcion[] = [
  {
    value: TIPO_COMPORTAMIENTO.INVENTARIO,
    label: 'Inventario',
    descripcion: 'Entra a inventario al comprar (materia prima, mercancía, repuestos).'
  },
  {
    value: TIPO_COMPORTAMIENTO.SERVICIO,
    label: 'Servicio contratado',
    descripcion: 'Servicio comprado a proveedor (honorarios, mantenimiento externo).'
  },
  {
    value: TIPO_COMPORTAMIENTO.GASTO,
    label: 'Gasto',
    descripcion: 'Gasto operativo sin inventario (utilities, insumos, etc.).'
  },
  {
    value: TIPO_COMPORTAMIENTO.ACTIVO_FIJO,
    label: 'Activo fijo',
    descripcion: 'Maquinaria, equipos y mobiliario. Alta individual al recibir; no afecta inventario.'
  }
];

export function normalizarTipoComportamiento(valor?: string | null): TipoComportamiento {
  const v = (valor || '').trim().toLowerCase();
  const match = TIPOS_COMPORTAMIENTO_OPCIONES.find(
    o => o.value.toLowerCase() === v
  );
  return match?.value ?? TIPO_COMPORTAMIENTO.INVENTARIO;
}

export function etiquetaTipoComportamiento(valor?: string | null): string {
  const tipo = normalizarTipoComportamiento(valor);
  return TIPOS_COMPORTAMIENTO_OPCIONES.find(o => o.value === tipo)?.label ?? tipo;
}

export function claseBadgeTipoComportamiento(valor?: string | null): string {
  const map: Record<string, string> = {
    [TIPO_COMPORTAMIENTO.INVENTARIO]: 'tipo-inventario',
    [TIPO_COMPORTAMIENTO.SERVICIO]: 'tipo-servicio',
    [TIPO_COMPORTAMIENTO.GASTO]: 'tipo-gasto',
    [TIPO_COMPORTAMIENTO.ACTIVO_FIJO]: 'tipo-activo',
  };
  return map[normalizarTipoComportamiento(valor)] ?? 'tipo-inventario';
}

/** Solo para compras: no usa EsServicio. */
export function resolverComportamientoCompra(producto: {
  tipoComportamiento?: string;
  controlarStock?: boolean;
}): TipoComportamiento {
  if (producto.tipoComportamiento) {
    return normalizarTipoComportamiento(producto.tipoComportamiento);
  }
  if (producto.controlarStock) {
    return TIPO_COMPORTAMIENTO.INVENTARIO;
  }
  return TIPO_COMPORTAMIENTO.GASTO;
}

/** Valor por defecto al crear artículo según naturaleza comercial. */
export function defaultComportamientoParaNaturaleza(esServicio: boolean, controlarStock: boolean): TipoComportamiento {
  if (controlarStock && !esServicio) {
    return TIPO_COMPORTAMIENTO.INVENTARIO;
  }
  return TIPO_COMPORTAMIENTO.GASTO;
}

export function requiereAlmacen(tipo?: string | null): boolean {
  return normalizarTipoComportamiento(tipo) === TIPO_COMPORTAMIENTO.INVENTARIO;
}

/** True si el tipo no debe entrar al valor de inventario de almacén. */
export function esActivoFijo(tipo?: string | null): boolean {
  return normalizarTipoComportamiento(tipo) === TIPO_COMPORTAMIENTO.ACTIVO_FIJO;
}
