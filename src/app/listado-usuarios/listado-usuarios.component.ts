import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  ToastController,
  AlertController,
  LoadingController
} from '@ionic/angular';

import { UsuariosService } from 'src/app/servicios/usuarios.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { SucursalService } from 'src/app/servicios/sucursal.service';
import { UsuarioformComponent } from '../usuarioform/usuarioform.component';
import { UsuarioDto } from '../models/usuariodto.model';
import { SucursalSesion } from '../models/sucursal-sesion.models';
import { forkJoin } from 'rxjs';

function esPerfilAdministradorNombre(nombre: string): boolean {
  const n = (nombre || '').trim();
  if (!n) return false;
  return n.toLowerCase() === 'administrador' || n.toUpperCase().includes('ADMIN');
}

function etiquetaSucursal(
  rol: string,
  idSucursal: number | null,
  sucursales: SucursalSesion[]
): string {
  if (esPerfilAdministradorNombre(rol)) return 'Todas';
  const suc = sucursales.find(s => s.idSucursal === idSucursal);
  return suc?.nombre ?? (idSucursal ? `Sucursal ${idSucursal}` : 'Sin sucursal');
}

@Component({
  selector: 'app-listado-usuarios',
  templateUrl: './listado-usuarios.component.html',
  styleUrls: ['./listado-usuarios.component.scss'],
})
export class ListadoUsuariosComponent implements OnInit {

  usuarios: UsuarioDto[] = [];
  maxUsuariosPermitidos = 1;
  usuariosRegistrados = 0;
  puedeAgregarUsuario = true;

  constructor(
    private usuariosSrv: UsuariosService,
    private parametrosSrv: ParametrosService,
    private sucursalSrv: SucursalService,
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

    forkJoin({
      cupo: this.usuariosSrv.getUsuariosConCupo(this.parametrosSrv.IdEmpresa),
      sucursales: this.sucursalSrv.listar()
    }).subscribe({
        next: async ({ cupo: res, sucursales }) => {
          this.maxUsuariosPermitidos = res.limiteUsuario;
          this.usuariosRegistrados = res.usuariosRegistrados;
          this.puedeAgregarUsuario = res.puedeAgregar;

          const lista = res.usuarios ?? [];

          this.usuarios = lista.map((u: any): UsuarioDto => {
            const rol = u.perfil?.nombre ?? 'Sin perfil';
            const idSucursal = Number(u.idSucursalActiva ?? u.idSucursal ?? 0) || null;
            return {
            idusuario: u.idUsuario,
            nombre: u.empleadoNombre ?? u.empleado?.nombre ?? u.userName,
            correo: u.correo ?? u.userName,
            rol,
            estado: u.estado,
            activo: u.estado,
            idEmpresa: u.idEmpresa,
            idEmpleado: u.idEmpleado,
            idPerfil: u.idPerfil,
            idSucursal,
            sucursalNombre: etiquetaSucursal(rol, idSucursal, sucursales),
            direccion: u.direccion,
            celular: u.celular,
            password: '',
            puedeEliminarOrden: u.puedeEliminarOrden || false,
            puedeEliminarItemCarrito: u.puedeEliminarItemCarrito || false,
            puedeDisminuirCantidadCarrito: u.puedeDisminuirCantidadCarrito || false,
            puedeEditarPrecioCarrito: u.puedeEditarPrecioCarrito || false,
            puedeAnularFactura: u.puedeAnularFactura || false
          };
          });

          await loading.dismiss();
        },
        error: async () => {
          await loading.dismiss();
          this.toast('Error cargando usuarios ❌');
        }
      });
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
