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
      password: [''],
      puedeEliminarOrden: [false],
      puedeEliminarItemCarrito: [false],
      puedeDisminuirCantidadCarrito: [false],
      puedeEditarPrecioCarrito: [false]
    });

    if (this.usuario) {
      this.empleadoIdEdicion = Number(
        this.usuario.idEmpleado
          ?? this.usuario.idEmpleados
          ?? this.usuario.empleado?.idEmpleados
          ?? this.usuario.empleado?.idEmpleado
          ?? 0
      ) || null;

      this.perfilIdEdicion = Number(
        this.usuario.idPerfil
          ?? this.usuario.perfil?.idPerfil
          ?? this.usuario.perfil?.IdPerfil
          ?? 0
      ) || null;

      this.form.patchValue({
        correo: this.usuario.correo,
        idEmpleados: this.empleadoIdEdicion,
        idPerfil: this.perfilIdEdicion,
        activo: this.usuario.activo ?? this.usuario.estado,
        puedeEliminarOrden: this.usuario.puedeEliminarOrden || false,
        puedeEliminarItemCarrito: this.usuario.puedeEliminarItemCarrito || false,
        puedeDisminuirCantidadCarrito: this.usuario.puedeDisminuirCantidadCarrito || false,
        puedeEditarPrecioCarrito: this.usuario.puedeEditarPrecioCarrito || false
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
          this.form.patchValue({ idEmpleados: this.empleadoIdEdicion });
        }
      });
  }

  cargarPerfiles() {
    this.perfilesSrv
      .getPerfiles(this.parametrosSrv.IdEmpresa)
      .subscribe(res => {
        this.perfiles = (res || []).map((p: any) => ({
          ...p,
          idPerfil: Number(p?.idPerfil ?? p?.IdPerfil ?? 0),
          nombre: p?.nombre ?? p?.Nombre ?? ''
        }));
        if (this.perfilIdEdicion) {
          this.form.patchValue({ idPerfil: Number(this.perfilIdEdicion) });
        }
      });
  }

  async guardar() {

  this.form.markAllAsTouched();

  if (this.form.invalid || !Number(this.form.value.idPerfil) || !Number(this.form.value.idEmpleados)) {
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

  const idUsuario =
    this.usuario?.idUsuario ??
    this.usuario?.idusuario ??
    null;

  const payload: any = {
    IdEmpresa: this.parametrosSrv.IdEmpresa,
    idusuario: idUsuario,
    idUsuario,
    idEmpleado: Number(this.form.value.idEmpleados) || 0,
    idPerfil: Number(this.form.value.idPerfil) || 0,
    correo: this.form.value.correo,
    userName: this.form.value.correo,
    activo: this.form.value.activo,
    puedeEliminarOrden: this.form.value.puedeEliminarOrden,
    puedeEliminarItemCarrito: this.form.value.puedeEliminarItemCarrito,
    puedeDisminuirCantidadCarrito: this.form.value.puedeDisminuirCantidadCarrito,
    puedeEditarPrecioCarrito: this.form.value.puedeEditarPrecioCarrito
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
      this.sincronizarSesionSiEsUsuarioActual(payload);
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

  /** Si se cambió el perfil del usuario logueado, el menú debe recargarse ya. */
  private sincronizarSesionSiEsUsuarioActual(payload: any): void {
    const idUsuario = Number(payload?.idusuario ?? payload?.idUsuario ?? 0);
    if (!idUsuario || idUsuario !== Number(this.parametrosSrv.IdUsuario)) return;

    const idPerfil = Number(payload?.idPerfil ?? 0);
    const perfil = this.perfiles.find(
      (p: any) => Number(p?.idPerfil ?? p?.IdPerfil) === idPerfil
    );
    const nombrePerfil = String(perfil?.nombre ?? perfil?.Nombre ?? '');

    this.parametrosSrv.IdPerfil = idPerfil;
    this.parametrosSrv.Rol = nombrePerfil;
    localStorage.setItem('IdPerfil', String(idPerfil));

    try {
      const raw = localStorage.getItem('usuario');
      const u = raw ? JSON.parse(raw) : {};
      u.idPerfil = idPerfil;
      u.IdPerfil = idPerfil;
      u.nombrePerfil = nombrePerfil;
      localStorage.setItem('usuario', JSON.stringify(u));
    } catch {
      /* ignore */
    }

    this.parametrosSrv.sessionStarted$.next();
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
