import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { Empleado } from 'src/app/models/empleado.models';

@Component({
  selector: 'app-empleado-form',
  templateUrl: './empleado-form.component.html',
  styleUrls: ['./empleado-form.component.scss'],
})
export class EmpleadoFormComponent implements OnInit {

  @Input() empleado: Empleado | null = null;

  form!: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private empleadosService: EmpleadosService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: [this.empleado?.nombre || '', Validators.required],
      rol: [this.empleado?.ocupacion || '', Validators.required],
      celular: [this.empleado?.celular || ''],
      direccion: [this.empleado?.direccion || '']
    });
  }

  // =====================================================
  // 💾 GUARDAR
  // =====================================================
  async guardar() {

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast('Complete los campos obligatorios ❌');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.empleado ? 'Actualizando empleado...' : 'Creando empleado...',
      spinner: 'crescent'
    });
    await loading.present();

    const data: Empleado = {
      idEmpleados: this.empleado?.idEmpleados || 0,
      idEmpresa: this.parametros.IdEmpresa,
      nombre: this.form.value.nombre,
      ocupacion: this.form.value.rol,
      celular: this.form.value.celular,
      direccion: this.form.value.direccion,
      estado: true
    };

    const request$ = this.empleado
      ? this.empleadosService.update(data)
      : this.empleadosService.create(data);

    request$.subscribe({
      next: async () => {
        await loading.dismiss();
        this.toast(
          this.empleado
            ? 'Empleado actualizado ✅'
            : 'Empleado creado ✅'
        );
        this.modalCtrl.dismiss(true);
      },
      error: async () => {
        await loading.dismiss();
        this.toast('Error guardando empleado ❌');
      }
    });
  }

  cerrar() {
    this.modalCtrl.dismiss(false);
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
