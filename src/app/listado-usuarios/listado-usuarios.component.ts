import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  ToastController,
  AlertController,
  LoadingController
} from '@ionic/angular';

import { UsuariosService } from 'src/app/servicios/usuarios.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { UsuarioformComponent } from '../usuarioform/usuarioform.component';
import { UsuarioDto } from '../models/usuariodto.model';

@Component({
  selector: 'app-listado-usuarios',
  templateUrl: './listado-usuarios.component.html',
  styleUrls: ['./listado-usuarios.component.scss'],
})
export class ListadoUsuariosComponent implements OnInit {

  usuarios: UsuarioDto[] = [];
  maxUsuariosPermitidos = 0;

  constructor(
    private usuariosSrv: UsuariosService,
    private parametrosSrv: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  // =====================================================
  // 📋 LISTAR USUARIOS
  // =====================================================
  async cargarUsuarios() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando usuarios...'
    });
    await loading.present();

    this.usuariosSrv
      .getUsuarios(this.parametrosSrv.IdEmpresa)
      .subscribe({
        next: async (res: any) => {

          console.log('Usuarios cargados:', res);

          this.maxUsuariosPermitidos = res.maxUsuarios ?? 0;

          const lista = res.usuarios ?? res;

          // 🔥 SIN FILTROS POR ROL
          this.usuarios = lista.map((u: any): UsuarioDto => ({
            idusuario: u.idUsuario,
            nombre: u.empleadoNombre ?? u.userName,
            correo: u.correo ?? u.userName,
          rol: u.perfil?.nombre ?? 'Sin perfil',

            estado: u.estado,
            idEmpresa: u.idEmpresa,
            direccion: u.direccion,
            celular: u.celular,
            password: '',
            puedeEliminarOrden: u.puedeEliminarOrden || false
          }));

          await loading.dismiss();
        },
        error: async () => {
          await loading.dismiss();
          this.toast('Error cargando usuarios ❌');
        }
      });
  }

  // =====================================================
  // 🔐 LÍMITE DE PLAN
  // =====================================================
  get puedeAgregarUsuario(): boolean {
    if (this.maxUsuariosPermitidos === 0) return true;
    return this.usuarios.length < this.maxUsuariosPermitidos;
  }

  // =====================================================
  // ➕ / ✏️ MODAL USUARIO
  // =====================================================
  async abrirModal(usuario: UsuarioDto | null = null) {

    if (!usuario && !this.puedeAgregarUsuario) {
      this.toast(
        `🚫 Límite de usuarios alcanzado (${this.maxUsuariosPermitidos})`
      );
      return;
    }

    const modal = await this.modalCtrl.create({
      component: UsuarioformComponent,
      componentProps: { usuario }
    });

    modal.onDidDismiss().then(res => {
      if (res.data) this.cargarUsuarios();
    });

    await modal.present();
  }

  // =====================================================
  // 🗑️ ELIMINAR USUARIO
  // =====================================================
  async eliminarUsuario(usuario: UsuarioDto) {

    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Eliminar el usuario <b>${usuario.nombre}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Eliminando usuario...'
            });
            await loading.present();

            this.usuariosSrv
              .deleteUsuario(usuario.idusuario!)
              .subscribe({
                next: async () => {
                  await loading.dismiss();
                  this.toast('Usuario eliminado ✅');
                  this.cargarUsuarios();
                },
                error: async () => {
                  await loading.dismiss();
                  this.toast('Error eliminando usuario ❌');
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
