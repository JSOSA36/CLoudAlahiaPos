// ======================================================
// 🔥 MOVIMIENTOS INVENTARIO DETALLE
// ======================================================

import {productos as Productos} from './productos';

export class MovimientosInventarioDetalle {

  // =========================================
  // 🔥 ID
  // =========================================

  id: number = 0;

  // =========================================
  // 🔥 MOVIMIENTO
  // =========================================

  idMovimientoInventario: number = 0;

  // =========================================
  // 🔥 PRODUCTO
  // =========================================

  idProducto: number = 0;

  producto?: Productos;

  // =========================================
  // 🔥 CANTIDAD
  // =========================================

  cantidad: number = 1;

  // =========================================
  // 🔥 STOCK ANTERIOR
  // =========================================

  stockAnterior: number = 0;

  // =========================================
  // 🔥 STOCK NUEVO
  // =========================================

  stockNuevo: number = 0;

  // =========================================
  // 🔥 PRECIO
  // =========================================

  precio: number = 0;

  // =========================================
  // 🔥 SUBTOTAL
  // =========================================

  subTotal: number = 0;

  // =========================================
  // 🔥 OBSERVACION
  // =========================================

  observacion: string = '';

  /** Línea de OrdenCompraDetalle cuando es recepción desde compra. */
  idOrdenCompraDetalle?: number;

  /** Tope de recepción (cantidad pendiente de la factura). */
  cantidadMaxima?: number;

  // =========================================
  // 🔥 FECHA
  // =========================================

  fecha: Date = new Date();
}