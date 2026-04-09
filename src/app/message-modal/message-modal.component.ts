import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PlanesCloudService } from '../servicios/lanes-cloud.service';
import { ParametrosService } from '../servicios/parametros.service';
@Component({
  selector: 'app-message-modal',
  templateUrl: './message-modal.component.html',
  styleUrls: ['./message-modal.component.scss'],
})
export class MessageModalComponent {
mostrarCambioPlan: boolean = true;
planSeleccionado: number | null = null;
planes: any[] = [];
planActualNombre: string = '';
  @Input() title: string = 'Información';
  @Input() message: string = '';
  @Input() icon: string = 'alert-circle-outline'; // ícono por defecto

  constructor(private modalCtrl: ModalController, private service: PlanesCloudService, private parametros: ParametrosService) {}

  cerrar() {
    this.modalCtrl.dismiss();
  }
 

ngOnInit() {
  this.cargarPlanes();
}

cargarPlanes() {
  this.service.getPlanes().subscribe(res => {
  this.planes = res
  .filter(p => p.nombre !== 'Demo')
  .sort((a, b) => a.precioUSD - b.precioUSD);
  });
}

cambiarPlan() {

  if (!this.planSeleccionado) {
    alert('Selecciona un plan');
    return;
  }

  this.service.cambiarPlan(this.planSeleccionado, this.parametros.IdEmpresa)
    .subscribe(() => {
      alert('Plan actualizado correctamente');
      this.cerrar();
      window.location.reload();
    });
}
}
