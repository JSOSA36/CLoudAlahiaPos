import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { facturaheader } from 'src/app/models/facturaheader';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-anular-factura',
  templateUrl: './anular-factura.component.html',
  styleUrls: ['./anular-factura.component.scss'],
})
export class AnularFacturaComponent {

  @Input() factura!: facturaheader;

  motivo = '';
  procesando = false;

  constructor(
    private modalCtrl: ModalController,
    private facturaHeaderService: FacturaHeaderService,
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
      await firstValueFrom(
        this.facturaHeaderService.AnularFactura({
          idFacturaHeader: this.factura.idFacturaHeader,
          idEmpresa: this.parametros.GetIdEmpresa(),
          motivoAnulacion: motivo,
          usuarioAnulo: this.parametros.UserName || ''
        })
      );

      await this.toast('Factura anulada correctamente');
      this.modalCtrl.dismiss({ refresh: true });
    } catch (error: any) {
      const mensaje =
        error?.error
        || 'No se pudo anular la factura';

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
