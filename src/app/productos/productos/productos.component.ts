import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { ProductosAddComponent } from 'src/app/ProductosAdd/productos-add/productosadd.component';
import { productos } from 'src/app/models/productos';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ProductosService } from 'src/app/servicios/productos.service';
import { AreasService } from 'src/app/servicios/area.services';
import { Area } from 'src/app/models/area.model';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {
  ListadoProductos: productos[] = [];
  productosFiltrados: productos[] = [];

  // 🔎 texto
  filtro = '';

  // 🧭 áreas
  areas: Area[] = [];
  selectedAreaId: number | null = null;   // null = Todas

  // 🪄 paginado/infinite
  itemsToShow = 12;
  infiniteDisabled = false;
  cargando = false;

  constructor(
    private productoService: ProductosService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private parametro: ParametrosService,
    private areasService: AreasService
  ) {}

  ngOnInit() {
    this.loadAreas();
    this.cargarProductos();
  }

  private loadAreas() {
    const idEmpresa = this.parametro.GetIdEmpresa();
    this.areasService.getAreas(idEmpresa).subscribe({
      next: (res) => (this.areas = res ?? []),
      error: (err) => console.error('Error cargando áreas', err),
    });
  }

  private resetPaging(): void {
    this.itemsToShow = Math.min(12, this.productosFiltrados.length);
    this.infiniteDisabled = this.itemsToShow >= this.productosFiltrados.length;
  }

  aplicarFiltros(): void {
    const texto = (this.filtro || '').trim().toLowerCase();

    this.productosFiltrados = this.ListadoProductos.filter((p) => {
      const coincideTexto =
        !texto || (p.nombre || '').toLowerCase().includes(texto);

      // ⚠️ Ajusta el nombre del campo si en tu modelo es distinto:
      // idArea | idAreas | areaId
      const idAreaProd = (p as any).idArea ?? (p as any).idAreas ?? (p as any).areaId ?? null;
      const coincideArea =
        this.selectedAreaId === null ? true : idAreaProd === this.selectedAreaId;

      return coincideTexto && coincideArea;
    });

    this.resetPaging();
  }

 onAreaChange(val: any) {
  this.selectedAreaId = (val === 'all' || val === null || val === undefined) ? null : Number(val);
  this.aplicarFiltros();
}


  loadMore(event?: any) {
    this.itemsToShow = Math.min(
      this.itemsToShow + 12,
      this.productosFiltrados.length
    );

    if (event?.target) {
      event.target.complete();
      if (this.itemsToShow >= this.productosFiltrados.length) {
        event.target.disabled = true;
        this.infiniteDisabled = true;
      }
    } else {
      this.infiniteDisabled =
        this.itemsToShow >= this.productosFiltrados.length;
    }
  }

  cargarProductos() {
    this.cargando = true;
    this.productoService.GetProductos(this.parametro.GetIdEmpresa()).subscribe({
      next: (res) => {
        this.ListadoProductos = res ?? [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: async (err) => {
        console.error('Error al cargar productos', err);
        this.cargando = false;
        const toast = await this.toastCtrl.create({
          message: 'No se pudieron cargar los productos.',
          duration: 2000,
          color: 'danger',
          position: 'bottom',
        });
        toast.present();
      },
    });
  }

  async openModal(producto: productos | null) {
    const modal = await this.modalCtrl.create({
      component: ProductosAddComponent,
      cssClass: 'modal-producto-grande',
      componentProps: { producto },
    });
    await modal.present();
    await modal.onDidDismiss();
    this.cargarProductos();
  }

  async eliminarProducto(producto: productos) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Seguro que deseas eliminar el producto "${producto.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmarEliminar(producto),
        },
      ],
    });
    await alert.present();
  }

  private async confirmarEliminar(producto: productos) {
    this.productoService.DeleteIten(producto.idProducto).subscribe({
      next: async () => {
        this.ListadoProductos = this.ListadoProductos.filter(
          (p) => p.idProducto !== producto.idProducto
        );
        this.aplicarFiltros();
        const toast = await this.toastCtrl.create({
          message: `Producto "${producto.nombre}" eliminado ✅`,
          duration: 2000,
          color: 'success',
          position: 'bottom',
        });
        toast.present();
      },
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: '❌ Error al eliminar el producto',
          duration: 2000,
          color: 'danger',
          position: 'bottom',
        });
        toast.present();
      },
    });
  }

  trackById(_i: number, item: productos) {
    return item.idProducto;
  }
}
