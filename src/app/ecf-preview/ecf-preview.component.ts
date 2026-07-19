import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-ecf-preview',
  templateUrl: './ecf-preview.component.html',
  styleUrls: ['./ecf-preview.component.scss'],
})
export class EcfPreviewComponent {

  @Input() factura: any;
  @Input() ecfData: any;

  constructor(private modalCtrl: ModalController) {}

  get esAceptado(): boolean {
    const estado = (this.ecfData?.estadoDgii || '').toLowerCase();
    return estado.includes('aceptado');
  }

  get esRechazado(): boolean {
    const estado = (this.ecfData?.estadoDgii || '').toLowerCase();
    return estado.includes('rechazado');
  }

  imprimir() {
    window.print();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
