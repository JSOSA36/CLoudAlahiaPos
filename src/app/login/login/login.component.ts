import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ModalController,
  LoadingController,
  Platform
} from '@ionic/angular';

import { ParametrosService } from 'src/app/servicios/parametros.service';
import { MessageModalComponent } from 'src/app/message-modal/message-modal.component';
import { AuthService } from 'src/app/servicios/auth.service';
import { DgiiConfigService } from 'src/app/servicios/dgii-config.service';
import { WhatsappPlanesComponent } from 'src/app/whatsapp-planes/whatsapp-planes.component';
import { PoliticasGateService } from 'src/app/servicios/politicas-gate.service';
import { NotificacionesService } from 'src/app/servicios/notificaciones.service';
import { TicketDesdeLoginComponent } from 'src/app/tickets/ticket-desde-login.component';
// OneSignal
declare const OneSignal: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {

  Usuario = '';
  PassWord = '';
  logoUrl = 'assets/Logo.png';
  logoFallback = 'assets/favicon.svg';

  constructor(
    private router: Router,
    private authService: AuthService,
    private parametros: ParametrosService,
    private dgiiConfig: DgiiConfigService,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private platform: Platform,
    private politicasGate: PoliticasGateService,
    private notificaciones: NotificacionesService
  ) {}

  // ❌ NO limpiar sesión aquí
  ngOnInit() {}

  onLogoError(): void {
    if (this.logoUrl !== this.logoFallback) {
      this.logoUrl = this.logoFallback;
    }
  }

  async abrirTicketSoporte() {
    const modal = await this.modalCtrl.create({
      component: TicketDesdeLoginComponent,
      componentProps: {
        userName: this.Usuario || '',
        password: this.PassWord || ''
      },
      cssClass: 'modal-politicas-full'
    });
    await modal.present();
  }

async abrirPlanesWhatsApp() {
    const modal = await this.modalCtrl.create({
      component: WhatsappPlanesComponent,
      cssClass: 'alahia-planes-modal', // opcional (para estilos)
      backdropDismiss: true,
    });

    // ✅ Recibir data al cerrar
    modal.onDidDismiss().then(({ data }) => {
      if (data?.plan) {
       // this.activarPlan(data.plan);
      }
    });

    await modal.present();
  }
  // ===============================
  // 🔥 MODAL MENSAJES
  // ===============================
 private async mostrarMensaje(
  title: string,
  message: string,
  icon: string = 'alert-circle-outline',
  mostrarCambioPlan: boolean = false,
  mostrarPago: boolean = false,
  extras: { diaCobro?: number; diasRestantes?: number } = {}
): Promise<boolean> {
  const modal = await this.modalCtrl.create({
    component: MessageModalComponent,
    cssClass: 'modal-clientes-full',
    componentProps: {
      title,
      message,
      icon,
      mostrarCambioPlan,
      mostrarPago,
      diaCobro: extras.diaCobro,
      diasRestantes: extras.diasRestantes
    }
  });

  await modal.present();
  const { data } = await modal.onDidDismiss();
  return data === true;
}
activarAudioGlobal(): Promise<void> {

  return new Promise((resolve) => {

    const audio = new Audio('/assets/nuevacita.mp3');
    audio.volume = 0.01;

    audio.play()
      .then(() => {
        audio.pause();
        resolve();
      })
      .catch(() => {
        resolve();
      });

  });

}
private async desbloquearAudio(): Promise<void> {

  return new Promise((resolve) => {

    const audio = new Audio('/assets/nuevacita.mp3');
    audio.volume = 0.01;

    audio.play()
      .then(() => {
        audio.pause();
        resolve();
      })
      .catch(() => {
        resolve();
      });

  });

}


  // ===============================
  // 🔐 LOGIN
  // ===============================
async login() {

  localStorage.setItem('audioUnlocked', 'true');

  if (!this.Usuario || !this.PassWord) {
    await this.mostrarMensaje(
      'Campos requeridos',
      'Debes ingresar usuario y contraseña',
      'alert-circle-outline',
      false
    );
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: 'Iniciando sesión...',
    spinner: 'crescent'
  });

  await loading.present();

  const deviceId = this.obtenerDeviceId();

  this.authService.login(this.Usuario, this.PassWord, deviceId)
    .subscribe({

      next: async (resp: any) => {

        // 🔴 SESIÓN ACTIVA
        if (resp?.errorSesion) {
          await loading.dismiss();

          await this.mostrarMensaje(
            'Sesión activa',
            'Este usuario ya está conectado en otro dispositivo.',
            'alert-circle-outline',
            false
          );
          return;
        }

        // 🟢 UPGRADE
        if (resp?.requiereUpgrade) {

          this.parametros.IdEmpresa = resp?.empresa?.idEmpresa || 0;

          await loading.dismiss();

          await this.mostrarMensaje(
            'Plan agotado',
            resp?.mensaje || 'Has alcanzado el límite de tu plan',
            'alert-circle-outline',
            true
          );

          return;
        }

        // 🔴 Servicio suspendido / pago en validación
        if (resp?.bloqueado) {
          await loading.dismiss();
          if (resp?.token) {
            localStorage.setItem('token_sesion', resp.token);
          }
          this.parametros.IdEmpresa = resp?.empresa?.idEmpresa || 0;
          this.parametros.NombreEmpresa = resp?.empresa?.nombreComercial || '';
          this.parametros.IdUsuario = resp?.usuario?.idUsuario || 0;
          this.parametros.setLoginData(
            resp?.usuario?.userName || this.Usuario,
            this.PassWord,
            resp?.empresa?.idEmpresa || 0,
            resp?.token || '',
            '',
            resp?.usuario?.idUsuario || 0,
            resp?.usuario
          );
          this.router.navigateByUrl('/servicio-suspendido', {
            replaceUrl: true,
            state: {
              mensaje: resp?.mensaje || resp?.alertaPlan?.mensaje,
              estadoServicio: resp?.estadoServicio || resp?.empresa?.estadoServicio,
              precioPlan: resp?.empresa?.precioPlan || 0,
              montoPlan: resp?.empresa?.montoPlan || 0,
              montoCargos: resp?.empresa?.montoCargos || 0,
              desgloseFactura: resp?.empresa?.desgloseFactura || [],
              nombreEmpresa: resp?.empresa?.nombreComercial,
              puedeReportarPago: resp?.puedeReportarPago !== false,
              pagoEnValidacion: !!resp?.pagoEnValidacion
            }
          });
          return;
        }

        const empresa = resp?.empresa || {};
        const usuario = resp?.usuario || {};
        const modulos = resp?.modulos || [];

        // 🔐 TOKEN
        if (resp?.token) {
          localStorage.setItem('token_sesion', resp.token);
        }

        
        // 📦 PARAMETROS
        this.parametros.ApiPrint = empresa.apiPrint || '';
        this.parametros.IdEmpresa = empresa.idEmpresa || 0;
        this.parametros.NombreEmpresa = empresa.nombreComercial || '';
        this.parametros.nombrePlan = empresa.nombrePlan || '';
        this.parametros.puedeEliminarOrden = usuario.puedeEliminarOrden || false;
        this.parametros.PuedeEliminarItemCarrito = usuario.puedeEliminarItemCarrito || false;
        this.parametros.PuedeDisminuirCantidadCarrito = usuario.puedeDisminuirCantidadCarrito || false;
        this.parametros.PuedeEditarPrecioCarrito = usuario.puedeEditarPrecioCarrito || false;



        localStorage.setItem('menu_modulos', JSON.stringify(modulos));

        // Solo contador en login; el detalle vive en el Centro de Notificaciones
        this.notificaciones.seedUnreadFromLogin(Number(resp?.notificacionesNoLeidas || 0));

        this.parametros.setLoginData(
          usuario.userName || '',
          this.PassWord,
          empresa.idEmpresa || 0,
          resp?.token || '',
          usuario.rol || usuario.nombrePerfil || '',
          usuario.idUsuario || 0,
          usuario
        );

        this.parametros.setModulosActivos(
          modulos.map((m: any) => m.moduloId),
          modulos.map((m: any) => m.codigo).filter((c: string) => !!c)
        );

        // Flags DGII (sin fila / apagado = fiscal off; no bloquea login)
        this.dgiiConfig.getFeatures(empresa.idEmpresa || 0).subscribe({
          next: (features) => this.parametros.setFiscalFeatures(features),
          error: () => this.parametros.setFiscalFeatures(null)
        });

        // 🔔 ONESIGNAL
        try {
          if (empresa.idEmpresa && usuario.idUsuario) {

            const osUserId = `emp_${empresa.idEmpresa}_user_${usuario.idUsuario}`;

            await OneSignal.login(osUserId);

            await OneSignal.User.addTag(
              'empresa_id',
              empresa.idEmpresa.toString()
            );
          }
        } catch (e) {
          console.warn('OneSignal error:', e);
        }

        await loading.dismiss();

        // Aviso de pago en periodo de gracia (día 30 → 3): warning informativo, sin bloquear
        if (resp?.alertaPlan?.mensaje) {
          const tipo = (resp.alertaPlan.tipo || 'advertencia').toLowerCase();
          this.parametros.setAlertaPago({
            tipo,
            mensaje: resp.alertaPlan.mensaje,
            diaCobro: resp.alertaPlan.diaCobro,
            diasRestantes: resp.alertaPlan.diasRestantes
          });
          setTimeout(async () => {
            const pagoEnviado = await this.mostrarMensaje(
              'Pago pendiente',
              resp.alertaPlan.mensaje,
              tipo === 'critico' ? 'alert-circle-outline' : 'card-outline',
              false,
              true,
              {
                diaCobro: resp.alertaPlan.diaCobro,
                diasRestantes: resp.alertaPlan.diasRestantes
              }
            );
            if (pagoEnviado) {
              this.parametros.setAlertaPago(null);
            }
          }, 400);
        } else {
          this.parametros.setAlertaPago(null);
        }

        // 📜 Políticas: TODOS los clientes (sin excepciones). MacroBits publica; cada empresa acepta.
        const gate = await this.politicasGate.validarAcceso(
          empresa.idEmpresa,
          usuario.idUsuario,
          resp?.politicas || null
        );

        if (!gate.ok) {
          try {
            if (usuario.idUsuario) {
              await this.authService.logout(usuario.idUsuario).toPromise();
            }
          } catch { /* ignore */ }
          this.parametros.logout();
          localStorage.clear();
          this.router.navigateByUrl('/login', { replaceUrl: true });
          return;
        }

        this.redirigirSegunModulos(modulos);
      },

      error: async (err) => {

        await loading.dismiss();

        let mensaje = 'No se pudo iniciar sesión';

        if (typeof err?.error === 'string' && err.error.trim() !== '') {
          mensaje = err.error;
        } else if (err?.status === 0) {
          mensaje = 'No se pudo conectar con el servidor';
        } else if (err?.error?.mensaje) {
          mensaje = err.error.mensaje;
        }

        await this.mostrarMensaje(
          'Error de acceso',
          mensaje,
          'alert-circle-outline',
          false
        );
      }
    });
}
async abrirPlanes() {

  const modal = await this.modalCtrl.create({
    component: WhatsappPlanesComponent,
    cssClass: 'modal-clientes-full', // opcional (para estilos)
    
  });

  await modal.present();
}
  // ===============================
  // 📝 REGISTRO
  // ===============================
  irARegistro() {
    this.abrirPlanes();
  }
