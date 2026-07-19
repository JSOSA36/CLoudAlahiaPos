import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service';
import { TicketDesdeLoginComponent } from '../tickets/ticket-desde-login.component';

@Component({
  selector: 'app-politicas-espera',
  templateUrl: './politicas-espera.component.html',
  styleUrls: ['./politicas-espera.component.scss']
})
export class PoliticasEsperaComponent {
  constructor(
    private modalCtrl: ModalController,
    private parametros: ParametrosService
  ) {}

  async abrirTicketSoporte() {
    const ticketModal = await this.modalCtrl.create({
      component: TicketDesdeLoginComponent,
      componentProps: {
        userName: this.parametros.UserName || localStorage.getItem('Usuario') || '',
        password: ''
      },
      cssClass: 'modal-politicas-full'
    });
    await ticketModal.present();
  }

  cerrarSesion() {
    this.modalCtrl.dismiss({ logout: true });
  }
}
