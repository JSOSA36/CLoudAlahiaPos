import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AreasService } from 'src/app/servicios/area.services';
import { Area } from 'src/app/models/area.model';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-area',
  templateUrl: './area.component.html',
  styleUrls: ['./area.component.scss'],
})
export class AreaComponent implements OnInit {
  areas: Area[] = [];
  isModalOpen = false;
  editingArea: Area | null = null;

  form: any = {
    idArea: 0,
    nombre: '',
    isActivo: true,
    idEmpresa: 0
  };

  constructor(
    private areasService: AreasService,
    private toastCtrl: ToastController,
    private para: ParametrosService
  ) {}

  ngOnInit() {
    this.loadAreas();
  }

  loadAreas() {
    this.areasService.getAreas(this.para.IdEmpresa).subscribe({
      next: (res) => (this.areas = res),
      error: () => this.showToast('Error cargando áreas'),
    });
  }

  openModal(area?: Area) {
    this.isModalOpen = true;
    if (area) {
      this.editingArea = area;
      this.form = { ...area };
    } else {
      this.editingArea = null;
      this.form = { idArea: 0, nombre: '', isActivo: true, idEmpresa: this.para.IdEmpresa };
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.form = { idArea: 0, nombre: '', isActivo: true, idEmpresa: this.para.IdEmpresa };
  }

  saveArea() {
    if (!this.form.nombre.trim()) {
      this.showToast('El nombre es obligatorio');
      return;
    }

    if (this.editingArea) {
      // Editar
      this.areasService.updateArea(this.form.idArea, this.form).subscribe({
        next: () => {
          this.showToast('Área actualizada ✅');
          this.loadAreas();
          this.closeModal();
        },
        error: () => this.showToast('Error al actualizar área ❌'),
      });
    } else {
      // Crear
      this.form.idEmpresa = this.para.IdEmpresa;
      this.areasService.createArea(this.form).subscribe({
        next: () => {
          this.showToast('Área creada ✅');
          this.loadAreas();
          this.closeModal();
        },
        error: () => this.showToast('Error al crear área ❌'),
      });
    }
  }

  deleteArea(id: number) {
    this.areasService.deleteArea(id).subscribe({
      next: () => {
        this.showToast('Área eliminada ✅');
        this.loadAreas();
      },
      error: () => this.showToast('Error al eliminar área ❌'),
    });
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    toast.present();
  }
}
