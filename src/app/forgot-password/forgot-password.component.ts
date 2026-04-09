import { Component, OnInit } from '@angular/core';
import { AuthService } from '../servicios/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent  implements OnInit {

  constructor(private authService: AuthService,private alertCtrl: AlertController) { }

  ngOnInit() {}


  email: string = '';

enviar() {
  if (!this.email) return;

  this.authService.forgotPassword(this.email).subscribe({
    next: () => {
      this.alerta(
        'Correo enviado',
        'Si el correo existe en nuestro sistema, recibirá las instrucciones para restablecer su contraseña.'
      );
    },
    error: () => {
      this.alerta(
        'Correo enviado',
        'Si el correo existe en nuestro sistema, recibirá las instrucciones para restablecer su contraseña.'
      );
    }
  });
}
async alerta(titulo: string, mensaje: string) {
  const alert = await this.alertCtrl.create({
    header: titulo,
    message: mensaje,
    buttons: ['Aceptar']
  });

  await alert.present();
}

}
