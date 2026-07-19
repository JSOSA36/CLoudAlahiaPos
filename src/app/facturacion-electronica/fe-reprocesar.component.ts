import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EcfHistorialItem } from './fe-historial.component';

@Component({
  selector: 'app-fe-reprocesar',
  templateUrl: './fe-reprocesar.component.html',
  styleUrls: ['./fe-reprocesar.component.scss'],
})
export class FeReprocesarComponent implements OnInit {

  items: EcfHistorialItem[] = [];
  loading = false;
  reprocesando: Record<number, boolean> = {};

  constructor(
    private feService: FacturacionElectronicaService,
    private parametro: ParametrosService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.feService.getHistorial(
      this.parametro.IdEmpresa, '', '', null, 'Error'
    ).subscribe({
      next: (data) => { this.items = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  async confirmarReprocesar(item: EcfHistorialItem) {
    const alert = await this.alertCtrl.create({
      header: 'Reprocesar documento',
      message: `¿Reenviar ${item.encf} al proveedor?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Reprocesar', handler: () => this.reprocesar(item)
        }
      ]
    });
    await alert.present();
  }

  reprocesar(item: EcfHistorialItem) {
    this.reprocesando[item.idEcf] = true;
    this.feService.reprocesar(item.idEcf).subscribe({
      next: () => {
        this.reprocesando[item.idEcf] = false;
        this.showToast(`${item.encf} reenviado`);
        this.cargar();
      },
      error: (err) => {
        this.reprocesando[item.idEcf] = false;
        this.showToast(err?.error?.mensajeError || 'Error al reprocesar', 'danger');
      }
    });
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    await t.present();
  }
}
