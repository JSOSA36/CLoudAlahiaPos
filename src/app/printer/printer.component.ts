import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
@Component({
  selector: 'app-printer',
  templateUrl: './printer.component.html',
  styleUrls: ['./printer.component.scss'],
})
export class PrinterComponent implements OnInit {



  constructor(private modalCtrl: ModalController) { }
  @Input() factura: any; // 🔥 recibe la factura
 vistaPos: boolean = false;
  ngOnInit(): void {

   
  }
  toggleVistaPos() {
    this.vistaPos = !this.vistaPos;
  }
  imprimir() {
  window.print();
}

cerrar() {
  this.modalCtrl.dismiss();
}
 
}