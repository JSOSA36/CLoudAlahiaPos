import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { TicketNotaCredito } from 'src/app/servicios/notas-credito.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PrintService } from 'src/app/servicios/print.services';

@Component({
  selector: 'app-nota-credito-preview',
  templateUrl: './nota-credito-preview.component.html',
  styleUrls: ['./nota-credito-preview.component.scss'],
})
export class NotaCreditoPreviewComponent {

  @Input() ticket!: TicketNotaCredito;

  imprimiendo = false;

  constructor(
    private modalCtrl: ModalController,
    private printService: PrintService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  get esPreview(): boolean {
    return !!this.ticket?.esPreview;
  }

  get detalles() {
    return this.ticket?.detalles || [];
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  imprimirPantalla() {
    window.print();
  }

  async imprimirPos() {
    if (!this.ticket?.idNotaCredito) {
      await this.toast(
        'Guarde la nota de crédito antes de imprimir en POS.',
        'warning'
      );
      return;
    }

    this.imprimiendo = true;

    try {
      await firstValueFrom(
        this.printService.printNotaCredito(
          this.ticket.idNotaCredito,
          this.parametros.GetIdEmpresa()
        )
      );

      await this.toast(
        'Ticket enviado a la impresora.',
        'success'
      );
    } catch {
      await this.toast(
        'No se pudo imprimir en POS.',
        'danger'
      );
    } finally {
      this.imprimiendo = false;
    }
  }

  private async toast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ) {
    (
      await this.toastCtrl.create({
        message,
        duration: 2500,
        position: 'top',
        color
      })
    ).present();
  }
}
