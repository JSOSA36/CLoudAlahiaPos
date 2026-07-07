import {
  Component,
  OnInit
} from '@angular/core';

import {
  ToastController
} from '@ionic/angular';

import { productos }
from 'src/app/models/productos';

import {
  MovimientosInventario
} from 'src/app/models/MovimientosInventario.models';

import {
  MovimientosInventarioDetalle,
  
} from 'src/app/models/MovimientosInventarioDetalle.models';

import {
  ProductosService
} from 'src/app/servicios/productos.service';
import {
  ModalController
} from '@ionic/angular';
import {
  MovimientosInventarioService
} from 'src/app/servicios/MovimientosInventarioService.models';

@Component({
  selector: 'app-movimientos-inventario',
  templateUrl:
    './movimientos-inventario.component.html',
  styleUrls:
    ['./movimientos-inventario.component.scss'],
})
export class MovimientosInventarioComponent
  implements OnInit {

  // ======================================================
  // 🔥 MOVIMIENTO
  // ======================================================

  movimiento =
    new MovimientosInventario();

  // ======================================================
  // 🔥 PRODUCTOS
  // ======================================================

  productos: productos[] = [];

  productosFiltrados:
    productos[] = [];

  productoSeleccionado:
    productos = new productos();

  // ======================================================
  // 🔥 DETALLE
  // ======================================================

  cantidad: number = 1;

  precio: number = 0;

  filtro: string = '';

  // ======================================================
  // 🔥 LOADING
  // ======================================================

  loading: boolean = false;

  // ======================================================
  // 🔥 CONSTRUCTOR
  // ======================================================

  constructor(

    private productosService:
      ProductosService,

    private movimientosService:
      MovimientosInventarioService,

    private toastController:
      ToastController,
      private modalCtrl:
    ModalController
  ) { }

  // ======================================================
  // 🔥 INIT
  // ======================================================
// ======================================================
// 🔥 CERRAR MODAL
// ======================================================

cerrarModal(): void {

  this.modalCtrl.dismiss();
}
  ngOnInit(): void {

    this.cargarProductos();

    // =============================================
    // 🔥 DEFAULTS
    // =============================================

    this.movimiento.tipoMovimiento =
      'ENTRADA';

    this.movimiento.motivo =
      'COMPRA';
  }

  // ======================================================
  // 🔥 CARGAR PRODUCTOS
  // ======================================================

  cargarProductos(): void {

    const empresa =
      Number(
        localStorage.getItem(
          'IdEmpresa'
        )
      );

    this.productosService
      .GetProductos(
        empresa
      )
      .subscribe({

        next: (data) => {

          this.productos = data;

          this.productosFiltrados =
            data;
        },

        error: (err) => {

          console.log(err);
        }
      });
  }

  // ======================================================
  // 🔥 FILTRAR PRODUCTOS
  // ======================================================

  filtrarProductos(): void {

    const texto =
      this.filtro
        .trim()
        .toLowerCase();

    this.productosFiltrados =
      this.productos.filter(x =>

        (x.nombre || '')
          .toLowerCase()
          .includes(texto)
      );
  }

  // ======================================================
  // 🔥 SELECCIONAR PRODUCTO
  // ======================================================

  seleccionarProducto(
    item: productos
  ): void {

    this.productoSeleccionado =
      item;

    this.precio =
      item.precioCompra || 0;

    this.filtro =
      item.nombre || '';

    this.productosFiltrados = [];
  }

  // ======================================================
  // 🔥 AGREGAR PRODUCTO
  // ======================================================

  agregarProducto(): void {

    // =============================================
    // 🔥 VALIDAR PRODUCTO
    // =============================================

    if (
      !this.productoSeleccionado
        .idProducto
    ) {

      this.showToast(
        'Seleccione un producto'
      );

      return;
    }

    // =============================================
    // 🔥 VALIDAR CANTIDAD
    // =============================================

    if (this.cantidad <= 0) {

      this.showToast(
        'Cantidad inválida'
      );

      return;
    }

    // =============================================
    // 🔥 STOCK ACTUAL
    // =============================================

    const actual =
      Number(
        this.productoSeleccionado
          .cantidad || 0
      );

    let nuevo =
      actual;

    // =============================================
    // 🔥 ENTRADA
    // =============================================

    if (
      this.movimiento
        .tipoMovimiento
      === 'ENTRADA'
    ) {

      nuevo =
        actual +
        this.cantidad;
    }

    // =============================================
    // 🔥 SALIDA
    // =============================================

    else {

      nuevo =
        actual -
        this.cantidad;

      if (nuevo < 0) {

        this.showToast(
          'Stock insuficiente'
        );

        return;
      }
    }

    // =============================================
    // 🔥 DETALLE
    // =============================================

    const detalle =
      new MovimientosInventarioDetalle();

    detalle.idProducto =
      this.productoSeleccionado
        .idProducto;

    detalle.producto =
      this.productoSeleccionado;

    detalle.cantidad =
      this.cantidad;

    detalle.precio =
      this.precio;

    detalle.subTotal =
      this.cantidad *
      this.precio;

    detalle.stockAnterior =
      actual;

    detalle.stockNuevo =
      nuevo;

    // =============================================
    // 🔥 AGREGAR
    // =============================================

    this.movimiento
      .detalles
      .push(detalle);

    // =============================================
    // 🔥 RESET
    // =============================================

    this.productoSeleccionado =
      new productos();

    this.cantidad = 1;

    this.precio = 0;

    this.filtro = '';

    this.productosFiltrados =
      [];
  }

  // ======================================================
  // 🔥 ELIMINAR DETALLE
  // ======================================================

  eliminarDetalle(
    index: number
  ): void {

    this.movimiento
      .detalles
      .splice(index, 1);
  }

  // ======================================================
  // 🔥 TOTAL PRODUCTOS
  // ======================================================

  get totalProductos(): number {

    return this.movimiento
      .detalles
      .length;
  }

  // ======================================================
  // 🔥 TOTAL GENERAL
  // ======================================================

  get totalGeneral(): number {

    return this.movimiento
      .detalles
      .reduce((a, b) =>

        a +
        Number(b.subTotal || 0),

        0
      );
  }

  // ======================================================
  // 🔥 GUARDAR
  // ======================================================

guardarMovimiento(): void {

  // =============================================
  // 🔥 VALIDAR
  // =============================================

  if (
    !this.movimiento
      .detalles
      .length
  ) {

    this.showToast(
      'Debe agregar productos'
    );

    return;
  }

  // =============================================
  // 🔥 EMPRESA
  // =============================================

  this.movimiento.idEmpresa =
    Number(
      localStorage.getItem(
        'IdEmpresa'
      )
    );

  // =============================================
  // 🔥 USUARIO
  // =============================================

  this.movimiento.idUsuario =
    Number(
      localStorage.getItem(
        'IdUsuario'
      )
    );

  // =============================================
  // 🔥 DTO LIMPIO
  // =============================================

  const payload = {

    tipoMovimiento:
      this.movimiento
        .tipoMovimiento,

    motivo:
      this.movimiento
        .motivo,

    referencia:
      this.movimiento
        .referencia,

    observacion:
      this.movimiento
        .observacion,

    idEmpresa:
      this.movimiento
        .idEmpresa,

    idUsuario:
      this.movimiento
        .idUsuario,

    activo: true,

    detalles:

      this.movimiento
        .detalles
        .map(x => ({

          idProducto:
            x.idProducto,

          cantidad:
            x.cantidad,

          precio:
            x.precio,

          subTotal:
            x.subTotal,

          stockAnterior:
            x.stockAnterior,

          stockNuevo:
            x.stockNuevo,

          observacion:
            x.observacion
        }))
  };

  // =============================================
  // 🔥 SAVE
  // =============================================

  this.loading = true;

  this.movimientosService
    .GuardarMovimiento(
      payload as any
    )
    .subscribe({

      next: () => {

        this.loading = false;

        this.showToast(
          'Movimiento guardado'
        );

        // =====================================
        // 🔥 CERRAR MODAL
        // =====================================

        this.modalCtrl.dismiss(true);

        // =====================================
        // 🔥 RESET
        // =====================================

        this.movimiento =
          new MovimientosInventario();

        this.movimiento
          .tipoMovimiento =
          'ENTRADA';

        this.movimiento
          .motivo =
          'COMPRA';

        this.productoSeleccionado =
          new productos();

        this.cantidad = 1;

        this.precio = 0;

        this.filtro = '';

        this.productosFiltrados = [];
      },

      error: (err) => {

        this.loading = false;

        console.log(err);

        this.showToast(
          'Error guardando'
        );
      }
    });
}
  // ======================================================
  // 🔥 TOAST
  // ======================================================

  async showToast(
    message: string
  ): Promise<void> {

    const toast =
      await this.toastController
        .create({

          message,

          duration: 2000,

          position: 'bottom'
        });

    await toast.present();
  }
}