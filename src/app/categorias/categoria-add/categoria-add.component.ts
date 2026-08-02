import { Component, OnInit } from '@angular/core';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-categoria-add',
  templateUrl: './categoria-add.component.html',
  styleUrls: ['./categoria-add.component.scss'],
})
export class CategoriaAddComponent implements OnInit {

  nombre = '';
  _estado = true;
  tipoOperacion = 'AMBAS';
  imagenFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  guardando = false;
  esEdicion = false;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private _categoryservices: CategoriasService,
    private modalCtrl: ModalController,
    private _Para: ParametrosService
  ) {}

  ngOnInit(): void {
    this.CargarCategorias();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.imagenFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagenPreview = reader.result);
    reader.readAsDataURL(file);
  }

  onToggleChange(event: any) {
    this._estado = !!event.detail.checked;
  }

  CargarCategorias() {
    if (this._Para._Cat != null) {
      this.esEdicion = true;
      this.nombre = this._Para._Cat.nombre || '';
      this._estado = !!this._Para._Cat.isActiva;
      this.imagenPreview = this._Para._Cat.imagenPath || null;
      this.tipoOperacion = this._Para._Cat.tipoOperacion || 'AMBAS';
    } else {
      this.esEdicion = false;
      this.nombre = '';
      this._estado = true;
      this.imagenPreview = null;
      this.tipoOperacion = 'AMBAS';
    }
  }

  closeModal() {
    this.modalCtrl.dismiss({ saved: false });
  }

  async guardarCategoria() {
    const nombre = (this.nombre || '').trim();
    if (!nombre) {
      await this.toast('Ingrese el nombre de la categoría', 'warning');
      return;
    }

    if (this.guardando) return;
    this.guardando = true;

    const loading = await this.loadingCtrl.create({
      message: this.esEdicion ? 'Actualizando…' : 'Guardando…',
    });
    await loading.present();

    const formData = new FormData();
    const idEmpresa = this._Para.GetIdEmpresa();
    formData.append('idEmpresa', idEmpresa.toString());
    formData.append('tipoOperacion', this.tipoOperacion);
    formData.append('nombre', nombre);
    formData.append('isActiva', this._estado ? 'true' : 'false');

    const request$ = this.esEdicion
      ? this.prepararEdicion(formData)
      : this.prepararCreacion(formData);

    request$.subscribe({
      next: async () => {
        await loading.dismiss();
        this.guardando = false;
        const msg = this.esEdicion
          ? 'Categoría actualizada correctamente'
          : 'Categoría creada correctamente';
        await this.toast(msg, 'success');
        this._Para._Cat = null as any;
        await this.modalCtrl.dismiss({ saved: true });
      },
      error: async (err) => {
        await loading.dismiss();
        this.guardando = false;
        const msg = err?.error?.message || err?.message || 'No se pudo guardar la categoría';
        await this.toast(msg, 'danger');
      }
    });
  }

  private prepararEdicion(formData: FormData) {
    formData.append('idCategoria', this._Para._Cat.idCategoria.toString());
    if (this.imagenFile) {
      formData.append('imagen', this.imagenFile, this.imagenFile.name);
    } else {
      formData.append('imagen', new Blob(), '');
    }
    return this._categoryservices.EditarCategoria(formData);
  }

  private prepararCreacion(formData: FormData) {
    if (this.imagenFile) {
      formData.append('imagen', this.imagenFile, this.imagenFile.name);
    }
    return this._categoryservices.EnviarItem(formData);
  }

  private async toast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const t = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await t.present();
  }
}
