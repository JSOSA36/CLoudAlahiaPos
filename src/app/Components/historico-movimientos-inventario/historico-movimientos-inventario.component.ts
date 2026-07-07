import {
  Component, 
  OnInit
} from '@angular/core';
import {
  ModalController
} from '@ionic/angular';

import {
  MovimientosInventario
} from 'src/app/models/MovimientosInventario.models';

import { MovimientosInventarioComponent } from '../movimientos-inventario/movimientos-inventario.component';
import {
  MovimientosInventarioService
} from 'src/app/servicios/MovimientosInventarioService.models';

@Component({
  selector:
    'app-historico-movimientos-inventario',

  templateUrl:
    './historico-movimientos-inventario.component.html',

  styleUrls:
    ['./historico-movimientos-inventario.component.scss'],
})
export class
HistoricoMovimientosInventarioComponent
implements OnInit {

  // ======================================================
  // 🔥 LISTADO
  // ======================================================

  movimientos:
    MovimientosInventario[] = [];

  // ======================================================
  // 🔥 FILTROS
  // ======================================================

  desde: string = '';

  hasta: string = '';

  tipoMovimiento: string = '';

  motivo: string = '';

  idUsuario?: number;

  // ======================================================
  // 🔥 LOADING
  // ======================================================

  loading: boolean = false;

  // ======================================================
  // 🔥 CONSTRUCTOR
  // ======================================================

  constructor(

    private movimientosService:
      MovimientosInventarioService,
       private modalCtrl:
    ModalController
  ) { }
// ======================================================
// 🔥 NUEVO MOVIMIENTO
// ======================================================

async nuevoMovimiento()
{

  const modal =
    await this.modalCtrl
    .create({

      component:
        MovimientosInventarioComponent,

      cssClass:
        'modal-full'
    });

  await modal.present();

  // ==========================================
  // 🔥 REFRESH
  // ==========================================

  const {
    data
  } =
  await modal.onDidDismiss();

  if (data) {

    this.buscar();
  }
}
  // ======================================================
  // 🔥 INIT
  // ======================================================

  ngOnInit(): void {

    this.buscar();
  }

  // ======================================================
  // 🔥 BUSCAR
  // ======================================================

  buscar(): void {

    const empresa =
      Number(
        localStorage.getItem(
          'IdEmpresa'
        )
      );

    this.loading = true;

    this.movimientosService
      .FiltrarHistorial(

        empresa,

        this.desde,

        this.hasta,

        this.tipoMovimiento,

        this.motivo,

        this.idUsuario
      )
      .subscribe({

        next: (resp) => {

          this.loading = false;

          this.movimientos =
            resp;
        },

        error: (err) => {

          this.loading = false;

          console.log(err);
        }
      });
  }

  // ======================================================
  // 🔥 LIMPIAR
  // ======================================================

  limpiarFiltros(): void {

    this.desde = '';

    this.hasta = '';

    this.tipoMovimiento = '';

    this.motivo = '';

    this.idUsuario = undefined;

    this.buscar();
  }

  // ======================================================
  // 🔥 TOTAL ITEMS
  // ======================================================

  get totalMovimientos(): number {

    return this.movimientos.length;
  }
}