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

import { AlmacenesService }
from 'src/app/servicios/almacenes.service';

import { Almacen }
from 'src/app/models/almacenes.model';

import { ParametrosService }
from 'src/app/servicios/parametros.service';

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

  almacenes: Almacen[] = [];

  stockAlmacenSeleccionado: number | null = null;

  idEmpresa: number = 0;

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

    private almacenesService:
      AlmacenesService,

    private parametros:
      ParametrosService,

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

    this.idEmpresa =
      Number(
        localStorage.getItem(
          'IdEmpresa'
        )
      );

    this.cargarProductos();

    this.cargarAlmacenes();

    // =============================================
    // 🔥 DEFAULTS
    // =============================================

    this.movimiento.tipoMovimiento =
      'ENTRADA';

    this.movimiento.motivo =
      'COMPRA';
  }

  get esTransferencia(): boolean {
    return (
      this.movimiento.tipoMovimiento
      === 'TRANSFERENCIA'
    );
  }

  get almacenesDestino(): Almacen[] {
    return this.almacenes.filter(
      x =>
        x.idAlmacen
        !== this.movimiento.idAlmacen
    );
  }

  onTipoMovimientoChange(): void {

    if (this.esTransferencia) {

      this.movimiento.motivo =
        'TRANSFERENCIA';

      if (
        this.movimiento.idAlmacenDestino
        === this.movimiento.idAlmacen
      ) {

        this.movimiento.idAlmacenDestino =
          0;
      }
    }
    else if (
      this.movimiento.motivo
      === 'TRANSFERENCIA'
    ) {

      this.movimiento.motivo =
        'COMPRA';
    }

    this.onAlmacenChange();
  }

  onAlmacenOrigenChange(): void {

    if (
      this.movimiento.idAlmacenDestino
      === this.movimiento.idAlmacen
    ) {

      this.movimiento.idAlmacenDestino =
        0;
    }

    this.onAlmacenChange();
  }

  // ======================================================
  // 🔥 CARGAR ALMACENES
  // ======================================================

  cargarAlmacenes(): void {

    this.almacenesService
      .getAlmacenes(this.idEmpresa)
      .subscribe({

        next: (data) => {

          this.almacenes =
            (data || [])
              .filter(x => x.activo);

          const principal =
            this.almacenes
              .find(x => x.esPrincipal);

          if (principal) {

            this.movimiento.idAlmacen =
              principal.idAlmacen;
          }
          else if (this.almacenes.length) {

            this.movimiento.idAlmacen =
              this.almacenes[0].idAlmacen;
          }
        },

        error: (err) => {

          console.log(err);
        }
      });
  }

  onAlmacenChange(): void {

    if (
      this.productoSeleccionado
        ?.idProducto
    ) {

      this.cargarStockAlmacen(
        this.productoSeleccionado
          .idProducto
      );
    }
  }

  cargarStockAlmacen(
    idProducto: number
  ): void {

    if (
      !this.movimiento.idAlmacen
      ||
      !idProducto
    ) {

      this.stockAlmacenSeleccionado =
        null;

      return;
    }

    this.almacenesService
      .getExistenciaEnAlmacen(
        this.movimiento.idAlmacen,
        idProducto,
        this.idEmpresa
      )
      .subscribe({

        next: (res) => {

          this.stockAlmacenSeleccionado =
            res?.cantidad ?? 0;
        },

        error: () => {

          this.stockAlmacenSeleccionado =
            0;
        }
      });
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

    this.cargarStockAlmacen(
      item.idProducto
    );
  }

  // ======================================================
  // 🔥 AGREGAR PRODUCTO
  // ======================================================

  agregarProducto(): void {

    // =============================================
    // 🔥 VALIDAR ALMACEN
    // =============================================

    if (!this.movimiento.idAlmacen) {

      this.showToast(
        this.esTransferencia
          ? 'Seleccione el almacén origen'
          : 'Seleccione un almacén'
      );

      return;
    }

    if (
      this.esTransferencia
      &&
      !this.movimiento.idAlmacenDestino
    ) {

      this.showToast(
        'Seleccione el almacén destino'
      );

      return;
    }

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

    const idProducto =
      this.productoSeleccionado
        .idProducto;

    const cantidad =
      this.cantidad;

    const tipo =
      this.movimiento
        .tipoMovimiento;

    const productoRef =
      { ...this.productoSeleccionado };

    const stockAlmacen =
      Number(
        this.stockAlmacenSeleccionado ?? 0
      );

    // =============================================
    // 🔥 ENTRADA: no requiere consultar API
    // =============================================

    if (tipo === 'ENTRADA') {

      this.confirmarAgregarProducto(
        stockAlmacen,
        productoRef,
        idProducto,
        cantidad,
        tipo
      );

      return;
    }

    // =============================================
    // 🔥 SALIDA: validar stock en almacén
    // =============================================

    if (this.stockAlmacenSeleccionado !== null) {

      if (stockAlmacen - cantidad < 0) {

        this.showToast(
          'Stock insuficiente en el almacén seleccionado'
        );

        return;
      }

      this.confirmarAgregarProducto(
        stockAlmacen,
        productoRef,
        idProducto,
        cantidad,
        tipo
      );

      return;
    }

    if (!this.idEmpresa) {

      this.idEmpresa =
        Number(
          localStorage.getItem(
            'IdEmpresa'
          )
        );
    }

    this.almacenesService
      .getExistenciaEnAlmacen(
        this.movimiento.idAlmacen,
        idProducto,
        this.idEmpresa
      )
      .subscribe({

        next: (resAlmacen) => {

          const stock =
            Number(
              resAlmacen?.cantidad ?? 0
            );

          if (stock - cantidad < 0) {

            this.showToast(
              'Stock insuficiente en el almacén seleccionado'
            );

            return;
          }

          this.confirmarAgregarProducto(
            stock,
            productoRef,
            idProducto,
            cantidad,
            tipo
          );
        },

        error: () => {

          this.showToast(
            'No se pudo validar la existencia'
          );
        }
      });
  }

  private confirmarAgregarProducto(
    _stockAlmacen: number,
    productoRef: productos,
    idProducto: number,
    cantidad: number,
    tipo: string
  ): void {

    const stockTotal =
      Number(
        productoRef.cantidad || 0
      );

    let stockNuevoTotal =
      stockTotal;

    if (tipo === 'ENTRADA') {

      stockNuevoTotal =
        stockTotal + cantidad;
    }
    else if (tipo === 'SALIDA') {

      stockNuevoTotal =
        stockTotal - cantidad;
    }

    const detalle =
      new MovimientosInventarioDetalle();

    detalle.idProducto =
      idProducto;

    detalle.producto =
      productoRef as productos;

    detalle.cantidad =
      cantidad;

    detalle.precio =
      this.precio;

    detalle.subTotal =
      cantidad *
      this.precio;

    detalle.stockAnterior =
      stockTotal;

    detalle.stockNuevo =
      stockNuevoTotal;

    this.movimiento
      .detalles
      .push(detalle);

    productoRef.cantidad =
      stockNuevoTotal;

    const idx =
      this.productos
        .findIndex(
          p =>
            p.idProducto
            === idProducto
        );

    if (idx >= 0) {

      this.productos[idx]
        .cantidad =
        stockNuevoTotal;
    }

    this.productoSeleccionado =
      new productos();

    this.cantidad = 1;

    this.precio = 0;

    this.filtro = '';

    this.stockAlmacenSeleccionado =
      null;

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

guardarMovimiento(
  imprimir = false
): void {

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

  if (!this.movimiento.idAlmacen) {

    this.showToast(
      this.esTransferencia
        ? 'Seleccione el almacén origen'
        : 'Seleccione un almacén'
    );

    return;
  }

  if (this.esTransferencia) {

    if (!this.movimiento.idAlmacenDestino) {

      this.showToast(
        'Seleccione el almacén destino'
      );

      return;
    }

    if (
      this.movimiento.idAlmacenDestino
      === this.movimiento.idAlmacen
    ) {

      this.showToast(
        'Origen y destino deben ser diferentes'
      );

      return;
    }
  }

  // =============================================
  // 🔥 EMPRESA
  // =============================================

  this.movimiento.idEmpresa =
    this.idEmpresa;

  // =============================================
  // 🔥 USUARIO
  // =============================================

  this.movimiento.idUsuario =
    this.parametros.IdUsuario
    ||
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

    idAlmacen:
      this.movimiento
        .idAlmacen,

    idAlmacenDestino:
      this.esTransferencia
        ? this.movimiento.idAlmacenDestino
        : null,

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

      next: async (resp: any) => {

        this.loading = false;

        this.showToast(
          'Movimiento guardado'
        );

        const printData =
          imprimir
            ? this.armarMovimientoParaImprimir(
                resp?.idMovimiento
              )
            : null;

        await this.modalCtrl.dismiss({
          refresh: true,
          imprimir: printData
        });
      },

      error: (err) => {

        this.loading = false;

        console.log(err);

        this.showToast(
          err?.error?.message
            || err?.error
            || 'Error guardando'
        );
      }
    });
}
  private armarMovimientoParaImprimir(
    idMovimiento?: number
  ): any {

    const almacen =
      this.almacenes.find(
        x =>
          x.idAlmacen
          === this.movimiento.idAlmacen
      );

    const almacenDestino =
      this.almacenes.find(
        x =>
          x.idAlmacen
          === this.movimiento.idAlmacenDestino
      );

    return {
      id: idMovimiento || 0,
      tipoMovimiento:
        this.movimiento.tipoMovimiento,
      motivo:
        this.movimiento.motivo,
      referencia:
        this.movimiento.referencia,
      observacion:
        this.movimiento.observacion,
      fecha: new Date().toISOString(),
      usuario:
        this.obtenerNombreUsuarioActual(),
      nombreAlmacen:
        almacen?.nombre || '',
      idAlmacen:
        this.movimiento.idAlmacen,
      idAlmacenDestino:
        this.movimiento.idAlmacenDestino || null,
      nombreAlmacenDestino:
        almacenDestino?.nombre || '',
      detalles:
        this.movimiento.detalles.map(x => ({
          producto:
            x.producto?.nombre || '',
          cantidad: x.cantidad,
          stockAnterior: x.stockAnterior,
          stockNuevo: x.stockNuevo,
          precio: x.precio,
          subTotal: x.subTotal
        }))
    };
  }

  private obtenerNombreUsuarioActual(): string {

    const raw =
      localStorage.getItem('usuario');

    if (raw) {

      try {

        const parsed =
          JSON.parse(raw);

        if (parsed?.nombre?.trim()) {

          return parsed.nombre.trim();
        }

        if (parsed?.userName?.trim()) {

          return parsed.userName.trim();
        }
      }
      catch {
        // ignore
      }
    }

    return (
      this.parametros.UserName
      ||
      localStorage.getItem('Usuario')
      ||
      localStorage.getItem('UserName')
      ||
      ''
    ).trim();
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