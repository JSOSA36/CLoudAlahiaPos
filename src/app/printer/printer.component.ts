import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

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

  constructor(private modalCtrl: ModalController) {}

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

  imprimir() {
    // Dar un tick para que el layout POS esté estable antes del diálogo
    setTimeout(() => window.print(), 50);
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
