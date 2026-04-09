import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
@Component({
  selector: 'app-licencia-modal',
  templateUrl: './licencia-modal.component.html',
  styleUrls: ['./licencia-modal.component.scss'],
})
export class LicenciaModalComponent {
  aceptado: boolean = false;
 empresaNombre = '';
diaPago = '';

ngOnInit() {
  
  this.empresaNombre = this.parametros.NombreEmpresa
  this.diaPago ='30'; // fallback seguro
}

  constructor(private modalCtrl: ModalController, private parametros: ParametrosService ) {}

  aceptar() {
    // Cierra el modal y retorna true
    this.modalCtrl.dismiss(true);
  }

  closeModal() {
    // Cierra el modal sin aceptar
    this.modalCtrl.dismiss(false);
  }
}
