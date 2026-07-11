// ======================================================
// 🔥 MOVIMIENTOS INVENTARIO
// ======================================================

import {
  MovimientosInventarioDetalle
} from './MovimientosInventarioDetalle.models';
import { usuarios } from './usuarios';

export class MovimientosInventario {

  // =========================================
  // 🔥 ID
  // =========================================

  id: number = 0;

  // =========================================
  // 🔥 ENTRADA / SALIDA
  // =========================================

  tipoMovimiento: string = 'ENTRADA';
  usuario: usuarios = new usuarios();
  nombreUsuario?: string;
  // =========================================
  // 🔥 MOTIVO
  // =========================================

  motivo: string = 'COMPRA';

  // =========================================
  // 🔥 REFERENCIA
  // =========================================

  referencia: string = '';

  // =========================================
  // 🔥 OBSERVACION
  // =========================================

  observacion: string = '';

  // =========================================
  // 🔥 FECHA
  // =========================================

  fecha: Date = new Date();

  // =========================================
  // 🔥 USUARIO
  // =========================================

  idUsuario: number = 0;

  // =========================================
  // 🔥 EMPRESA
  // =========================================

  idEmpresa: number = 0;

  idAlmacen: number = 0;

  idAlmacenDestino: number = 0;

  nombreAlmacen?: string;

  nombreAlmacenDestino?: string;

  // =========================================
  // 🔥 ACTIVO
  // =========================================

  activo: boolean = true;

  // =========================================
  // 🔥 DETALLES
  // =========================================

  detalles:
    MovimientosInventarioDetalle[] = [];
}