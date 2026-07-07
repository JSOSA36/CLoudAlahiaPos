import {
  Component,
  OnInit
} from '@angular/core';

import {
  ModalController
} from '@ionic/angular';

import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

import {
  MovimientoFinancieroService
} from 'src/app/servicios/movimiento-financiero.service';

import {
  CuentaFinancieraService
} from 'src/app/servicios/cuenta-financiera.service';

import {
  ModalTransferenciaFinancieraComponent
} from '../modal-transferencia-financiera/modal-transferencia-financiera.component';

@Component({
  selector: 'app-movimientos-financieros',

  templateUrl:
    './movimientos-financieros.component.html',

  styleUrls:
    ['./movimientos-financieros.component.scss'],
})
export class MovimientosFinancierosComponent
implements OnInit {

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  cargando = false;

  movimientos:any[] = [];

  movimientosFiltrados:any[] = [];

  cuentas:any[] = [];

  /* =====================================
  🔥 FILTROS
  ====================================== */

  fechaDesde =

    new Date()
    .toISOString()
    .split('T')[0];

  fechaHasta =

    new Date()
    .toISOString()
    .split('T')[0];

  idCuenta:number | null = null;

  tipoMovimiento = '';

  search = '';

  /* =====================================
  🔥 DASHBOARD
  ====================================== */

  totalEntradas = 0;

  totalSalidas = 0;

  totalTransferencias = 0;

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private movimientoService:
      MovimientoFinancieroService,

    private cuentaService:
      CuentaFinancieraService,

    private parametros:
      ParametrosService,

    private modalCtrl:
      ModalController

  ){}

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit(): void {

    this.CargarCuentas();

    this.CargarMovimientos();
  }

  /* =====================================
  🔥 CUENTAS
  ====================================== */

  CargarCuentas(): void {

    this.cuentaService
    .getByEmpresa(

      this.parametros
      .GetIdEmpresa()

    )
    .subscribe({

      next:(resp:any[])=>{

        this.cuentas =
          resp;
      },

      error:(err)=>{

        console.error(err);
      }
    });
  }

  /* =====================================
  🔥 MOVIMIENTOS
  ====================================== */

  CargarMovimientos(): void {

    this.cargando = true;

    this.movimientoService
    .getByFecha(

      this.parametros
      .GetIdEmpresa(),

      this.fechaDesde,

      this.fechaHasta

    )
    .subscribe({

      next:(resp:any[])=>{

        console.log(
          'MOVIMIENTOS:',
          resp
        );

        this.movimientos =
          resp;

        this.movimientosFiltrados =
          resp;

        this.CalcularTotales();

        this.cargando = false;
      },

      error:(err)=>{

        console.error(err);

        this.cargando = false;
      }
    });
  }

  /* =====================================
  🔥 CALCULAR
  ====================================== */

  CalcularTotales(): void {

    this.totalEntradas =

      this.movimientosFiltrados
      .filter(

        x =>

          x.tipoMovimiento
          ===
          'ENTRADA'
      )
      .reduce(

        (acc,item)=>

          acc + item.monto,

        0
      );

    this.totalSalidas =

      this.movimientosFiltrados
      .filter(

        x =>

          x.tipoMovimiento
          ===
          'SALIDA'
      )
      .reduce(

        (acc,item)=>

          acc + item.monto,

        0
      );

    this.totalTransferencias =

      this.movimientosFiltrados
      .filter(

        x =>

          x.tipoMovimiento
          ===
          'TRANSFERENCIA'
      )
      .reduce(

        (acc,item)=>

          acc + item.monto,

        0
      );
  }

  /* =====================================
  🔥 FILTRAR
  ====================================== */

  Filtrar(): void {

    let data =

      [...this.movimientos];

    /* =====================================
    🔥 CUENTA
    ====================================== */

    if(this.idCuenta){

      data = data.filter(

        x =>

          x.idCuentaOrigen
          ===
          this.idCuenta

          ||

          x.idCuentaDestino
          ===
          this.idCuenta
      );
    }

    /* =====================================
    🔥 TIPO
    ====================================== */

    if(this.tipoMovimiento){

      data = data.filter(

        x =>

          x.tipoMovimiento
          ===
          this.tipoMovimiento
      );
    }

    /* =====================================
    🔥 SEARCH
    ====================================== */

    if(this.search){

      const txt =

        this.search
        .toLowerCase()
        .trim();

      data = data.filter(

        x =>

          x.motivo
          ?.toLowerCase()
          .includes(txt)

          ||

          x.observacion
          ?.toLowerCase()
          .includes(txt)

          ||

          x.categoria
          ?.toLowerCase()
          .includes(txt)
      );
    }

    this.movimientosFiltrados =
      data;

    this.CalcularTotales();
  }

  /* =====================================
  🔥 NUEVA TRANSFERENCIA
  ====================================== */

  async NuevaTransferencia(){

    const modal =

      await this.modalCtrl
      .create({

        component:
          ModalTransferenciaFinancieraComponent,

        cssClass:
          'modal-700'
      });

    modal.onDidDismiss()
    .then((resp)=>{

      if(resp.data){

        this.CargarMovimientos();
      }
    });

    await modal.present();
  }

  /* =====================================
  🔥 GET ICONO
  ====================================== */

  GetIcono(
    tipo:string
  ): string {

    switch(tipo){

      case 'ENTRADA':
        return 'arrow-down-outline';

      case 'SALIDA':
        return 'arrow-up-outline';

      case 'TRANSFERENCIA':
        return 'swap-horizontal-outline';

      default:
        return 'wallet-outline';
    }
  }

  /* =====================================
  🔥 GET COLOR
  ====================================== */

  GetColor(
    tipo:string
  ): string {

    switch(tipo){

      case 'ENTRADA':
        return '#22c55e';

      case 'SALIDA':
        return '#ef4444';

      case 'TRANSFERENCIA':
        return '#2563eb';

      default:
        return '#64748b';
    }
  }

  /* =====================================
  🔥 GET NOMBRE CUENTA
  ====================================== */

  GetNombreCuenta(
    id:number
  ): string {

    const cuenta =

      this.cuentas.find(

        x =>

          x.idCuentaFinanciera
          ===
          id
      );

    return cuenta?.nombre || '';
  }
}