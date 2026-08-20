import { Component, Input } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { PlanesCloudService, PlanCloud } from '../servicios/lanes-cloud.service';
import { ParametrosService } from '../servicios/parametros.service';
import { PagoEmpresaService } from '../servicios/PagoEmpresaService';
import { CrearPagoDto } from '../models/CrearPagoDto.models';
import {
  EmpresaCargosRecurrentesService,
  SuscripcionLineaFactura
} from '../servicios/empresa-cargos-recurrentes.service';
import { SuscripcionCobrosService, SuscripcionCuentaCobro } from '../servicios/suscripcion-cobros.service';
import { mensajeMontoInsuficiente } from '../suscripciones/monto-insuficiente.util';

@Component({
  selector: 'app-message-modal',
  templateUrl: './message-modal.component.html',
  styleUrls: ['./message-modal.component.scss'],
})
export class MessageModalComponent {

  @Input() mostrarCambioPlan: boolean = false;
  @Input() mostrarPago: boolean = false;
  @Input() precioPlan: number = 0;

  @Input() title: string = 'Información';
  @Input() message: string = '';
  @Input() icon: string = 'alert-circle-outline';
  @Input() diaCobro: number | null = null;
  @Input() diasRestantes: number | null = null;

  planSeleccionado: number | null = null;
  planes: PlanCloud[] = [];
  archivo: File | null = null;
  PlanActual: PlanCloud | null = null;
  planActualNombre: string = '';
  desglose: SuscripcionLineaFactura[] = [];
  cuentasCobro: SuscripcionCuentaCobro[] = [];
  tasa = 60;
  totalDop = 0;

  readonly mensajePagoCorporativo =
    'Su suscripción tiene un pago pendiente. Puede continuar utilizando el sistema hasta el día 3. A partir de esa fecha el acceso será suspendido automáticamente si el pago no ha sido reportado.';

  pagoForm = {
    fechaPago: new Date().toISOString().substring(0, 10),
    monto: 0
  };

  enviando = false;

  constructor(
    private modalCtrl: ModalController,
    private service: PlanesCloudService,
    private parametros: ParametrosService,
    private pagoService: PagoEmpresaService,
    private cargosSvc: EmpresaCargosRecurrentesService,
    private cobrosSvc: SuscripcionCobrosService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  cerrar() {
    this.modalCtrl.dismiss();
  }

  get mensajeMostrado(): string {
    if (this.mostrarPago) {
      return this.mensajePagoCorporativo;
    }
    return this.message;
  }

  get textoVence(): string {
    if (this.diasRestantes == null) return '';
    if (this.diasRestantes <= 0) return 'Vence hoy';
    if (this.diasRestantes === 1) return 'Vence en 1 día';
    return `Vence en ${this.diasRestantes} días`;
  }

  get lineaPlan(): SuscripcionLineaFactura | null {
    return this.desglose.find(l => (l.tipoLinea || '').toUpperCase() === 'PLAN') || null;
  }

  get lineasServicio(): SuscripcionLineaFactura[] {
    return this.desglose.filter(l => (l.tipoLinea || '').toUpperCase() !== 'PLAN');
  }

  get nombrePlanLinea(): string {
    const n = this.lineaPlan?.nombre
      || this.parametros.NombreEmpresa
      || 'Plan';
    if (/^Plan\s+/i.test(n)) return n;
    return `Plan ${n}`.trim();
  }

  ngOnInit() {
    if (this.mostrarCambioPlan) {
      this.cargarPlanes();
    }
    if (this.mostrarPago) {
      this.pagoForm.monto = this.precioPlan || 0;
      this.totalDop = (this.precioPlan || 0) * this.tasa;
      this.cobrosSvc.cuentasCobro(true).subscribe({
        next: (list) => this.cuentasCobro = list || [],
        error: () => this.cuentasCobro = []
      });
      this.cargosSvc.calculo(this.parametros.IdEmpresa).subscribe({
        next: (c) => {
          this.precioPlan = c.total;
          this.pagoForm.monto = c.total;
          this.desglose = c.lineas || [];
          this.tasa = c.tasaUsdDop || 60;
          this.totalDop = c.totalDop ?? (c.total * this.tasa);
        },
        error: () => {
          // Sin fallback a catálogo de planes: el total viene de MontoServicio + CargoAdicional.
        }
      });
    }
  }

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
          text: 'Entendido',
          cssClass: 'btn-aceptar',
          handler: () => {
            this.modalCtrl.dismiss(true);
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
    }
  }

  async copiarTexto(valor: string, etiqueta: string) {
    const texto = (valor || '').trim();
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      const t = await this.toastCtrl.create({
        message: `${etiqueta} copiada`,
        duration: 1800,
        color: 'success',
        position: 'top'
      });
      await t.present();
    } catch {
      const t = await this.toastCtrl.create({
        message: 'No se pudo copiar',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await t.present();
    }
  }

  async enviarPago() {

    if (!this.archivo) {
      await this.mostrarAlertaCerrar(
        'Atención',
        'Debes adjuntar el voucher / comprobante',
        'warning'
      );
      return;
    }

    if (this.enviando) return;
    this.enviando = true;

    const dto: CrearPagoDto = {
      idEmpresa: this.parametros.IdEmpresa,
      monto: this.pagoForm.monto || this.precioPlan || 0,
      imagen: this.archivo,
      fechaPago: this.pagoForm.fechaPago || new Date().toISOString().substring(0, 10),
      idUsuarioReporta: this.parametros.IdUsuario
    };

    this.pagoService.subirPago(dto).subscribe({
      next: async () => {
        this.enviando = false;

       await this.mostrarAlertaCerrar(
  'Voucher enviado',
  'Tu comprobante fue recibido.\n\nRecibirás un correo cuando MacroBits lo valide.',
  'success'
);
        this.parametros.setAlertaPago(null);
      },
      error: async (err) => {
        this.enviando = false;
        const body = err?.error;
        if (body?.codigo === 'MONTO_INSUFICIENTE') {
          // No cerrar el modal de pago: el usuario puede corregir y reintentar.
          const alert = await this.alertCtrl.create({
            header: 'Monto insuficiente',
            message: mensajeMontoInsuficiente(body),
            backdropDismiss: false,
            cssClass: 'alert-monto-insuficiente',
            buttons: ['Entendido']
          });
          await alert.present();
          return;
        }

        const msg =
          body?.message
          || (typeof body === 'string' ? body : null)
          || 'Ocurrió un problema al enviar el comprobante. Intenta nuevamente.';

        await this.mostrarAlertaCerrar(
          'No se pudo enviar',
          msg,
          'danger'
        );
      }
    });
  }

  cargarPlanes() {
    this.service.getPlanesPorEmpresa(this.parametros.IdEmpresa)
      .subscribe((res: PlanCloud[]) => {

        const planActual = res.find((p: PlanCloud) => p.esActual);

        if (planActual) {
          this.planes = res.filter((p: PlanCloud) => p.precio > planActual.precio);
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
