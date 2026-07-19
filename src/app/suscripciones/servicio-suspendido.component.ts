import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { PagoEmpresaService } from '../servicios/PagoEmpresaService';
import { ParametrosService } from '../servicios/parametros.service';
import { AuthService } from '../servicios/auth.service';
import { CrearPagoDto } from '../models/CrearPagoDto.models';
import {
  EmpresaCargosRecurrentesService,
  SuscripcionCalculoFactura,
  SuscripcionLineaFactura
} from '../servicios/empresa-cargos-recurrentes.service';
import { TicketDesdeLoginComponent } from '../tickets/ticket-desde-login.component';

@Component({
  selector: 'app-servicio-suspendido',
  templateUrl: './servicio-suspendido.component.html',
  styleUrls: ['./servicio-suspendido.component.scss']
})
export class ServicioSuspendidoComponent implements OnInit {
  mensaje = 'Su servicio se encuentra suspendido por falta de pago.';
  estadoServicio = '';
  precioPlan = 0;
  nombreEmpresa = '';
  mostrarFormulario = false;
  enviando = false;
  desglose: SuscripcionLineaFactura[] = [];
  montoPlan = 0;
  montoCargos = 0;
  tasa = 60;
  totalDop = 0;
  puedeReportarPago = true;
  pagoEnValidacion = false;

  form = {
    fechaPago: '',
    monto: 0
  };
  archivo: File | null = null;

  constructor(
    private router: Router,
    private pagoService: PagoEmpresaService,
    private parametros: ParametrosService,
    private auth: AuthService,
    private cargosSvc: EmpresaCargosRecurrentesService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    if (state) {
      this.mensaje = state.mensaje || this.mensaje;
      this.estadoServicio = state.estadoServicio || '';
      this.precioPlan = Number(state.precioPlan || 0);
      this.nombreEmpresa = state.nombreEmpresa || '';
      this.desglose = state.desgloseFactura || [];
      this.montoPlan = Number(state.montoPlan || 0);
      this.montoCargos = Number(state.montoCargos || 0);
      this.puedeReportarPago = state.puedeReportarPago !== false;
      this.pagoEnValidacion = !!state.pagoEnValidacion
        || (this.estadoServicio || '').toUpperCase() === 'PAGO_REPORTADO';
      if (this.pagoEnValidacion) {
        this.puedeReportarPago = false;
      }
    }
  }

  get titulo(): string {
    return this.pagoEnValidacion ? 'Pago en validación' : 'Servicio suspendido';
  }

  get badgeClass(): string {
    return this.pagoEnValidacion ? 'badge-pending' : 'badge';
  }

  ngOnInit() {
    this.form.monto = this.precioPlan || 0;
    this.form.fechaPago = new Date().toISOString().substring(0, 10);
    if (!this.nombreEmpresa) {
      this.nombreEmpresa = this.parametros.NombreEmpresa || '';
    }
    if (!this.pagoEnValidacion) {
      this.cargarCalculo();
    }
  }

  private cargarCalculo() {
    const id = this.parametros.IdEmpresa;
    if (!id) return;
    this.cargosSvc.calculo(id).subscribe({
      next: (c: SuscripcionCalculoFactura) => {
        this.precioPlan = c.total;
        this.form.monto = c.total;
        this.montoPlan = c.montoPlan;
        this.montoCargos = c.montoCargos;
        this.desglose = c.lineas || [];
        this.tasa = c.tasaUsdDop || 60;
        this.totalDop = c.totalDop ?? (c.total * this.tasa);
      },
      error: () => {}
    });
  }

  abrirReportar() {
    if (!this.puedeReportarPago || this.pagoEnValidacion) return;
    this.mostrarFormulario = true;
  }

  onFile(ev: any) {
    this.archivo = ev?.target?.files?.[0] || null;
  }

  async enviarPago() {
    if (!this.archivo) {
      await this.toast('Debe adjuntar el voucher', 'warning');
      return;
    }

    this.enviando = true;
    const loading = await this.loadingCtrl.create({ message: 'Enviando voucher...' });
    await loading.present();

    const dto: CrearPagoDto = {
      idEmpresa: this.parametros.IdEmpresa,
      monto: this.form.monto || this.precioPlan,
      imagen: this.archivo,
      fechaPago: this.form.fechaPago || new Date().toISOString().substring(0, 10),
      idUsuarioReporta: this.parametros.IdUsuario
    };

    this.pagoService.subirPago(dto).subscribe({
      next: async () => {
        this.enviando = false;
        await loading.dismiss();
        this.pagoEnValidacion = true;
        this.puedeReportarPago = false;
        this.mostrarFormulario = false;
        this.estadoServicio = 'PAGO_REPORTADO';
        this.mensaje = 'Su pago está en validación. El acceso se restaurará cuando MacroBits lo apruebe.';
        const alert = await this.alertCtrl.create({
          header: 'Pago en validación',
          message: 'Su comprobante fue enviado. El servicio se reactivará cuando MacroBits apruebe el pago.',
          backdropDismiss: false,
          buttons: [{
            text: 'Entendido',
            handler: () => this.cerrarSesion()
          }]
        });
        await alert.present();
      },
      error: async (err) => {
        this.enviando = false;
        await loading.dismiss();
        await this.toast(err?.error?.message || 'No se pudo enviar el pago', 'danger');
      }
    });
  }

  async abrirTicketSoporte() {
    const modal = await this.modalCtrl.create({
      component: TicketDesdeLoginComponent,
      componentProps: {
        userName: this.parametros.UserName || localStorage.getItem('Usuario') || '',
        password: ''
      },
      cssClass: 'modal-politicas-full'
    });
    await modal.present();
  }

  async cerrarSesion() {
    try {
      if (this.parametros.IdUsuario) {
        await this.auth.logout(this.parametros.IdUsuario).toPromise();
      }
    } catch { /* ignore */ }
    this.parametros.logout();
    localStorage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2800, color, position: 'top' });
    await t.present();
  }
}
