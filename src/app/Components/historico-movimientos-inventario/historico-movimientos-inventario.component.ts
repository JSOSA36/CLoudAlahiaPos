import {
  Component, 
  OnInit
} from '@angular/core';
import {
  ModalController
} from '@ionic/angular';
import { Router } from '@angular/router';

import {
  MovimientosInventario
} from 'src/app/models/MovimientosInventario.models';

import { MovimientosInventarioComponent } from '../movimientos-inventario/movimientos-inventario.component';
import {
  MovimientosInventarioService
} from 'src/app/servicios/MovimientosInventarioService.models';

import { PrintService }
from 'src/app/servicios/print.services';

import { ParametrosService }
from 'src/app/servicios/parametros.service';

import { ProductosService }
from 'src/app/servicios/productos.service';

import { productos }
from 'src/app/models/productos';

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

  idProducto: number = 0;

  filtroProducto: string = '';

  productosFiltrados: productos[] = [];

  productos: productos[] = [];

  idUsuario?: number;

  idSucursalFiltro = 0;

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
      ModalController,

    private printService:
      PrintService,

    private parametros:
      ParametrosService,

    private productosService:
      ProductosService,

    private router:
      Router
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

  if (data?.refresh) {

    this.buscar();
  }

  if (data?.imprimir) {

    await this.printService
      .openMovimientoInventarioCarta(
        data.imprimir
      );
  }
}
  // ======================================================
  // 🔥 INIT
  // ======================================================

  ngOnInit(): void {

    this.cargarProductos();

    this.buscar();
  }

  cargarProductos(): void {

    this.productosService
      .GetProductos(
        this.parametros.GetIdEmpresa()
      )
      .subscribe({

        next: (data) => {

          this.productos =
            (data || [])
              .filter(
                p => !p.esServicio
              )
              .sort((a, b) =>
                (a.nombre || '')
                  .localeCompare(
                    b.nombre || ''
                  )
              );
        },

        error: (err) => {

          console.log(err);
        }
      });
  }

  filtrarProductos(): void {

    const texto =
      this.filtroProducto
        .trim()
        .toLowerCase();

    if (!texto) {

      this.idProducto = 0;

      this.productosFiltrados = [];

      return;
    }

    this.idProducto = 0;

    this.productosFiltrados =
      this.productos
        .filter(p =>

          (p.nombre || '')
            .toLowerCase()
            .includes(texto)

          ||

          (p.codigoBarra || '')
            .toLowerCase()
            .includes(texto)
        )
        .slice(0, 25);
  }

  seleccionarProducto(
    item: productos
  ): void {

    this.idProducto =
      item.idProducto;

    this.filtroProducto =
      item.nombre || '';

    this.productosFiltrados = [];

    this.buscar();
  }

  limpiarProductoFiltro(): void {

    this.idProducto = 0;

    this.filtroProducto = '';

    this.productosFiltrados = [];

    this.buscar();
  }

  onFiltroSucursal(id: number): void {
    const next = Number(id) || 0;
    if (next === this.idSucursalFiltro) return;
    this.idSucursalFiltro = next;
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

        this.idUsuario,

        this.idProducto > 0
          ? this.idProducto
          : undefined,
        this.idSucursalFiltro
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

    this.idProducto = 0;

    this.filtroProducto = '';

    this.productosFiltrados = [];

    this.idUsuario = undefined;

    this.buscar();
  }

  // ======================================================
  // 🔥 TOTAL ITEMS
  // ======================================================

  get totalMovimientos(): number {

    return this.movimientos.length;
  }

  imprimirMovimiento(
    item: MovimientosInventario
  ): void {

    this.printService
      .openMovimientoInventarioCarta(item);
  }

  abrirReportePerdidas(): void {

    this.router.navigate(['/reporteperdidas']);
  }

  nombreUsuario(
    item: MovimientosInventario | any
  ): string {

    if (item?.nombreUsuario?.trim()) {

      return item.nombreUsuario.trim();
    }

    if (item?.NombreUsuario?.trim()) {

      return item.NombreUsuario.trim();
    }

    const usuario = item?.usuario;

    if (typeof usuario === 'string' && usuario.trim()) {

      return usuario.trim();
    }

    if (usuario?.nombre?.trim()) {

      return usuario.nombre.trim();
    }

    if (usuario?.userName?.trim()) {

      return usuario.userName.trim();
    }

    if (item?.Usuario?.trim()) {

      return item.Usuario.trim();
    }

    return this.parametros.UserName?.trim() || 'Usuario';
  }
}