import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  NotasCreditoService,
  TicketNotaCredito
} from 'src/app/servicios/notas-credito.service';
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
  reintentando = false;

  constructor(
    private modalCtrl: ModalController,
    private printService: PrintService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController,
    private notasCreditoService: NotasCreditoService
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

  async reintentarEmision() {
    if (!this.ticket?.idNotaCredito) {
      return;
    }

    this.reintentando = true;
    try {
      const res = await firstValueFrom(
        this.notasCreditoService.reintentarEmision(
          this.ticket.idNotaCredito,
          this.parametros.GetIdEmpresa(),
          this.parametros.IdUsuario
        )
      );

      this.ticket = {
        ...this.ticket,
        ncf: res.ncf || this.ticket.ncf,
        trackId: res.trackId,
        estadoDgii: res.estadoDgii,
        emisionPendiente: res.emisionPendiente,
        mensajeEmision: res.mensajeEmision
      };

      await this.toast(
        res?.mensaje || 'Reintento completado',
        res?.emisionPendiente ? 'warning' : 'success'
      );
    } catch (err: any) {
      await this.toast(
        err?.error || 'No se pudo reintentar la emisión',
        'danger'
      );
    } finally {
      this.reintentando = false;
    }
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
