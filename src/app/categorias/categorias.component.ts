import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParametrosService } from '../servicios/parametros.service';
import { categorias } from '../models/categorias';
import { CategoriasService } from '../servicios/categorias.service';
import { productos } from 'src/app/models/productos';
import { ProductosService } from 'src/app/servicios/productos.service';
import { AlertController } from '@ionic/angular';
import { DescuentoHeaderService } from 'src/app/servicios/descuento-header.service';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss'],
})
export class CategoriasComponent implements OnInit {

  productoCategory = false;
  scanning = false;
 _IdCate = 0;
  listadoCategorias: categorias[] = [];
  listadoProductosGlobal: productos[] = [];
  listadoProductosCategoria: productos[] = [];
  productosFiltrados: productos[] = [];

  tipoDocumento: 'ORDEN' | 'FACTURA' = 'ORDEN';
  filtroProducto: string = '';

  constructor(
    private ruta: Router,
    public parametro: ParametrosService,
    private _categoriaService: CategoriasService,
    private _productoService: ProductosService,
    private alertController: AlertController,
    private descuentoSrv: DescuentoHeaderService
  ) { }

  ngOnInit() {
    this.loadProductos();
    this.cargarCategorias();
  }

async seleccionarTipoDocumento(index: number, IdProducto: number) {

  const alert = await this.alertController.create({
    header: 'Agregar Servicio',
    message: '¿Deseas crear una Orden o Facturar ahora?',
    cssClass: 'alert-pos',

    buttons: [
      {
        text: '🧾 Orden',
        cssClass: 'btn-orden',
        handler: () => {

          this.tipoDocumento = 'ORDEN';
          this.parametro.TipoDocumento = 'ORDEN'; // 🔥 global
          this.aumentarCantidad(index, IdProducto);

        }
      },
      {
        text: '💳 Factura',
        cssClass: 'btn-factura',
        handler: () => {

          this.tipoDocumento = 'FACTURA';
          this.parametro.TipoDocumento = 'FACTURA'; // 🔥 global
          this.aumentarCantidad(index, IdProducto);

        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ]
  });

  await alert.present();
}
  // =====================================================
  //                     CATEGORÍAS
  // =====================================================
  cargarCategorias() {
    this._categoriaService.GetListadoCategorias(this.parametro.GetIdEmpresa())
      .subscribe((res: categorias[]) => {
        this.listadoCategorias = (res || []).filter(c => c.isActiva === true);
      });
  }

  segmentChanged(Id: number) {
    this.productoCategory = true;
    this._IdCate = Id;
    this.listaProductosByCategoria(Id);
  }

  // =====================================================
  //           CARGAR TODOS LOS PRODUCTOS (GLOBAL)
  // =====================================================
  loadProductos() {
    this._productoService.GetProductos(this.parametro.IdEmpresa)
      .subscribe(c => {
        c.forEach(prod => this.aplicarDescuentoProducto(prod));
        this.listadoProductosGlobal = c;
      });
  }

  // =====================================================
  //                APLICAR DESCUENTO
  // =====================================================
  aplicarDescuentoProducto(prod: productos) {

    const idArea = prod.idArea || 0;

    this.descuentoSrv.getAplicado(
      this.parametro.IdEmpresa,
      prod.idProducto,
      idArea
    )
    .subscribe(resp => {

      if (!resp || !resp.aplica) return;

      if (prod._precioOriginal == null) {
        prod._precioOriginal = prod.precioVenta;
      }

      const original = prod._precioOriginal;

      if (resp.tipo === 'PORCENTAJE') {
        prod.precioVenta = original - (original * resp.valor / 100);
      }

      if (resp.tipo === 'MONTO') {
        prod.precioVenta = original - resp.valor;
      }

      if (prod.precioVenta < 0) {
        prod.precioVenta = 0;
      }

      prod.precioOriginal = original;
      prod.preciooferta = prod.precioVenta;

    });
  }

  // =====================================================
  //              PRODUCTOS POR CATEGORÍA
  // =====================================================
  listaProductosByCategoria(Id: number) {
    this._productoService.GetProductosByIdCategoria(Id, this.parametro.IdEmpresa)
      .subscribe((res: productos[]) => {

        this.listadoProductosCategoria = res.map(c => {

          const exist = this.parametro.ListadoProductosCate
            .find(p => p.idProducto === c.idProducto);

          if (exist) c._cantidad = exist._cantidad;

          this.aplicarDescuentoProducto(c);
          return c;
        });

        this.parametro.ListadoProductoCategoria = this.listadoProductosCategoria;
        this.productosFiltrados = [...this.listadoProductosCategoria];
      });
  }

  // =====================================================
  //                  BUSCADOR GLOBAL
  // =====================================================
  filtrarProducto(event: any) {
    const termino = event.target.value?.toLowerCase() || '';

    if (termino) {
      this.productosFiltrados = this.listadoProductosGlobal.filter(c =>
        c.nombre.toLowerCase().includes(termino) ||
        (c.codigoBarra?.toLowerCase().includes(termino)) ||
        (c.descripcion?.toLowerCase().includes(termino))
      );
    } else {
      this.productosFiltrados = [...this.listadoProductosCategoria];
    }
  }

  // =====================================================
  //            🔥 RECALCULAR TOTALES (CLAVE)
  // =====================================================
  recalcularTotales() {
    this.parametro.Cart = this.parametro.ListadoProductosCate
      .reduce((sum, p) => sum + p._cantidad, 0);

    this.parametro.Total = this.parametro.ListadoProductosCate
      .reduce((sum, p) => sum + (p._cantidad * p.precioVenta), 0);
  }

  // =====================================================
  //                    CANTIDADES
  // =====================================================
  disminuirCantidad(index: number) {
    const item = this.productosFiltrados[index];
    const idx = this.parametro.ListadoProductosCate
      .findIndex(p => p.idProducto === item.idProducto);

    if (idx < 0) return;

    if (this.parametro.ListadoProductosCate[idx]._cantidad > 1) {
      this.parametro.ListadoProductosCate[idx]._cantidad--;
      item._cantidad = this.parametro.ListadoProductosCate[idx]._cantidad;
    } else {
      this.parametro.ListadoProductosCate.splice(idx, 1);
      item._cantidad = 0;
    }

    this.recalcularTotales();
  }

  aumentarCantidad(index: number, IdProducto: number) {
    const producto = this.productosFiltrados[index];
    const idx = this.parametro.ListadoProductosCate
      .findIndex(p => p.idProducto === IdProducto);

    if (idx >= 0) {
      this.parametro.ListadoProductosCate[idx]._cantidad++;
      producto._cantidad = this.parametro.ListadoProductosCate[idx]._cantidad;
    } else {
      producto._cantidad = 1;
      this.parametro.ListadoProductosCate.push(producto);
    }

    this.recalcularTotales();
  }

  // =====================================================
  //                     NAVEGAR
  // =====================================================
  callCart() {
    this.ruta.navigateByUrl('/cart');
  }

  goBackCategoria() {
    this.productoCategory = false;
    this.productosFiltrados = [];
  }

  // =====================================================
  //              EDITAR PRECIO MANUAL
  // =====================================================
  async editarPrecio(prod: productos) {
    const alert = await this.alertController.create({
      header: 'Editar precio',
      inputs: [
        {
          name: 'precio',
          type: 'number',
          value: prod.precioVenta,
          placeholder: 'Nuevo precio'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoPrecio = parseFloat(data.precio);
            if (!isNaN(nuevoPrecio) && nuevoPrecio > 0) {
              prod.precioVenta = nuevoPrecio;
              prod.preciooferta = nuevoPrecio;
              this.recalcularTotales();
            } else {
              this.showAlert('Error', 'Debe ingresar un precio válido.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
