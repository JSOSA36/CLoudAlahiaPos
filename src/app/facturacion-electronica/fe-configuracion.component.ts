import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-fe-configuracion',
  templateUrl: './fe-configuracion.component.html',
  styleUrls: ['./fe-configuracion.component.scss'],
})
export class FeConfiguracionComponent implements OnInit {

  gatewayConectado = false;
  verificando = false;
  empresa: any = {};

  constructor(
    private feService: FacturacionElectronicaService,
    public parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.verificarConexion();
  }

  verificarConexion() {
    this.verificando = true;
    this.feService.healthCheck().subscribe({
      next: (res: any) => { this.gatewayConectado = res?.conectado === true; this.verificando = false; },
      error: () => { this.gatewayConectado = false; this.verificando = false; }
    });
  }

  async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000, color, position: 'top' });
    await t.present();
  }
}
