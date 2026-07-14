import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { GastosService } from 'src/app/servicios/gastos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-anular-gasto',
  templateUrl: './anular-gasto.component.html',
  styleUrls: ['./anular-gasto.component.scss'],
})
export class AnularGastoComponent {

  @Input() gasto!: any;

  motivo = '';
  procesando = false;

  constructor(
    private modalCtrl: ModalController,
    private gastosService: GastosService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async confirmar() {
    const motivo = this.motivo.trim();

    if (!motivo) {
      await this.toast('Indique el motivo de la anulación');
      return;
    }

    if (motivo.length < 5) {
      await this.toast('El motivo debe tener al menos 5 caracteres');
      return;
    }

    this.procesando = true;

    try {
      const resp = await firstValueFrom(
        this.gastosService.anularGasto({
          idGasto: this.gasto.idGasto,
          idEmpresa: this.parametros.GetIdEmpresa(),
          motivoAnulacion: motivo,
          usuarioAnulo: this.parametros.UserName || ''
        })
      );

      if (!resp?.success) {
        await this.toast(resp?.message || 'No se pudo anular el gasto');
        return;
      }

      await this.toast('Gasto anulado correctamente');
      this.modalCtrl.dismiss({ refresh: true });
    } catch (error: any) {
      const mensaje =
        error?.error?.message
        || error?.error
        || 'No se pudo anular el gasto';

      await this.toast(String(mensaje));
    } finally {
      this.procesando = false;
    }
  }

  private async toast(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'top',
      color: mensaje.includes('correctamente') ? 'success' : 'warning'
    });

    await toast.present();
  }
}
