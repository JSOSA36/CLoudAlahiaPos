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
import { SucursalService } from 'src/app/servicios/sucursal.service';
import { SucursalSesion } from '../models/sucursal-sesion.models';

function esPerfilAdministradorNombre(nombre: string): boolean {
  const n = (nombre || '').trim();
  if (!n) return false;
  return n.toLowerCase() === 'administrador' || n.toUpperCase().includes('ADMIN');
}

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
  sucursales: SucursalSesion[] = [];

  private empleadoIdEdicion: number | null = null;
  private perfilIdEdicion: number | null = null;
  private sucursalIdEdicion: number | null = null;

  constructor(
    private fb: FormBuilder,
    private usuariosSrv: UsuariosService,
    private parametrosSrv: ParametrosService,
    private perfilesSrv: PerfilesService,
    private empleadosSrv: EmpleadosService,
    private sucursalSrv: SucursalService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {

    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      idEmpleados: [null, Validators.required],
      idPerfil: [null, Validators.required],
      idSucursal: [null, Validators.required],
      activo: [true],
      password: [''],
      puedeEliminarOrden: [false],
      puedeEliminarItemCarrito: [false],
      puedeDisminuirCantidadCarrito: [false],
      puedeEditarPrecioCarrito: [false],
      puedeAnularFactura: [false]
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

      this.sucursalIdEdicion = Number(
        this.usuario.idSucursal
          ?? this.usuario.idSucursalActiva
          ?? 0
      ) || null;

      this.form.patchValue({
        correo: this.usuario.correo,
        idEmpleados: this.empleadoIdEdicion,
        idPerfil: this.perfilIdEdicion,
        idSucursal: this.sucursalIdEdicion,
        activo: this.usuario.activo ?? this.usuario.estado,
        puedeEliminarOrden: this.usuario.puedeEliminarOrden || false,
        puedeEliminarItemCarrito: this.usuario.puedeEliminarItemCarrito || false,
        puedeDisminuirCantidadCarrito: this.usuario.puedeDisminuirCantidadCarrito || false,
        puedeEditarPrecioCarrito: this.usuario.puedeEditarPrecioCarrito || false,
        puedeAnularFactura: this.usuario.puedeAnularFactura || false
      });
    } else {
      this.form.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(6)
      ]);
    }

    this.form.get('idPerfil')?.valueChanges.subscribe(() => this.aplicarReglaSucursal());
    this.form.get('idEmpleados')?.valueChanges.subscribe(() => this.aplicarSucursalDesdeEmpleado());

    this.cargarEmpleados();
    this.cargarPerfiles();
    this.cargarSucursales();
  }

  get esPerfilAdministrador(): boolean {
    const id = Number(this.form?.value?.idPerfil ?? 0);
    const perfil = this.perfiles.find(
      (p: any) => Number(p?.idPerfil ?? p?.IdPerfil) === id
    );
    return esPerfilAdministradorNombre(String(perfil?.nombre ?? perfil?.Nombre ?? ''));
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
        this.aplicarSucursalDesdeEmpleado();
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
        this.aplicarReglaSucursal();
      });
  }

  cargarSucursales() {
    this.sucursalSrv.listar().subscribe(res => {
      this.sucursales = res || [];
      if (this.sucursalIdEdicion) {
        this.form.patchValue({ idSucursal: this.sucursalIdEdicion });
      }
      this.aplicarReglaSucursal();
    });
  }

  private aplicarReglaSucursal() {
    const ctrl = this.form.get('idSucursal');
    if (!ctrl) return;

    if (this.esPerfilAdministrador) {
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

  private aplicarSucursalDesdeEmpleado() {
    if (this.esPerfilAdministrador) return;
    const idEmp = Number(this.form.get('idEmpleados')?.value ?? 0);
    if (!idEmp) return;
    const emp = this.empleados.find(
      (e: any) => Number(e?.idEmpleados ?? e?.idEmpleado ?? e?.IdEmpleados) === idEmp
    );
    const idSuc = Number(emp?.idSucursal ?? emp?.IdSucursal ?? 0);
    if (idSuc > 0) {
      this.form.patchValue({ idSucursal: idSuc }, { emitEvent: false });
    }
  }

  async guardar() {

  this.form.markAllAsTouched();

  if (this.form.invalid || !Number(this.form.value.idPerfil) || !Number(this.form.value.idEmpleados)) {
    this.toast('Complete los campos obligatorios ❌');
    return;
  }

  if (!this.esPerfilAdministrador && !Number(this.form.value.idSucursal)) {
    this.toast('Indique la sucursal del usuario ❌');
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
    idSucursal: this.esPerfilAdministrador
      ? null
      : Number(this.form.value.idSucursal) || null,
    correo: this.form.value.correo,
    userName: this.form.value.correo,
    activo: this.form.value.activo,
    puedeEliminarOrden: this.form.value.puedeEliminarOrden,
    puedeEliminarItemCarrito: this.form.value.puedeEliminarItemCarrito,
    puedeDisminuirCantidadCarrito: this.form.value.puedeDisminuirCantidadCarrito,
    puedeEditarPrecioCarrito: this.form.value.puedeEditarPrecioCarrito,
    puedeAnularFactura: this.form.value.puedeAnularFactura
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
