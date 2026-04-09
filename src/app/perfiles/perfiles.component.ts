import { Component, OnInit } from '@angular/core';
import { PerfilesService } from '../servicios/perfiles.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { PerfilCreate } from '../modals/PerfilCreate.models';
import { PerfilUpdate } from '../models/PerfilUpdate.models';
import { Perfil } from '../models/Perfil .models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AlertController } from '@ionic/angular';

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
    nombre: string;
    seleccionado: boolean;
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
    private modulosService: ModulosService,
    private parametrosService: ParametrosService,
    private alertCtrl: AlertController
  ) {}

  // =====================================================
  // 🚀 INIT
  // =====================================================
  ngOnInit() {
    this.idEmpresa = this.parametrosService.IdEmpresa;
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
    this.modulosService.getModulos()
      .subscribe(resp => {
        this.modulos = (resp || []).map((m: any) => ({
          idModulo: m.idModulo ?? m.id,
          nombre: m.nombre,
          seleccionado: false
        }));
      });
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
    const idsAsignados = perfil.modulos ?? [];

    this.modulos = this.modulos.map(m => ({
      ...m,
      seleccionado: idsAsignados.includes(m.idModulo)
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

  onModuloChange(event: any, modulo: any) {
    modulo.seleccionado = event.detail.checked;
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
