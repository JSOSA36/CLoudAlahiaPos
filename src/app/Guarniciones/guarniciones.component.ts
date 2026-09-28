import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { GuarnicionesService } from 'src/app/servicios/guarniciones.service';
import { Guarnicion } from 'src/app/models/guarnicion.model';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-guarniciones',
  templateUrl: './guarniciones.component.html',
  styleUrls: ['./guarniciones.component.scss'],
})
export class GuarnicionesComponent implements OnInit {
  lista: Guarnicion[] = [];
  isModalOpen = false;
  editando: Guarnicion | null = null;
  nombre = '';

  constructor(
    private guarniciones: GuarnicionesService,
    private toastCtrl: ToastController,
    private parametro: ParametrosService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.guarniciones.listar(this.parametro.IdEmpresa).subscribe({
      next: (res) => this.lista = res || [],
      error: () => this.toast('No se pudieron cargar las guarniciones')
    });
  }

  abrir(row?: Guarnicion) {
    this.editando = row || null;
    this.nombre = row?.nombre || '';
    this.isModalOpen = true;
  }

  cerrar() {
    this.isModalOpen = false;
    this.editando = null;
    this.nombre = '';
  }

  guardar() {
    const nombre = (this.nombre || '').trim();
    if (!nombre) {
      this.toast('El nombre es obligatorio');
      return;
    }

    const req = this.editando
      ? this.guarniciones.actualizar(this.editando.idGuarnicion, {
          idGuarnicion: this.editando.idGuarnicion,
          idEmpresa: this.parametro.IdEmpresa,
          nombre,
          activo: true
        })
      : this.guarniciones.crear({
          idEmpresa: this.parametro.IdEmpresa,
          nombre,
          activo: true
        });

    req.subscribe({
      next: () => {
        this.toast(this.editando ? 'Guarnición actualizada' : 'Guarnición registrada');
        this.cerrar();
        this.cargar();
      },
      error: (err) => this.toast(err?.error || 'No se pudo guardar')
    });
  }

  eliminar(row: Guarnicion) {
    this.guarniciones.eliminar(row.idGuarnicion).subscribe({
      next: () => {
        this.toast('Guarnición eliminada');
        this.cargar();
      },
      error: () => this.toast('No se pudo eliminar')
    });
  }

  private async toast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'bottom'
    });
    toast.present();
  }
}
