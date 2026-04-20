import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-politicas',
  templateUrl: './politicas.component.html',
  styleUrls: ['./politicas.component.scss']
})
export class PoliticasComponent {

  acepta: boolean = false;

  constructor(private modalCtrl: ModalController) {}

aceptar() {
  if (!this.acepta) return;

  localStorage.setItem('politicas_aceptadas', 'true');
  this.modalCtrl.dismiss();
}

  cancelar() {
    this.modalCtrl.dismiss(false); // ❌ no acepta
  }
}