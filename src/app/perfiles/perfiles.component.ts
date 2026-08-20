import { Component, OnInit } from '@angular/core';
import { PerfilesService } from '../servicios/perfiles.service';
import { EmpresaModulosService } from 'src/app/servicios/empresa-modulos.service';
import { PerfilCreate } from '../modals/PerfilCreate.models';
import { PerfilUpdate } from '../models/PerfilUpdate.models';
import { Perfil } from '../models/Perfil .models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AlertController } from '@ionic/angular';
import { esModuloPermisoSinMenu } from '../config/menu-grupos.config';

@Component({
  selector: 'app-perfiles',
  templateUrl: './perfiles.component.html',
  styleUrls: ['./perfiles.component.scss'],
})
export class PerfilesComponent implements OnInit {

  // ============================
  // 📋 DATA
  // ============================
  perfiles: Perfil[] = [];
  modulos: Array<{
    idModulo: number;
    codigo: string;
    nombre: string;
    seleccionado: boolean;
    esPermiso: boolean;
  }> = [];

  // ============================
  // 🧾 ESTADO / FORM
  // ============================
  modalOpen = false;
  cargando = false;
  perfilEditando: Perfil | null = null;

  idEmpresa = 0;

  form = {
    idPerfil: 0,
    nombre: '',
    descripcion: '',
    activo: true
  };

  constructor(
    private perfilesService: PerfilesService,
    private empresaModulosService: EmpresaModulosService,
    private parametrosService: ParametrosService,
    private alertCtrl: AlertController
  ) {}

  get modulosMenu(): typeof this.modulos {
    return this.modulos.filter(m => !m.esPermiso);
  }

  get modulosPermiso(): typeof this.modulos {
    return this.modulos.filter(m => m.esPermiso);
  }

  // =====================================================
  // 🚀 INIT
  // =====================================================
  ngOnInit() {
    this.idEmpresa = this.parametrosService.IdEmpresa || this.parametrosService.GetIdEmpresa();
    this.cargarPerfiles();
    this.cargarModulos();
  }

  // =====================================================
  // 🔹 CARGAS
  // =====================================================
  cargarPerfiles() {
    if (!this.idEmpresa) return;

    this.perfilesService
      .getPerfiles(this.idEmpresa)
      .subscribe(resp => this.perfiles = resp || []);
  }

  cargarModulos() {
    if (!this.idEmpresa) return;

    this.empresaModulosService.getByEmpresa(this.idEmpresa)
      .subscribe(resp => {
        this.modulos = (resp || [])
          .filter((em: any) => em?.activo !== false && em?.Activo !== false)
          .map((em: any) => {
            const m = em?.modulo ?? em?.Modulo ?? {};
            const codigo = String(m.codigo ?? m.Codigo ?? '').trim().toUpperCase();
            return {
              idModulo: Number(em.moduloId ?? em.ModuloId ?? m.id ?? m.Id ?? 0),
              codigo,
              nombre: m.nombre ?? m.Nombre ?? codigo,
              seleccionado: false,
              esPermiso: esModuloPermisoSinMenu(codigo)
            };
          })
          .filter((m) => m.idModulo > 0);
      });
  }

  toggleModulo(modulo: { seleccionado: boolean }): void {
    modulo.seleccionado = !modulo.seleccionado;
  }

  // =====================================================
  // 🔹 MODAL
  // =====================================================
  abrirModal() {
    this.resetForm();
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.resetForm();
  }

  editar(perfil: Perfil) {
    this.perfilEditando = perfil;

    this.form = {
      idPerfil: perfil.idPerfil,
      nombre: perfil.nombre,
      descripcion: perfil.descripcion || '',
      activo: perfil.activo
    };

    // 🔥 AQUÍ SE USAN LOS MÓDULOS DEL DTO
    const idsAsignados = new Set(
      (perfil.modulos ?? [])
        .map((x: any) => Number(x))
        .filter((n: number) => Number.isFinite(n) && n > 0)
    );

    this.modulos = this.modulos.map(m => ({
      ...m,
      seleccionado: idsAsignados.has(Number(m.idModulo))
    }));

    this.modalOpen = true;
  }

  // =====================================================
  // 💾 GUARDAR (CREAR / EDITAR)
  // =====================================================
  guardar() {
    if (!this.form.nombre || this.cargando) return;

    const modulosSeleccionados = this.modulos
      .filter(m => m.seleccionado)
      .map(m => m.idModulo);

    if (!this.idEmpresa) {
      this.alertSimple('Empresa inválida');
      return;
    }

    if (modulosSeleccionados.length === 0) {
      this.alertSimple('Debe seleccionar al menos un módulo');
      return;
    }

    this.cargando = true;

    // ============================
    // ➕ CREAR
    // ============================
    if (!this.form.idPerfil) {

      const payload: PerfilCreate = {
        idEmpresa: this.idEmpresa,
        nombre: this.form.nombre,
        descripcion: this.form.descripcion,
        activo: this.form.activo,
        modulos: modulosSeleccionados
      };

      this.perfilesService
        .createPerfilCompleto(this.idEmpresa, payload)
        .subscribe({
          next: () => this.finalizarGuardado(),
          error: () => this.errorGuardado()
        });

    }
    // ============================
    // ✏️ EDITAR
    // ============================
    else {

      const payload: PerfilUpdate = {
        idPerfil: this.form.idPerfil,
        idEmpresa: this.idEmpresa,
        nombre: this.form.nombre,
        descripcion: this.form.descripcion,
        activo: this.form.activo,
        modulos: modulosSeleccionados
      };

      this.perfilesService
        .updatePerfilCompleto(payload)
        .subscribe({
          next: () => this.finalizarGuardado(),
          error: () => this.errorGuardado()
        });
    }
  }

  private finalizarGuardado() {
    this.cargando = false;
    this.cerrarModal();
    this.cargarPerfiles();
    void this.alertSimple(
      'Perfil guardado. Si cambiaste módulos del usuario con el que estás logueado, cierra sesión y vuelve a entrar para actualizar el menú.'
    );
  }

  private errorGuardado() {
    this.cargando = false;
    this.alertSimple('Ocurrió un error guardando el perfil');
  }

  // =====================================================
  // 🗑️ ELIMINAR
  // =====================================================
  async eliminar(perfil: Perfil) {

    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Deseas eliminar el perfil <strong>${perfil.nombre}</strong>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.perfilesService
              .deletePerfil(perfil.idPerfil)
              .subscribe({
                next: () => this.cargarPerfiles(),
                error: () => this.alertSimple('No se pudo eliminar el perfil')
              });
          }
        }
      ]
    });

    await alert.present();
  }

  // =====================================================
  // 🔹 UTIL
  // =====================================================
  resetForm() {
    this.perfilEditando = null;

    this.form = {
      idPerfil: 0,
      nombre: '',
      descripcion: '',
      activo: true
    };

    this.modulos = this.modulos.map(m => ({
      ...m,
      seleccionado: false
    }));
  }

  trackByPerfil(_: number, item: Perfil) {
    return item.idPerfil;
  }

  trackByModulo(_: number, item: any) {
    return item.idModulo;
  }

  get puedeGuardar(): boolean {
    return (
      !this.cargando &&
      !!this.form.nombre &&
      this.modulos.some(m => m.seleccionado)
    );
  }

  private async alertSimple(msg: string) {
    const alert = await this.alertCtrl.create({
      header: 'Aviso',
      message: msg,
      buttons: ['OK']
    });
    await alert.present();
  }
}
