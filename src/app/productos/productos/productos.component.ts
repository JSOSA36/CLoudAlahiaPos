import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  AlertController,
  ToastController
} from '@ionic/angular';

import { ProductosAddComponent }
from 'src/app/ProductosAdd/productos-add/productosadd.component';

import { productos }
from 'src/app/models/productos';

import { ParametrosService }
from 'src/app/servicios/parametros.service';

import { ProductosService }
from 'src/app/servicios/productos.service';

import { AlmacenesService }
from 'src/app/servicios/almacenes.service';

import { ActivosFijosService }
from 'src/app/servicios/activos-fijos.service';

import {
  AlmacenExistenciaDetalle
} from 'src/app/models/almacen-existencia.model';

import { ResumenActivosFijos }
from 'src/app/models/activos-fijos.models';

import {
  normalizarTipoComportamiento,
  TIPO_COMPORTAMIENTO
} from 'src/app/shared/tipo-comportamiento';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {

  // =====================================
  // 🔥 LISTAS
  // =====================================

  ListadoProductos: productos[] = [];

  productosFiltrados: productos[] = [];

  // =====================================
  // 🔍 FILTROS
  // =====================================
mostrarStockBajo = false;
  filtro = '';
tipoOperacion = 'todos';
  mostrarServicios = false;

  mostrarProductos = false;

  // =====================================
  // 📄 PAGINADO
  // =====================================

  itemsToShow = 12;

  infiniteDisabled = false;

  cargando = true;

  existenciaModalAbierto = false;

  cargandoExistencia = false;

  productoExistenciaNombre = '';

  existenciaTotal = 0;

  existenciaDetalle: AlmacenExistenciaDetalle[] = [];

  resumenActivos: ResumenActivosFijos | null = null;

  // =====================================
  // 🔥 CONSTRUCTOR
  // =====================================

  constructor(

    private productoService: ProductosService,

    private activosFijosService: ActivosFijosService,

    private modalCtrl: ModalController,

    private alertCtrl: AlertController,

    private toastCtrl: ToastController,

    private parametro: ParametrosService,

    private almacenesService: AlmacenesService

  ) {}
toggleStockBajo(): void {

  this.mostrarStockBajo =
    !this.mostrarStockBajo;

  this.aplicarFiltros();
}

filtrarServicios(): void {

  this.mostrarServicios = true;

  this.mostrarProductos = false;

  this.aplicarFiltros();
}

filtrarProductos(): void {

  this.mostrarProductos = true;

  this.mostrarServicios = false;

  this.aplicarFiltros();
}
  // =====================================
  // 🚀 INIT
  // =====================================

  ngOnInit() {

    this.cargarProductos();
    this.cargarResumenActivos();
  }

  private cargarResumenActivos(): void {
    const idEmpresa = this.parametro.GetIdEmpresa();
    if (!idEmpresa) return;

    this.activosFijosService.resumen(idEmpresa).subscribe({
      next: (r) => { this.resumenActivos = r; },
      error: () => { this.resumenActivos = null; }
    });
  }

  // =====================================
  // 🔥 RESET PAGING
  // =====================================

  private resetPaging(): void {

    this.itemsToShow = Math.min(
      12,
      this.productosFiltrados.length
    );

    this.infiniteDisabled =
      this.itemsToShow >=
      this.productosFiltrados.length;
  }

  // =====================================
  // 🔥 FILTRO GENERAL
  // =====================================

  aplicarFiltros(): void {

    let lista = [...this.ListadoProductos];

    const texto =
      (this.filtro || '')
        .trim()
        .toLowerCase();

    if (texto) {

      lista = lista.filter(p =>

        (p.nombre || '')
          .toLowerCase()
          .includes(texto)

        ||

        (p.codigoBarra || '')
          .toLowerCase()
          .includes(texto)
      );
    }

    if (this.mostrarServicios) {

      lista = lista.filter(p =>
        !!p.esServicio
      );

    } else if (this.mostrarProductos) {

      lista = lista.filter(p =>
        !p.esServicio
      );
    }

    const operacion =
      (this.tipoOperacion || 'todos')
        .toUpperCase();

    if (operacion !== 'TODOS') {

      lista = lista.filter(p => {

        if (p.esServicio) {

          return operacion === 'VENTA';
        }

        const tipo =
          (p.tipoOperacion || '')
            .toUpperCase()
            .trim();

        return tipo === operacion;
      });
    }

    if (this.mostrarStockBajo) {

      lista = lista.filter(p =>

        !p.esServicio

        && p.controlarStock

        && Number(p.cantidad || 0)
          <= Number(p.stock || 0)
      );
    }

    this.productosFiltrados = lista;

    this.resetPaging();
  }

  // =====================================
  // 📄 LOAD MORE
  // =====================================

  loadMore(event?: any) {

    this.itemsToShow = Math.min(

      this.itemsToShow + 12,

      this.productosFiltrados.length
    );

    if (event?.target) {

      event.target.complete();

      if (
        this.itemsToShow >=
        this.productosFiltrados.length
      ) {

        event.target.disabled = true;

        this.infiniteDisabled = true;
      }

    } else {

      this.infiniteDisabled =

        this.itemsToShow >=
        this.productosFiltrados.length;
    }
  }

  // =====================================
  // 🔥 CARGAR PRODUCTOS
  // =====================================

  cargarProductos() {

    this.cargando = true;

    this.productoService
      .GetProductos(
        this.parametro.GetIdEmpresa()
      )
      .subscribe({
      
        next: (res) => {
console.log('Productos cargados:', res);
          this.ListadoProductos =
            res ?? [];

          this.aplicarFiltros();
          this.cargarResumenActivos();

          this.cargando = false;
        },

        error: async (err) => {

          console.error(
            'Error al cargar productos',
            err
          );

          this.cargando = false;

          const toast =
            await this.toastCtrl.create({

              message:
                'No se pudieron cargar los productos.',

              duration: 2000,

              color: 'danger',

              position: 'bottom',
            });

          toast.present();
        },
      });
  }

  // =====================================
  // ✏️ MODAL
  // =====================================

  async openModal(
    producto: productos | null
  ) {

    const modal =
      await this.modalCtrl.create({

        component:
          ProductosAddComponent,

        cssClass:
          'modal-producto-grande',

        componentProps: {
          producto
        },
      });

    await modal.present();

    await modal.onDidDismiss();

    this.cargarProductos();
  }

  // =====================================
  // 🗑️ ELIMINAR
  // =====================================

  async eliminarProducto(
    producto: productos
  ) {

    const alert =
      await this.alertCtrl.create({

        header: 'Confirmar',

        message:
          `¿Seguro que deseas eliminar el producto "${producto.nombre}"?`,

        buttons: [

          {
            text: 'Cancelar',
            role: 'cancel'
          },

          {
            text: 'Eliminar',

            role: 'destructive',

            handler: () =>
              this.confirmarEliminar(producto),
          },
        ],
      });

    await alert.present();
  }

  // =====================================
  // 🔥 CONFIRMAR ELIMINAR
  // =====================================

  private async confirmarEliminar(
    producto: productos
  ) {

    this.productoService
      .DeleteIten(producto.idProducto)
      .subscribe({

        next: async () => {

          this.ListadoProductos =
            this.ListadoProductos.filter(

              (p) =>
                p.idProducto !==
                producto.idProducto
            );

          this.aplicarFiltros();

          const toast =
            await this.toastCtrl.create({

              message:
                `Producto "${producto.nombre}" eliminado ✅`,

              duration: 2000,

              color: 'success',

              position: 'bottom',
            });

          toast.present();
        },

        error: async (err: any) => {
          const msg = err?.error?.message
            || 'Error al eliminar el producto';

          const toast =
            await this.toastCtrl.create({
              message: msg,
              duration: 3000,
              color: 'danger',
              position: 'bottom',
            });

          toast.present();
        },
      });
  }

  // =====================================
  // 🔥 TRACKBY
  // =====================================

  trackById(
    _i: number,
    item: productos
  ) {

    return item.idProducto;
  }

  abrirExistenciaPorAlmacen(
    producto: productos,
    event?: Event
  ): void {

    event?.stopPropagation();

    if (
      !producto.controlarStock
      ||
      producto.esServicio
    ) {
      return;
    }

    this.productoExistenciaNombre =
      producto.nombre || '';

    this.existenciaModalAbierto = true;

    this.cargandoExistencia = true;

    this.existenciaDetalle = [];

    this.existenciaTotal =
      Number(producto.cantidad || 0);

    this.almacenesService
      .getExistenciasPorProducto(
        producto.idProducto,
        this.parametro.GetIdEmpresa()
      )
      .subscribe({

        next: (res) => {

          this.existenciaTotal =
            Number(res?.total ?? 0);

          this.existenciaDetalle =
            res?.detalle ?? [];

          this.cargandoExistencia = false;
        },

        error: async () => {

          this.cargandoExistencia = false;

          const toast =
            await this.toastCtrl.create({

              message:
                'No se pudo cargar la existencia por almacén.',

              duration: 2000,

              color: 'danger',

              position: 'bottom',
            });

          toast.present();
        },
      });
  }

  cerrarExistenciaModal(): void {

    this.existenciaModalAbierto = false;
  }

  get resumenInventario(): {
    totalProductos: number;
    totalServicios: number;
    valorInventario: number;
  } {

    // Solo comportamiento Inventario (excluye ActivoFijo, servicios, etc.)
    const inventario =
      this.ListadoProductos
        .filter(p =>
          !p.esServicio
          && normalizarTipoComportamiento(p.tipoComportamiento)
            === TIPO_COMPORTAMIENTO.INVENTARIO
        );

    const servicios =
      this.ListadoProductos
        .filter(p => p.esServicio);

    let valorInventario = 0;

    for (const p of inventario) {

      const cantidad =
        Number(p.cantidad || 0);

      const costo =
        Number(p.precioCompra || 0);

      valorInventario +=
        costo * cantidad;
    }

    return {
      totalProductos: inventario.length,
      totalServicios: servicios.length,
      valorInventario,
    };
  }
}