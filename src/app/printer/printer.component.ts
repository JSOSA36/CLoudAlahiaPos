import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PrintService } from 'src/app/servicios/print.services';

@Component({
  selector: 'app-printer',
  templateUrl: './printer.component.html',
  styleUrls: ['./printer.component.scss'],
})
export class PrinterComponent implements OnInit {
  @Input() factura: any;
  /** Si true, abre directo en formato ticket térmico POS. */
  @Input() forzarVistaPos = false;

  vistaPos = false;
  imprimiendo = false;

  constructor(
    private modalCtrl: ModalController,
    private printService: PrintService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    if (this.forzarVistaPos) {
      this.vistaPos = true;
    }
  }

  toggleVistaPos() {
    this.vistaPos = !this.vistaPos;
  }

  nombreItem(item: any): string {
    return (
      item?.productos?.nombre ||
      item?.productos?.descripcion ||
      item?.nombre ||
      item?.descripcion ||
      'Producto'
    );
  }

  precioItem(item: any): number {
    return Number(item?.precioOferta ?? item?.precio ?? 0);
  }

  subtotalItem(item: any): number {
    const cant = Number(item?.cantidad ?? 0);
    return cant * this.precioItem(item);
  }

  async imprimir() {
    if (this.imprimiendo) return;

    const id =
      Number(this.factura?.idFacturaHeader) ||
      Number(this.factura?.numeroFactura) ||
      0;
    const api = (this.parametros.ApiPrint || '').trim();

    // Impresora térmica (ApiPrint) con TOTAL / PAGADO / PENDIENTE
    if (api && id > 0) {
      this.imprimiendo = true;
      try {
        await firstValueFrom(this.printService.printFacturaCliente(id));
        (
          await this.toastCtrl.create({
            message: 'Ticket enviado a la impresora',
            duration: 1800,
            color: 'success',
            position: 'top'
          })
        ).present();
        await this.modalCtrl.dismiss();
        return;
      } catch (err) {
        console.error('Error ApiPrint desde preview', err);
        (
          await this.toastCtrl.create({
            message: 'No se pudo imprimir en la impresora térmica',
            duration: 2500,
            color: 'danger',
            position: 'top'
          })
        ).present();
      } finally {
        this.imprimiendo = false;
      }
    }

    // Sin ApiPrint: diálogo del navegador
    setTimeout(() => window.print(), 50);
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
