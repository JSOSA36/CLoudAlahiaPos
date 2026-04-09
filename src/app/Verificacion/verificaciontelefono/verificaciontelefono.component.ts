import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-verificacioncorreo',
  templateUrl: './verificaciontelefono.component.html',
  styleUrls: ['./verificaciontelefono.component.scss'],
})
export class VerificaciontelefonoComponent implements OnInit {

  telefono: string = '';
  error: string = '';

  primaryColor: string = '#3880ff'; // fallback Ionic
  contrastColor: string = '#fff';   // blanco por defecto

  constructor(private toastCtrl: ToastController) {}

  ngOnInit() {
    // ✅ Cargar colores desde localStorage
    const storedPrimary = localStorage.getItem('primaryColor');
    if (storedPrimary) {
      this.primaryColor = storedPrimary;
      this.contrastColor = this.getContrastingColor(storedPrimary);
    }
  }

  async continuar() {
    // Validación básica de correo
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(this.telefono)) {
      this.error = 'Por favor ingrese un correo válido';
      this.toast('Correo inválido ❌', true);
      return;
    }

    this.error = '';
    this.toast('Correo válido, enviando verificación... ✅');
    console.log('Correo válido:', this.telefono);
  }

  private async toast(msg: string, isError: boolean = false) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom',
      // ✅ Si hay error usamos "danger", si no usamos el color primario del cliente
      color: isError ? 'danger' : undefined,
      cssClass: !isError ? 'custom-toast' : '' // custom para usar primaryColor
    });
    await t.present();
  }

  // ✅ Calcula contraste dinámico
  private getContrastingColor(hex: string): string {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
  }
}
