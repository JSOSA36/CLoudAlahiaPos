import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { productos } from 'src/app/models/productos';
import { ProductosService } from 'src/app/servicios/productos.service';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AreasService } from 'src/app/servicios/area.services';
import { Area } from 'src/app/models/area.model';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-productos-add',
  templateUrl: './productosadd.component.html',
  styleUrls: ['./productosadd.component.scss'],
})
export class ProductosAddComponent implements OnInit {
  @Input() producto!: productos | null;
@ViewChild('fileInput') fileInput!: ElementRef;
 form: any = {
  idproducto: 0,
  nombre: '',
  esServicio: false,
  controlarStock: false,
  precioVenta: 0,
  // 🔥 COMPRA / VENTA
tipoOperacion: 'AMBAS',
  cantidad: 0,
  costo: 0,
  idCategoria: null,
  idArea: null,
  isActivo: true,
  Itbis: false,
  codigoBarra: '',

  // ⚡ NUEVOS CAMPOS
  duracionServicio: 0,        // duración del servicio en minutos
  disponibleEnCitas: true     // si se muestra en la lista de citas
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

    // ✅ Cargar categorías
    this.categoriaService.GetListadoCategorias(idEmpresa).subscribe(res => {
      this.categorias = res;
    });

    // ✅ Cargar áreas
    this.areasService.getAreas(idEmpresa).subscribe(res => {
      this.areas = res;
    });

    // ✅ Si es edición, cargar datos del producto
    if (this.producto) {
      console.log('Cargando producto para edición:', this.producto);
      this.form = {
        idproducto: this.producto.idProducto,
        nombre: this.producto.nombre,
        controlarStock: this.producto.controlarStock,
        precioVenta: this.producto.precioVenta,
        cantidad: this.producto.cantidad,
        costo: this.producto.precioCompra,
        idCategoria: this.producto.idCategoria,
        idArea: this.producto.idArea,
        isActivo: this.producto.isActivo,
        esServicio: this.producto.esServicio,
       tipoOperacion:
  this.producto.tipoOperacion || 'AMBAS',
        seVende: this.producto.seVende ?? true,
        Itbis: this.producto.impuesto > 0,
        codigoBarra: this.producto.codigoBarra,
         duracionServicio: this.producto.duracionServicio || 0,
    disponibleEnCitas: this.producto.disponibleEnCitas ?? true
      };
      this.imagenPreview = this.producto.imagen1 || null;
    }
  }

  CloseModal() {
    this.modalCtrl.dismiss();
  }
abrirSelectorImagen() {
  this.fileInput.nativeElement.click();
}
  onFileSelected(event: any) {
    this.imagenFile = event.target.files[0];
    if (this.imagenFile) {
      const reader = new FileReader();
      reader.onload = () => (this.imagenPreview = reader.result as string);
      reader.readAsDataURL(this.imagenFile);
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

  // 🔥 ID (CLAVE PARA UPDATE)
  formData.append('idProducto', String(this.form.idproducto || 0));

  formData.append('nombre', this.form.nombre);
  formData.append('idCategoria', String(this.form.idCategoria || 0));
  formData.append('idArea', String(this.form.idArea || 0));

  formData.append('duracionServicio', String(this.form.duracionServicio || 0));
  formData.append('disponibleEnCitas', String(this.form.disponibleEnCitas ?? true));

  formData.append('Itbis', String(this.form.Itbis ?? false));
  formData.append('isActivo', String(this.form.isActivo ?? true));
  formData.append('esServicio', String(this.form.esServicio ?? false));
formData.append(
  'tipoOperacion',
  this.form.tipoOperacion || 'AMBAS'
);
  formData.append('idEmpresa', this._Parametro.GetIdEmpresa().toString());

  // 🔥 SEGÚN TIPO
  if (this.form.esServicio) {

    formData.append('precio', String(this.form.precioVenta || 0));
    formData.append('costo', '0');
    formData.append('cantidad', '0');
    formData.append('codigoBarra', 'N/A');
    formData.append('controlarStock', 'false');

  } else {

    formData.append('precio', String(this.form.precioVenta || 0));
    formData.append('costo', String(this.form.costo || 0));
    formData.append('cantidad', String(this.form.cantidad || 0));
    formData.append('codigoBarra', this.form.codigoBarra || 'N/A');
    formData.append('controlarStock', String(this.form.controlarStock ?? false));
  }

  // 🔥 IMAGEN
  if (this.imagenFile) {
    formData.append('imagen', this.imagenFile, this.imagenFile.name);
  }

  // 🔥 LLAMADA ÚNICA
  const request = this.productoService.EnviarItem(formData);

  request.subscribe(
    async (resp: any) => {

      // 🔥 MENSAJE REAL DEL BACKEND
      const mensaje = typeof resp === 'string'
        ? resp
        : resp?.mensaje || 'Operación realizada correctamente';

      const toast = await this.toastCtrl.create({
        message: mensaje,
        duration: 2000,
        color: 'success'
      });

      toast.present();

      this.CloseModal();
    },
    async (error) => {
      console.error('ERROR BACKEND:', error);

      const toast = await this.toastCtrl.create({
        message: error?.error || 'Error al guardar el producto ❌',
        duration: 2000,
        color: 'danger'
      });

      toast.present();
    }
  );
}

  onToggleChange(event: CustomEvent) {
    this.form.isActivo = event.detail.checked;
  }

  onToggleStock(event: CustomEvent) {
    this.form.controlarStock = event.detail.checked;
  }
}
