import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ModalController,
  ToastController,
  LoadingController
} from '@ionic/angular';

import { UsuariosService } from 'src/app/servicios/usuarios.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PerfilesService } from 'src/app/servicios/perfiles.service';
import { EmpleadosService } from 'src/app/servicios/empleados.service';

@Component({
  selector: 'app-usuarioform',
  templateUrl: './usuarioform.component.html',
  styleUrls: ['./usuarioform.component.scss'],
})
export class UsuarioformComponent implements OnInit {

  @Input() usuario: any = null;

  form!: FormGroup;

  perfiles: any[] = [];
  empleados: any[] = [];

  private empleadoIdEdicion: number | null = null;
  private perfilIdEdicion: number | null = null;

  constructor(
    private fb: FormBuilder,
    private usuariosSrv: UsuariosService,
    private parametrosSrv: ParametrosService,
    private perfilesSrv: PerfilesService,
    private empleadosSrv: EmpleadosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {

    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      idEmpleados: [null, Validators.required],
      idPerfil: [null, Validators.required],
      activo: [true],
      password: ['']
    });

    if (this.usuario) {
      this.empleadoIdEdicion =
        this.usuario.idEmpleado ?? this.usuario.empleado?.idEmpleados;

      this.perfilIdEdicion =
        this.usuario.idPerfil ?? this.usuario.perfil?.idPerfil;

      this.form.patchValue({
        correo: this.usuario.correo,
        activo: this.usuario.activo
      });
    } else {
      this.form.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(6)
      ]);
    }

    this.cargarEmpleados();
    this.cargarPerfiles();
  }
compareById = (a: any, b: any) => {
  return Number(a) === Number(b);
};

  cargarEmpleados() {
    this.empleadosSrv
      .getByEmpresa(this.parametrosSrv.IdEmpresa)
      .subscribe(res => {
        console.log('Empleados cargados:', res);
        this.empleados = res || [];
        if (this.empleadoIdEdicion) {
          this.form.patchValue({ idEmpleado: this.empleadoIdEdicion });
        }
      });
  }

  cargarPerfiles() {
    this.perfilesSrv
      .getPerfiles(this.parametrosSrv.IdEmpresa)
      .subscribe(res => {
        this.perfiles = res || [];
        if (this.perfilIdEdicion) {
          this.form.patchValue({ idPerfil: this.perfilIdEdicion });
        }
      });
  }

  async guardar() {

  this.form.markAllAsTouched();

  if (this.form.invalid) {
    this.toast('Complete los campos obligatorios ❌');
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: this.usuario
      ? 'Actualizando usuario...'
      : 'Creando usuario...',
    spinner: 'crescent'
  });

  await loading.present();

  const payload: any = {
    IdEmpresa: this.parametrosSrv.IdEmpresa,
    idusuario:
      this.usuario?.idUsuario ??
      this.usuario?.idusuario ??
      null,
    idEmpleado: this.form.value.idEmpleados,
    idPerfil: this.form.value.idPerfil,
    correo: this.form.value.correo,
    userName: this.form.value.correo,
    activo: this.form.value.activo
  };

  if (this.form.value.password) {
    payload.password = this.form.value.password;
  }

  console.log('Payload a enviar:', payload);

  const request = this.usuario
    ? this.usuariosSrv.updateUsuario(payload)
    : this.usuariosSrv.createUsuario(payload);

  request.subscribe({
    next: async (resp: any) => {
      await loading.dismiss();

      const mensajeServidor =
        resp?.message ??
        (this.usuario
          ? 'Usuario actualizado correctamente ✅'
          : 'Usuario creado correctamente ✅');

      this.toast(mensajeServidor);

      this.modalCtrl.dismiss(true);
    },

    error: async (err) => {
      await loading.dismiss();

      console.error('Error backend:', err);

      let mensaje = '❌ Error guardando usuario';

      if (err?.error) {
        if (typeof err.error === 'string') {
          mensaje = err.error;
        } else if (err.error?.message) {
          mensaje = err.error.message;
        }
      }

      this.toast(mensaje);
    }
  });
}


  cerrar() {
    this.modalCtrl.dismiss(false);
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom'
    });
    await t.present();
  }
}
