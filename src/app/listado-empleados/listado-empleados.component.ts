import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular';

import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { Empleado } from 'src/app/models/empleado.models';
import { EmpleadoFormComponent } from './empleado-form/empleado-form.component';

@Component({
  selector: 'app-listado-empleados',
  templateUrl: './listado-empleados.component.html',
  styleUrls: ['./listado-empleados.component.scss'],
})
export class ListadoEmpleadosComponent implements OnInit {

  empleados: Empleado[] = [];

  constructor(
    private empleadosSrv: EmpleadosService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  // =====================================================
  // 📋 LISTAR EMPLEADOS
  // =====================================================
  async cargarEmpleados() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando empleados...'
    });
    await loading.present();

    this.empleadosSrv
      .getByEmpresa(this.parametros.IdEmpresa)
      .subscribe({
        next: async (res) => {
          this.empleados = res || [];
          await loading.dismiss();
        },
        error: async () => {
          await loading.dismiss();
          this.toast('❌ Error cargando empleados');
        }
      });
  }

  // =====================================================
  // ➕ CREAR / ✏️ EDITAR
  // =====================================================
  async abrirFormulario(empleado?: Empleado) {
    const modal = await this.modalCtrl.create({
      component: EmpleadoFormComponent,
      componentProps: {
        empleado: empleado ?? null
      }
    });

    modal.onDidDismiss().then(res => {
      if (res.data === true) {
        this.cargarEmpleados();
      }
    });

    await modal.present();
  }

  // =====================================================
  // ❌ ELIMINAR
  // =====================================================
  async eliminarEmpleado(emp: Empleado) {

    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Eliminar el empleado <b>${emp.nombre}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Eliminando...'
            });
            await loading.present();

            this.empleadosSrv.delete(emp.idEmpleados).subscribe({
              next: async () => {
                await loading.dismiss();
                this.toast('Empleado eliminado ✅');
                this.cargarEmpleados();
              },
              error: async () => {
                await loading.dismiss();
                this.toast('❌ Error eliminando empleado');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  // =====================================================
  // 🔔 TOAST
  // =====================================================
  private async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom'
    });
    await t.present();
  }
}
