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

  mostrarVenta = false;

  mostrarCompra = false;

  // =====================================
  // 📄 PAGINADO
  // =====================================

  itemsToShow = 12;

  infiniteDisabled = false;

  cargando = false;

  // =====================================
  // 🔥 CONSTRUCTOR
  // =====================================

  constructor(

    private productoService: ProductosService,

    private modalCtrl: ModalController,

    private alertCtrl: AlertController,

    private toastCtrl: ToastController,

    private parametro: ParametrosService

  ) {}
toggleStockBajo(): void {

  this.mostrarStockBajo =
    !this.mostrarStockBajo;

  this.aplicarFiltros();
}
  // =====================================
  // 🚀 INIT
  // =====================================

  ngOnInit() {

    this.cargarProductos();
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

aplicarFiltros(tipo?: string): void {

  // =====================================
  // 🔥 FILTROS PRINCIPALES
  // =====================================

  switch (tipo) {

    // =====================================
    // SERVICIOS
    // =====================================

    case 'servicios':

      this.mostrarServicios = true;

      this.mostrarProductos = false;

      break;

    // =====================================
    // PRODUCTOS
    // =====================================

    case 'productos':

      this.mostrarProductos = true;

      this.mostrarServicios = false;

      break;
  }

  // =====================================
  // 🔥 LISTA BASE
  // =====================================

  let lista = [...this.ListadoProductos];

  // =====================================
  // 🔍 FILTRO TEXTO
  // =====================================

  const texto =

    (this.filtro || '')
      .trim()
      .toLowerCase();

  if (texto) {

    lista = lista.filter(p =>

      (p.nombre || '')
        .toLowerCase()
        .includes(texto)
    );
  }

  // =====================================
  // 🔥 FILTRO PRINCIPAL
  // =====================================

  // SOLO SERVICIOS
  if (this.mostrarServicios) {

    lista = lista.filter(p =>

      p.esServicio == true
    );
  }

  // SOLO PRODUCTOS
  if (this.mostrarProductos) {

    lista = lista.filter(p =>

      p.esServicio == false
    );
  }

  // =====================================
  // 🔥 TIPO OPERACION
  // =====================================

  // =====================================
// 🔥 TIPO OPERACION
// =====================================

const operacion =
  (this.tipoOperacion || 'todos')
    .toUpperCase();

if (operacion !== 'TODOS') {

  lista = lista.filter(p => {

    const tipo =
      ((p as any).tipoOperacion || '')
        .toUpperCase()
        .trim();

    return tipo === operacion;
  });
}

  // =====================================
  // 🔥 RESULTADO
  // =====================================
// =====================================
// 🔥 STOCK BAJO
// =====================================

if (this.mostrarStockBajo) {

  lista = lista.filter(p =>

    p.controlarStock &&

    Number(p.cantidad || 0)
      <=
    Number(p.stock || 0)
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

        error: async () => {

          const toast =
            await this.toastCtrl.create({

              message:
                '❌ Error al eliminar el producto',

              duration: 2000,

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
}