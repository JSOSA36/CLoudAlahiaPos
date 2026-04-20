// 📁 whatsapp-planes.component.ts
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-whatsapp-planes',
  templateUrl: './whatsapp-planes.component.html',
  styleUrls: ['./whatsapp-planes.component.scss'],
})
export class WhatsappPlanesComponent implements OnInit {

  @Output() planSeleccionado = new EventEmitter<string>();
mostrarEcf = false;

abrirPlanesEcf() {
  this.mostrarEcf = true;
}

cerrarPlanesEcf() {
  this.mostrarEcf = false;
}
  constructor(private modalCtrl: ModalController ) {

   }

  ngOnInit(): void {}

  seleccionarPlan(plan: string){
    this.planSeleccionado.emit(plan);
  }




cerrar(){
  this.modalCtrl.dismiss();
}
}