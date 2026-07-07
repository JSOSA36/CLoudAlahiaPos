import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { AlertController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-categoria-add',
  templateUrl: './categoria-add.component.html',
  styleUrls: ['./categoria-add.component.scss'],
})
export class CategoriaAddComponent implements OnInit {

  nombre: string = '';

  _estado: boolean = false;

  tipoOperacion: string = 'AMBAS';

  imagenFile: File | null = null;

  imagenPreview: string | ArrayBuffer | null = null;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private _categoryservices: CategoriasService,
    private modalCtrl: ModalController,
    private _Para: ParametrosService
  ) {}

  ngOnInit(): void {
    this.CargarCategorias();
  }

  // Cuando se selecciona un archivo
  onFileSelected(event: any) {

    const file = event.target.files[0];

    if (file) {

      this.imagenFile = file;

      // Preview de la imagen
      const reader = new FileReader();

      reader.onload = () => (this.imagenPreview = reader.result);

      reader.readAsDataURL(file);
    }
  }

  // Toggle estado
  onToggleChange(event: any) {

    this._estado = event.detail.checked;

    console.log('Estado de la categoría:', this._estado);
  }

  CargarCategorias() {

    if (this._Para._Cat != null) {

      this.nombre = this._Para._Cat.nombre;

      this._estado = this._Para._Cat.isActiva;

      this.imagenPreview = this._Para._Cat.imagenPath;

      this.tipoOperacion = this._Para._Cat.tipoOperacion;
    }
  }

  closeModal() {

    this.modalCtrl.dismiss();
  }

  // Guardar categoría
  async guardarCategoria() {

    const formData = new FormData();

    // ✅ siempre incluir IdEmpresa
    const idEmpresa = this._Para.GetIdEmpresa();

    formData.append('idEmpresa', idEmpresa.toString());

    formData.append('tipoOperacion', this.tipoOperacion);

    if (this._Para._Cat != null) {

      // 🔹 Editar categoría
      formData.append('idCategoria', this._Para._Cat.idCategoria.toString());

      formData.append('nombre', this.nombre);

      formData.append('isActiva', this._estado ? 'true' : 'false');

      if (this.imagenFile) {

        formData.append('imagen', this.imagenFile, this.imagenFile.name);

      } else {

        formData.append('imagen', new Blob(), '');
      }

      this._categoryservices.EditarCategoria(formData).subscribe(() => {

        this.enviaralert('Categoría actualizada correctamente');
      });

    } else {

      // 🔹 Crear categoría
      formData.append('nombre', this.nombre);

      formData.append('isActiva', this._estado ? 'true' : 'false');

      if (this.imagenFile) {

        formData.append('imagen', this.imagenFile, this.imagenFile.name);
      }

      this._categoryservices.EnviarItem(formData).subscribe(() => {

        this.enviaralert('Categoría agregada correctamente');
      });
    }
  }

  async enviaralert(ms: string) {

    const alert = await this.alertCtrl.create({
      header: 'Información',
      message: ms,
      buttons: ['Aceptar'],
    });

    await alert.present();
  }
}