import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { PagoEmpresaService } from '../servicios/PagoEmpresaService';
import { ParametrosService } from '../servicios/parametros.service';
import { AuthService } from '../servicios/auth.service';
import { CrearPagoDto } from '../models/CrearPagoDto.models';
import {
  EmpresaCargosRecurrentesService,
  SuscripcionCalculoFactura,
  SuscripcionLineaFactura
} from '../servicios/empresa-cargos-recurrentes.service';
import { EmpresaService } from '../servicios/empresa.services';
import { SuscripcionCobrosService, SuscripcionCuentaCobro } from '../servicios/suscripcion-cobros.service';
import { mensajeMontoInsuficiente } from './monto-insuficiente.util';

@Component({
  selector: 'app-servicio-suspendido',
  templateUrl: './servicio-suspendido.component.html',
  styleUrls: ['./servicio-suspendido.component.scss']
})
export class ServicioSuspendidoComponent implements OnInit {
  private mensajeRaw = 'Su servicio está suspendido por falta de pago. Adjunte su voucher para reactivarlo.';
  estadoServicio = '';
  precioPlan = 0;
  nombreEmpresa = '';
  enviando = false;
  desglose: SuscripcionLineaFactura[] = [];
  montoPlan = 0;
  montoCargos = 0;
  tasa = 60;
  totalDop = 0;
  puedeReportarPago = true;
  pagoEnValidacion = false;
  cuentasCobro: SuscripcionCuentaCobro[] = [];

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
    private empresaSvc: EmpresaService,
    private cobrosSvc: SuscripcionCobrosService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    if (state) {
      this.mensajeRaw = state.mensaje || this.mensajeRaw;
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
      this.totalDop = this.calcularTotalDop();
    }
  }

  private calcularTotalDop(): number {
    if (this.desglose?.length) {
      const sum = this.desglose.reduce((acc, l) => {
        const dop = Number(l.montoDop);
        if (!Number.isNaN(dop) && dop > 0) return acc + dop;
        return acc + (Number(l.monto) || 0) * this.tasa;
      }, 0);
      if (sum > 0) return sum;
    }
    return (this.precioPlan || 0) * this.tasa;
  }

  get titulo(): string {
    return this.pagoEnValidacion ? 'Pago en validación' : 'Servicio suspendido';
  }

  /** Limpia textos que piden “iniciar sesión” (el usuario ya está aquí). */
  get mensajeMostrado(): string {
    if (this.pagoEnValidacion) {
      return 'Ya recibimos su comprobante. MacroBits lo está revisando.';
    }
    let m = (this.mensajeRaw || '').trim();
    m = m.replace(/\s*Inicie sesión e indique Reportar pago para subir su voucher\.?/gi, '');
    m = m.replace(/\s*Inicie sesión\.?/gi, '');
    if (!m) {
      m = 'Su servicio está suspendido por falta de pago. Adjunte su voucher para reactivarlo.';
    }
    return m;
  }

  ngOnInit() {
    this.form.monto = this.precioPlan || 0;
    this.form.fechaPago = new Date().toISOString().substring(0, 10);
    if (!this.nombreEmpresa) {
      this.nombreEmpresa = this.parametros.NombreEmpresa || '';
    }
    this.cargarCuentasCobro();
    void this.sincronizarEstadoDesdeApi();
  }

  private cargarCuentasCobro() {
    this.cobrosSvc.cuentasCobro(true).subscribe({
      next: (list) => this.cuentasCobro = list || [],
      error: () => this.cuentasCobro = []
    });
  }

  esReconexion(l: SuscripcionLineaFactura): boolean {
    return (l?.tipoLinea || '').toUpperCase() === 'RECONEXION'
      || /reconex/i.test(l?.nombre || '');
  }

  async copiarTexto(valor: string, etiqueta: string) {
    const texto = (valor || '').trim();
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      await this.toast(`${etiqueta} copiada`, 'success');
    } catch {
      await this.toast('No se pudo copiar', 'warning');
    }
  }

  private sincronizarEstadoDesdeApi(): void {
    const id = this.parametros.IdEmpresa;
    if (!id) {
      if (!this.pagoEnValidacion) this.cargarCalculo();
      return;
    }

    this.empresaSvc.puedeOperar(id).subscribe({
      next: (st) => {
        const estado = String(st?.estadoServicio || '').toUpperCase();
        if (estado) this.estadoServicio = estado;
        if (estado === 'PAGO_REPORTADO') {
          this.pagoEnValidacion = true;
          this.puedeReportarPago = false;
          this.mensajeRaw = 'Su pago está en validación.';
        }
      },
      error: () => {}
    });

    this.pagoService.obtenerPagosEmpresa(id).subscribe({
      next: (pagos) => {
        const pendiente = (pagos || []).some(p =>
          String(p?.estado || '').toUpperCase() === 'PENDIENTE');
        if (pendiente) {
          this.pagoEnValidacion = true;
          this.puedeReportarPago = false;
          this.mensajeRaw = 'Ya tiene un comprobante en validación.';
        } else if (!this.pagoEnValidacion) {
          this.cargarCalculo();
        }
      },
      error: () => {
        if (!this.pagoEnValidacion) this.cargarCalculo();
      }
    });
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
        this.totalDop = c.totalDop && c.totalDop > 0
          ? c.totalDop
          : this.calcularTotalDop();
      },
      error: () => {}
    });
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
    const loading = await this.loadingCtrl.create({
      message: 'Leyendo monto del voucher…'
    });
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
        this.estadoServicio = 'PAGO_REPORTADO';
        this.mensajeRaw = 'Su pago está en validación.';
        const alert = await this.alertCtrl.create({
          header: 'Comprobante enviado',
          message: 'Su voucher fue recibido. MacroBits lo validará y reactivará el servicio. El acceso se restaura cuando el pago sea aprobado.',
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
        await this.mostrarErrorVoucher(err);
      }
    });
  }

  private async mostrarErrorVoucher(err: any) {
    const body = err?.error;
    const codigo = body?.codigo || '';
    const msg =
      body?.message
      || (typeof body === 'string' ? body : null)
      || 'No se pudo enviar el pago';

    if (codigo === 'MONTO_INSUFICIENTE') {
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

    const alert = await this.alertCtrl.create({
      header: 'No se pudo enviar',
      message: msg,
      backdropDismiss: false,
      cssClass: 'alert-monto-insuficiente',
      buttons: ['Entendido']
    });
    await alert.present();
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
