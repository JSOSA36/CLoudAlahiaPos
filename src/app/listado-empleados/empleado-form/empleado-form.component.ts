import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { SucursalService } from 'src/app/servicios/sucursal.service';
import { Empleado } from 'src/app/models/empleado.models';
import { SucursalSesion, normalizarSucursalesSesion } from 'src/app/models/sucursal-sesion.models';

function esOcupacionAdministrador(nombre: string): boolean {
  const n = (nombre || '').trim();
  if (!n) return false;
  return n.toLowerCase() === 'administrador' || n.toUpperCase().includes('ADMIN');
}

@Component({
  selector: 'app-empleado-form',
  templateUrl: './empleado-form.component.html',
  styleUrls: ['./empleado-form.component.scss'],
})
export class EmpleadoFormComponent implements OnInit {

  @Input() empleado: Empleado | null = null;

  form!: FormGroup;
  sucursales: SucursalSesion[] = [];
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private empleadosService: EmpleadosService,
    private sucursalSrv: SucursalService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: [this.empleado?.nombre || '', Validators.required],
      rol: [this.empleado?.ocupacion || '', Validators.required],
      idSucursal: [this.empleado?.idSucursal || null, Validators.required],
      celular: [this.empleado?.celular || ''],
      direccion: [this.empleado?.direccion || '']
    });

    this.form.get('rol')?.valueChanges.subscribe(() => this.aplicarReglaSucursal());
    this.parametros.ensureSessionFromStorage();
    this.cargarSucursales();
    this.aplicarReglaSucursal();
  }

  get esOcupacionAdmin(): boolean {
    return esOcupacionAdministrador(String(this.form?.value?.rol ?? ''));
  }

  compareById = (a: any, b: any) => Number(a) === Number(b);

  cargarSucursales() {
    const fallback = () => {
      const deSesion = this.parametros.sucursales || [];
      if (deSesion.length) return deSesion;
      try {
        return normalizarSucursalesSesion(JSON.parse(localStorage.getItem('sucursales') || '[]'));
      } catch {
        return [];
      }
    };

    this.sucursalSrv.listar().subscribe({
      next: res => {
        this.sucursales = (res && res.length) ? res : fallback();
        if (this.empleado?.idSucursal) {
          this.form.patchValue({ idSucursal: this.empleado.idSucursal });
        }
        this.aplicarReglaSucursal();
      },
      error: () => {
        this.sucursales = fallback();
        this.aplicarReglaSucursal();
      }
    });
  }

  private aplicarReglaSucursal() {
    const ctrl = this.form.get('idSucursal');
    if (!ctrl) return;

    if (this.esOcupacionAdmin) {
      ctrl.clearValidators();
      ctrl.setValue(null, { emitEvent: false });
    } else {
      ctrl.setValidators([Validators.required]);
      if (!Number(ctrl.value) && this.sucursales.length === 1) {
        ctrl.setValue(this.sucursales[0].idSucursal, { emitEvent: false });
      }
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
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

    if (!this.esOcupacionAdmin && !Number(this.form.value.idSucursal)) {
      this.toast('Indique la sucursal del empleado ❌');
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
      estado: true,
      idSucursal: this.esOcupacionAdmin
        ? null
        : Number(this.form.value.idSucursal) || null
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
      error: async (err) => {
        await loading.dismiss();
        let mensaje = 'Error guardando empleado ❌';
        if (typeof err?.error === 'string') mensaje = err.error;
        else if (err?.error?.message) mensaje = err.error.message;
        this.toast(mensaje);
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
