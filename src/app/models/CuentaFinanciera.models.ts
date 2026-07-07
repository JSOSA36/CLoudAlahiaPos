/* =========================================
🔥 CUENTA FINANCIERA MODEL
src/app/models/cuenta-financiera.ts
========================================= */

export interface CuentaFinanciera {

  idCuentaFinanciera:number;

  idEmpresa:number;

  nombre:string;

  tipoCuenta:string;
  /*
    CAJA
    BANCO
    TARJETA
  */

  banco?:string;

  numeroCuenta?:string;

  balanceInicial:number;

  activa:boolean;

  color?:string;

  icono?:string;

  fechaCreacion?:Date;
}