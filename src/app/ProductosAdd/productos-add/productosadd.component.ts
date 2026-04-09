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
    if (!this.form.nombre.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'El nombre del producto es obligatorio.',
        duration: 2000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    const formData = new FormData();
    formData.append('idproducto', this.form.idproducto);
    formData.append('nombre', this.form.nombre);
    formData.append('controlarStock', String(this.form.controlarStock));
    formData.append('precio', this.form.precioVenta);
    formData.append('costo', this.form.costo);
    formData.append('cantidad', this.form.cantidad);
    formData.append('idCategoria', this.form.idCategoria);
    formData.append('duracionServicio', this.form.duracionServicio);
    formData.append('disponibleEnCitas', String(this.form.disponibleEnCitas));
    formData.append('Itbis', String(this.form.Itbis));
    formData.append('codigoBarra', this.form.codigoBarra);
    formData.append('idArea', this.form.idArea); // ⚡ enviar área
    formData.append('isActivo', String(this.form.isActivo));
    formData.append('esServicio', String(this.form.esServicio));
    formData.append('idEmpresa', this._Parametro.GetIdEmpresa().toString());

    if (this.imagenFile) {
      formData.append('imagen', this.imagenFile, this.imagenFile.name);
    }

    const request = this.producto
      ? this.productoService.EditarProductos(formData)
      : this.productoService.EnviarItem(formData);

    request.subscribe(
      async () => {
        const toast = await this.toastCtrl.create({
          message: this.producto ? 'Producto actualizado ✅' : 'Producto creado ✅',
          duration: 2000,
          color: 'success'
        });
        toast.present();
        this.CloseModal();
      },
      async (error) => {
        console.error(error);
        const toast = await this.toastCtrl.create({
          message: 'Error al guardar el producto ❌',
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
