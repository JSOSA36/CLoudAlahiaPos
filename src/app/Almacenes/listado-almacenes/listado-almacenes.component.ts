import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AlmacenesService } from 'src/app/servicios/almacenes.service';
import { Almacen } from 'src/app/models/almacenes.model';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-listado-almacenes',
  templateUrl: './listado-almacenes.component.html',
  styleUrls: ['./listado-almacenes.component.scss'],
})
export class ListadoAlmacenesComponent implements OnInit {
  almacenes: Almacen[] = [];
  isModalOpen = false;
  editingAlmacen: Almacen | null = null;

  form: Almacen = this.nuevoFormulario();

  constructor(
    private almacenesService: AlmacenesService,
    private toastCtrl: ToastController,
    private para: ParametrosService
  ) {}

  ngOnInit(): void {
    this.loadAlmacenes();
  }

  loadAlmacenes(): void {
    this.almacenesService
      .getAlmacenes(this.para.IdEmpresa)
      .subscribe({
        next: (res) => {
          this.almacenes = (res || []).sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
          );
        },
        error: () => this.showToast('Error cargando almacenes'),
      });
  }

  openModal(almacen?: Almacen): void {
    this.isModalOpen = true;

    if (almacen) {
      this.editingAlmacen = almacen;
      this.form = { ...almacen };
      return;
    }

    this.editingAlmacen = null;
    this.form = this.nuevoFormulario();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingAlmacen = null;
    this.form = this.nuevoFormulario();
  }

  saveAlmacen(): void {
    if (!this.form.nombre?.trim()) {
      this.showToast('El nombre es obligatorio');
      return;
    }

    this.form.nombre = this.form.nombre.trim();
    this.form.descripcion = this.form.descripcion?.trim() || '';
    this.form.idEmpresa = this.para.IdEmpresa;

    if (this.editingAlmacen) {
      this.almacenesService
        .updateAlmacen(this.form.idAlmacen, this.form)
        .subscribe({
          next: () => {
            this.showToast('Almacén actualizado');
            this.loadAlmacenes();
            this.closeModal();
          },
          error: () => this.showToast('Error al actualizar almacén'),
        });
      return;
    }

    this.form.idUsuarioCreacion = this.para.IdUsuario;

    this.almacenesService.createAlmacen(this.form).subscribe({
      next: () => {
        this.showToast('Almacén creado');
        this.loadAlmacenes();
        this.closeModal();
      },
      error: () => this.showToast('Error al crear almacén'),
    });
  }

  deleteAlmacen(id: number): void {
    this.almacenesService.deleteAlmacen(id).subscribe({
      next: () => {
        this.showToast('Almacén desactivado');
        this.loadAlmacenes();
      },
      error: () => this.showToast('Error al desactivar almacén'),
    });
  }

  private nuevoFormulario(): Almacen {
    return {
      idAlmacen: 0,
      nombre: '',
      descripcion: '',
      idEmpresa: this.para.IdEmpresa,
      esPrincipal: false,
      activo: true,
    };
  }

  private async showToast(message: string): Promise<void> {
    (
      await this.toastCtrl.create({
        message,
        duration: 2200,
        position: 'bottom',
      })
    ).present();
  }
}
