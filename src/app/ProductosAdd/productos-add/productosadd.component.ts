import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { productos } from 'src/app/models/productos';
import { ProductosService } from 'src/app/servicios/productos.service';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AreasService } from 'src/app/servicios/area.services';
import { Area } from 'src/app/models/area.model';
import {
  defaultComportamientoParaNaturaleza,
  normalizarTipoComportamiento,
  opcionesComportamientoParaNaturaleza,
  TIPO_COMPORTAMIENTO,
  TIPOS_COMPORTAMIENTO_OPCIONES
} from 'src/app/shared/tipo-comportamiento';

import { AnalisisProductoProveedorComponent } from 'src/app/Compras/analisis-producto-proveedor/analisis-producto-proveedor.component';

@Component({
  selector: 'app-productos-add',
  templateUrl: './productosadd.component.html',
  styleUrls: ['./productosadd.component.scss'],
})
export class ProductosAddComponent implements OnInit {
  readonly TIPO = TIPO_COMPORTAMIENTO;

  @Input() producto!: productos | null;
  @ViewChild('fileInput') fileInput!: ElementRef;
  form: any = {
    idproducto: 0,
    nombre: '',
    esServicio: false,
    tipoComportamiento: TIPO_COMPORTAMIENTO.INVENTARIO,
    controlarStock: true,
    precioVenta: 0,
    tipoOperacion: 'AMBAS',
    cantidad: 0,
    costo: 0,
    idCategoria: null,
    idArea: null,
    isActivo: true,
    Itbis: false,
    codigoBarra: '',
    duracionServicio: 0,
    disponibleEnCitas: true
  };

  imagenFile: File | null = null;
  imagenPreview: string | null = null;
  categorias: any[] = [];
  areas: Area[] = [];

  constructor(
    private modalCtrl: ModalController,
    private productoService: ProductosService,
    private categoriaService: CategoriasService,
    private areasService: AreasService,
    private toastCtrl: ToastController,
    private _Parametro: ParametrosService
  ) {}

  ngOnInit() {
    const idEmpresa = this._Parametro.GetIdEmpresa();

    this.categoriaService.GetListadoCategorias(idEmpresa).subscribe(res => {
      this.categorias = res;
    });

    this.areasService.getAreas(idEmpresa).subscribe(res => {
      this.areas = res;
    });

    if (this.producto) {
      const esServicio = !!this.producto.esServicio;
      const controlarStock = esServicio ? false : !!this.producto.controlarStock;
      let tipo = this.producto.tipoComportamiento
        ? normalizarTipoComportamiento(this.producto.tipoComportamiento)
        : defaultComportamientoParaNaturaleza(esServicio, controlarStock);

      if (esServicio && (tipo === TIPO_COMPORTAMIENTO.INVENTARIO || tipo === TIPO_COMPORTAMIENTO.ACTIVO_FIJO)) {
        tipo = TIPO_COMPORTAMIENTO.SERVICIO;
      }

      this.form = {
        idproducto: this.producto.idProducto,
        nombre: this.producto.nombre,
        esServicio,
        tipoComportamiento: tipo,
        controlarStock,
        precioVenta: this.producto.precioVenta,
        cantidad: this.producto.cantidad,
        costo: this.producto.precioCompra,
        idCategoria: this.producto.idCategoria,
        idArea: this.producto.idArea,
        isActivo: this.producto.isActivo,
        tipoOperacion: this.producto.tipoOperacion || (esServicio ? 'VENTA' : 'AMBAS'),
        seVende: this.producto.seVende ?? true,
        Itbis: !!this.producto.itbis,
        codigoBarra: this.producto.codigoBarra,
        duracionServicio: this.producto.duracionServicio || 0,
        disponibleEnCitas: this.producto.disponibleEnCitas ?? true
      };
      this.imagenPreview = this.producto.imagen1 || null;
    }
  }

  get tiposComportamiento() {
    return opcionesComportamientoParaNaturaleza(!!this.form.esServicio);
  }

  get descripcionTipoComportamiento(): string {
    const tipo = normalizarTipoComportamiento(this.form.tipoComportamiento);
    return TIPOS_COMPORTAMIENTO_OPCIONES.find(t => t.value === tipo)?.descripcion ?? '';
  }

  /** Compra ERP solo si el ítem se compra (producto o servicio subcontratado). */
  get muestraComportamientoCompra(): boolean {
    const op = String(this.form.tipoOperacion || '').toUpperCase();
    return op === 'COMPRA' || op === 'AMBAS';
  }

  get esInventarioCompra(): boolean {
    return normalizarTipoComportamiento(this.form.tipoComportamiento) === TIPO_COMPORTAMIENTO.INVENTARIO;
  }

  onNaturalezaChange(): void {
    if (this.form.esServicio) {
      this.form.controlarStock = false;
      this.form.tipoOperacion = 'VENTA';
      this.form.tipoComportamiento = TIPO_COMPORTAMIENTO.SERVICIO;
      this.form.cantidad = 0;
    } else {
      this.form.tipoOperacion = this.form.tipoOperacion || 'AMBAS';
      this.form.tipoComportamiento = TIPO_COMPORTAMIENTO.INVENTARIO;
      this.form.controlarStock = true;
    }
  }

