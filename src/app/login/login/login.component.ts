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
import { WhatsappPlanesComponent } from 'src/app/whatsapp-planes/whatsapp-planes.component';
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private parametros: ParametrosService,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private platform: Platform
  ) {}

  // ❌ NO limpiar sesión aquí
  ngOnInit() {}
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
    icon: string = 'alert-circle-outline'
  ) {
    const modal = await this.modalCtrl.create({
      component: MessageModalComponent,
      componentProps: { title, message, icon }
    });
    await modal.present();
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

desbloquearAudio(): Promise<void> {

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
      'Debes ingresar usuario y contraseña'
    );
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: 'Iniciando sesión...',
    spinner: 'crescent'
  });
  await loading.present();

  const deviceId = this.obtenerDeviceId();

  this.authService
    .login(this.Usuario, this.PassWord, deviceId)
    .subscribe({
      next: async (resp: any) => {

        this.parametros.ApiPrint = resp.empresa.apiPrint;
        this.parametros.puedeEliminarOrden = resp.usuario.puedeEliminarOrden || false;

        // ===============================
        // 🔥 ALERTA DEL PLAN (AQUÍ)
        // ===============================
        if (resp.alertaPlan) {
          setTimeout(async () => {
            await this.mostrarMensaje(
              'Aviso de consumo',
              resp.alertaPlan
            );
          }, 500); // pequeño delay para que cargue primero
        }

        // ===============================
        // 1️⃣ GUARDAR MENÚ
        // ===============================
        localStorage.setItem(
          'menu_modulos',
          JSON.stringify(resp.modulos || [])
        );

        // ===============================
        // 2️⃣ SESIÓN
        // ===============================
        this.parametros.setLoginData(
          resp.usuario.userName,
          this.PassWord,
          resp.empresa.idEmpresa,
          resp.token || 'ok',
          resp.usuario.rol || '',
          resp.usuario.idUsuario,
          resp.usuario,
        );

        // ===============================
        // 3️⃣ MÓDULOS ACTIVOS
        // ===============================
        this.parametros.setModulosActivos(
          (resp.modulos || []).map((m: any) => m.moduloId)
        );

        // ===============================
        // 🛰️ OneSignal
        // ===============================
        try {
          const osUserId =
            `emp_${resp.empresa.idEmpresa}_user_${resp.usuario.idUsuario}`;

          await OneSignal.login(osUserId);
          await OneSignal.User.addTag(
            'empresa_id',
            resp.empresa.idEmpresa.toString()
          );
        } catch (e) {
          console.warn('OneSignal error:', e);
        }

        await loading.dismiss();

        // ===============================
        // 4️⃣ REDIRECCIÓN
        // ===============================
        this.redirigirSegunModulos(resp.modulos || []);
      },
      error: async (err) => {
        await loading.dismiss();
        await this.mostrarMensaje(
          'Error de acceso',
          err?.error || 'No se pudo iniciar sesión'
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

  // 🔹 Suponiendo:
  // 1 = Dashboard
  // 2 = Ordenes
  // Ajusta según tus IDs reales

  if (ids.includes(1)) {
    this.router.navigateByUrl('/folder/Inbox', { replaceUrl: true });
    return;
  }

  if (ids.includes(2)) {
    this.router.navigateByUrl('/Ordenes', { replaceUrl: true });
    return;
  }

  // 🔥 fallback de seguridad
  this.router.navigateByUrl('/Ordenes', { replaceUrl: true });
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
