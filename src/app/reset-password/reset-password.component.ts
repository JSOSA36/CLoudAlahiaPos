import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../servicios/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {

  token = '';
  password = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private usuariosService: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.mostrarToast('Enlace inválido o incompleto');
      this.router.navigate(['/login']);
    }
  }

 async cambiarPassword() {

  if (!this.password || !this.confirmPassword) {
    this.mostrarToast('Debe completar todos los campos');
    return;
  }

  if (this.password.length < 6) {
    this.mostrarToast('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  if (this.password !== this.confirmPassword) {
    this.mostrarToast('Las contraseñas no coinciden');
    return;
  }

  this.loading = true;

  this.usuariosService
    .resetPassword(
      this.token,
      this.password
    )
    .subscribe({
      next: async () => {
        this.loading = false;

        const alert = await this.alertCtrl.create({
          header: 'Contraseña actualizada',
          message: 'Su contraseña fue cambiada correctamente. Ya puede iniciar sesión.',
          buttons: ['OK']
        });

        await alert.present();
        await alert.onDidDismiss();

        this.router.navigate(['/login']);
      },
      error: async () => {
        this.loading = false;

        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'El enlace es inválido o ha expirado.',
          buttons: ['OK']
        });

        await alert.present();
      }
    });
}


  async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