  onTipoOperacionChange(): void {
    if (!this.muestraComportamientoCompra && this.form.esServicio) {
      this.form.tipoComportamiento = TIPO_COMPORTAMIENTO.SERVICIO;
    }
  }

  CloseModal() {
    this.modalCtrl.dismiss();
  }

  abrirSelectorImagen() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event?.target?.files?.[0] as File | undefined;
    this.imagenFile = file || null;
    if (this.imagenFile) {
      const reader = new FileReader();
      reader.onload = () => (this.imagenPreview = reader.result as string);
      reader.readAsDataURL(this.imagenFile);
    }
    // Permite volver a elegir el mismo archivo u otro en la siguiente edición
    if (event?.target) {
      event.target.value = '';
    }
  }

  async guardarProducto() {
    if (!this.form.nombre || !this.form.nombre.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'El nombre del producto es obligatorio.',
        duration: 2000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    const formData = new FormData();
    const esServicio = !!this.form.esServicio;
    let tipo = normalizarTipoComportamiento(this.form.tipoComportamiento);

    if (esServicio) {
      this.form.controlarStock = false;
      if (tipo === TIPO_COMPORTAMIENTO.INVENTARIO || tipo === TIPO_COMPORTAMIENTO.ACTIVO_FIJO) {
        tipo = TIPO_COMPORTAMIENTO.SERVICIO;
      }
      if (!this.muestraComportamientoCompra) {
        tipo = TIPO_COMPORTAMIENTO.SERVICIO;
      }
    }

    formData.append('idProducto', String(this.form.idproducto || 0));
    formData.append('nombre', this.form.nombre);
    formData.append('idCategoria', String(this.form.idCategoria || 0));
    formData.append('idArea', String(this.form.idArea || 0));
    formData.append('duracionServicio', String(this.form.duracionServicio || 0));
    formData.append('disponibleEnCitas', String(this.form.disponibleEnCitas ?? true));
    formData.append('Itbis', String(this.form.Itbis ?? false));
    formData.append('isActivo', String(this.form.isActivo ?? true));
    formData.append('esServicio', String(esServicio));
    formData.append('tipoComportamiento', tipo);
    formData.append(
      'tipoOperacion',
      esServicio && !this.muestraComportamientoCompra
        ? 'VENTA'
        : (this.form.tipoOperacion || 'AMBAS')
    );
    formData.append('idEmpresa', this._Parametro.GetIdEmpresa().toString());

    if (esServicio) {
      formData.append('precio', String(this.form.precioVenta || 0));
      formData.append('costo', String(this.form.costo || 0));
      formData.append('cantidad', '0');
      formData.append('codigoBarra', this.form.codigoBarra || 'N/A');
      formData.append('controlarStock', 'false');
    } else if (tipo === TIPO_COMPORTAMIENTO.INVENTARIO) {
      formData.append('precio', String(this.form.precioVenta || 0));
      formData.append('costo', String(this.form.costo || 0));
      formData.append('cantidad', String(this.obtenerCantidadParaGuardar()));
      formData.append('codigoBarra', this.form.codigoBarra || 'N/A');
      formData.append('controlarStock', String(this.form.controlarStock ?? true));
    } else {
      formData.append('precio', String(this.form.precioVenta || 0));
      formData.append('costo', String(this.form.costo || 0));
      formData.append('cantidad', String(this.obtenerCantidadParaGuardar()));
      formData.append('codigoBarra', this.form.codigoBarra || 'N/A');
      formData.append('controlarStock', String(this.form.controlarStock ?? false));
    }

    if (this.imagenFile) {
      formData.append('imagen', this.imagenFile, this.imagenFile.name);
    }

    this.productoService.EnviarItem(formData).subscribe({
      next: async (resp: any) => {
        const mensaje = typeof resp === 'string'
          ? resp
          : resp?.mensaje || resp?.message || 'Operación realizada correctamente';
        const toast = await this.toastCtrl.create({
          message: mensaje,
          duration: 2000,
          color: 'success'
        });
        toast.present();
        this.CloseModal();
      },
      error: async (error) => {
        const toast = await this.toastCtrl.create({
          message: error?.error?.message || error?.error || 'Error al guardar el producto',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  onToggleChange(event: CustomEvent) {
    this.form.isActivo = event.detail.checked;
  }

  onToggleStock(event: CustomEvent) {
    if (this.form.esServicio) {
      this.form.controlarStock = false;
      return;
    }
    this.form.controlarStock = event.detail.checked;
  }

  async abrirHistorialCompras() {
    const id = Number(this.form.idproducto || this.producto?.idProducto || 0);
    if (id <= 0) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: AnalisisProductoProveedorComponent,
      cssClass: 'modal-gasto',
      componentProps: {
        esModal: true,
        idProductoModal: id
      }
    });
    await modal.present();
  }

  private obtenerCantidadParaGuardar(): number {
    if (this.form.idproducto > 0) {
      return Number(this.producto?.cantidad ?? this.form.cantidad ?? 0);
    }
    return 0;
  }
}