private redirigirSegunModulos(modulos: any[]) {

  const ids = modulos.map(m => m.moduloId);

  // 🍰 Bizcocho
  const tieneBizcocho = ids.includes(28);

  // 📊 Dashboard
  const tieneDashboard = ids.includes(1);

  // 🛒 POS
  const tienePos = ids.includes(22);

  // 🔥 PRIORIDADES

  // 1. Si tiene Dashboard, siempre entra ahí
  if (tieneDashboard) {

    this.router.navigateByUrl(
      '/dashboard-gerencial',
      { replaceUrl: true }
    );

    return;
  }

  // 2. Si no tiene Dashboard pero tiene POS
  if (tienePos) {

    this.router.navigateByUrl(
      '/pos',
      { replaceUrl: true }
    );

    return;
  }

  // 3. Si solo tiene Bizcocho
  if (tieneBizcocho) {

    this.router.navigateByUrl(
      '/bizcocho',
      { replaceUrl: true }
    );

    return;
  }

  // 🚫 Sin módulo conocido
  this.router.navigateByUrl(
    '/acceso-denegado',
    { replaceUrl: true }
  );
}
  // ===============================
  // 📱 DEVICE ID (ESTABLE)
  // ===============================
  private obtenerDeviceId(): string {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('device_id', id);
    }
    return id;
  }
}
