/* =========================================
🔥 MOVIMIENTO FINANCIERO MODEL
src/app/models/movimiento-financiero.ts
========================================= */

export interface MovimientoFinanciero {

  idMovimientoFinanciero:number;

  idEmpresa:number;

  idUsuario:number;

  idCuentaOrigen?:number;

  idCuentaDestino?:number;

  tipoMovimiento:string;
  /*
    ENTRADA
    SALIDA
    TRANSFERENCIA
  */

  categoria?:string;

  referenciaId?:number;

  referenciaTipo?:string;

  monto:number;

  balanceAnteriorOrigen?:number;

  balanceNuevoOrigen?:number;

  balanceAnteriorDestino?:number;

  balanceNuevoDestino?:number;

  motivo?:string;

  observacion?:string;

  fechaMovimiento?:Date;

  cuentaOrigen?:any;

  cuentaDestino?:any;
}