import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { PlanesCloudService, PlanCloud } from '../servicios/lanes-cloud.service';
import { ParametrosService } from '../servicios/parametros.service';
import { PagoEmpresaService } from '../servicios/PagoEmpresaService';
import { CrearPagoDto } from '../models/CrearPagoDto.models';

@Component({
  selector: 'app-message-modal',
  templateUrl: './message-modal.component.html',
  styleUrls: ['./message-modal.component.scss'],
})
export class MessageModalComponent {

  @Input() mostrarCambioPlan: boolean = false;
  @Input() mostrarPago: boolean = false;

  @Input() title: string = 'Información';
  @Input() message: string = '';
  @Input() icon: string = 'alert-circle-outline';

  planSeleccionado: number | null = null;
  planes: PlanCloud[] = [];
  archivo: File | null = null;
  PlanActual: PlanCloud | null = null;
  planActualNombre: string = '';

  enviando = false;

  constructor(
    private modalCtrl: ModalController,
    private service: PlanesCloudService,
    private parametros: ParametrosService,
    private pagoService: PagoEmpresaService,
    private alertCtrl: AlertController
  ) {}

  cerrar() {
    this.modalCtrl.dismiss();
  }

  ngOnInit() {
    if (this.mostrarCambioPlan) {
      this.cargarPlanes();
    }
  }

  // 🔥 ALERT PRO
  private async mostrarAlertaCerrar(
    title: string,
    message: string,
    type: 'success' | 'warning' | 'danger' = 'success'
  ) {
    const alert = await this.alertCtrl.create({
      header: title,
      message: message,
      backdropDismiss: false,
      cssClass: ['custom-alert', type],
      buttons: [
        {
          text: 'Entendido', // 🔥 más moderno
          cssClass: 'btn-aceptar',
          handler: () => {
            this.modalCtrl.dismiss(true); // 🔥 cierra todo
          }
        }
      ]
    });

    await alert.present();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivo = file;
      console.log('Archivo seleccionado:', file.name);
    }
  }

  async enviarPago() {

    if (!this.archivo) {
      await this.mostrarAlertaCerrar(
        'Atención',
        'Debes adjuntar el comprobante',
        'warning'
      );
      return;
    }

    if (this.enviando) return;
    this.enviando = true;

    const dto: CrearPagoDto = {
      idEmpresa: this.parametros.IdEmpresa,
      monto: 3600,
      imagen: this.archivo
    };

    this.pagoService.subirPago(dto).subscribe({
      next: async () => {
        this.enviando = false;

       await this.mostrarAlertaCerrar(
  'Pago enviado correctamente',
  'Tu comprobante fue enviado correctamente.\n\nRecibirás una notificación vía correo electrónico cuando sea validado.',
  'success'
);
      },
      error: async () => {
        this.enviando = false;

        await this.mostrarAlertaCerrar(
          'Error',
          'Ocurrió un problema al enviar el comprobante. Intenta nuevamente.',
          'danger'
        );
      }
    });
  }

  copiarTexto(texto: string) {
    navigator.clipboard.writeText(texto)
      .then(() => console.log('Copiado:', texto))
      .catch(err => console.error('Error al copiar:', err));
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
      await this.mostrarAlertaCerrar(
        'Atención',
        'Debes seleccionar un plan',
        'warning'
      );
      return;
    }

    this.service.cambiarPlan(this.parametros.IdEmpresa, this.planSeleccionado)
      .subscribe(async () => {

        await this.mostrarAlertaCerrar(
          'Plan actualizado',
          'Tu plan fue actualizado correctamente 🚀',
          'success'
        );

        setTimeout(() => {
          window.location.reload();
        }, 300);
      });
  }
}