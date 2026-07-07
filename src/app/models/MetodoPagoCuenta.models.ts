/* =========================================
🔥 METODO PAGO CUENTA MODEL
src/app/models/metodo-pago-cuenta.ts
========================================= */

export interface MetodoPagoCuenta {

  idMetodoPagoCuenta:number;

  idEmpresa:number;

  metodoPago:string;

  idCuentaFinanciera:number;

  activo:boolean;

  cuentaFinanciera?:any;
}