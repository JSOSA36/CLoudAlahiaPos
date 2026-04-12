import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PlanesCloudService } from '../servicios/lanes-cloud.service';
import { ParametrosService } from '../servicios/parametros.service';
import { PlanCloud } from '../servicios/lanes-cloud.service';

@Component({
  selector: 'app-message-modal',
  templateUrl: './message-modal.component.html',
  styleUrls: ['./message-modal.component.scss'],
})
export class MessageModalComponent {
mostrarCambioPlan: boolean = true;
planSeleccionado: number | null = null;
planes: PlanCloud[] = [];
PlanActual: PlanCloud | null = null;
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
 this.service.getPlanesPorEmpresa(this.parametros.IdEmpresa)
  .subscribe(res => {

    const planActual = res.find(p => p.esActual);

    if (planActual) {
      this.planes = res.filter(p => p.precio > planActual.precio);
      this.PlanActual = planActual;
    }
  });
}

async cambiarPlan() {

  if (!this.planSeleccionado) {
    await this.mostrarExito(
      'Atención',
      'Debes seleccionar un plan'
    );
    return;
  }

  this.service.cambiarPlan(this.parametros.IdEmpresa, this.planSeleccionado)
    .subscribe(async () => {

      await this.mostrarExito(
        'Plan actualizado',
        'Tu plan fue actualizado correctamente 🚀'
      );

      this.cerrar();

      setTimeout(() => {
        window.location.reload();
      }, 800); // pequeño delay para UX
    });
}
private async mostrarExito(title: string, message: string) {
  const modal = await this.modalCtrl.create({
    component: MessageModalComponent,
    cssClass: 'modal-clientes-full',
    componentProps: {
      title,
      message,
      icon: 'checkmark-circle-outline' // 🔥 icono bonito
    }
  });

  await modal.present();
}
}
