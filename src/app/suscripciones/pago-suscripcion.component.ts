import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CrearPagoDto } from '../models/CrearPagoDto.models';
import { PagoEmpresa } from '../models/PagoEmpresa.models';
import { PagoEmpresaService } from '../servicios/PagoEmpresaService';
import { ParametrosService } from '../servicios/parametros.service';
import { EmpresaService } from '../servicios/empresa.services';
import {
  EmpresaCargosRecurrentesService,
  SuscripcionCalculoFactura,
  SuscripcionLineaFactura
} from '../servicios/empresa-cargos-recurrentes.service';
import { SuscripcionCobrosService, SuscripcionCuentaCobro } from '../servicios/suscripcion-cobros.service';

@Component({
  selector: 'app-pago-suscripcion',
  templateUrl: './pago-suscripcion.component.html',
  styleUrls: ['./pago-suscripcion.component.scss']
})
export class PagoSuscripcionComponent implements OnInit {
  tab: 'pagar' | 'historial' = 'pagar';
  loading = false;
  enviando = false;
  calculo: SuscripcionCalculoFactura | null = null;
  pagos: PagoEmpresa[] = [];
  archivo: File | null = null;
  estadoServicio = '';
  pagadoServicio = false;
  cuentasCobro: SuscripcionCuentaCobro[] = [];

  constructor(
    private pagoSvc: PagoEmpresaService,
    private cargosSvc: EmpresaCargosRecurrentesService,
    private empresaSvc: EmpresaService,
    private cobrosSvc: SuscripcionCobrosService,
    private parametros: ParametrosService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  get idEmpresa(): number {
    return this.parametros.IdEmpresa || 0;
  }

  get total(): number {
    return this.calculo?.total ?? 0;
  }

  get tasa(): number {
    return this.calculo?.tasaUsdDop || 60;
  }

  get totalDop(): number {
    return this.calculo?.totalDop ?? (this.total * this.tasa);
  }

  get lineas(): SuscripcionLineaFactura[] {
    return this.calculo?.lineas || [];
  }

  /** Hay cuota del ciclo por reportar / validar / suspendida. */
  get tienePagoVigente(): boolean {
    const e = (this.estadoServicio || '').toUpperCase();
    if (e === 'PENDIENTE_PAGO' || e === 'SUSPENDIDA' || e === 'PAGO_REPORTADO') {
      return true;
    }
    if (e === 'ACTIVA' && this.pagadoServicio) {
      return false;
    }
    return !this.pagadoServicio;
  }

  get pagoPendiente(): PagoEmpresa | undefined {
    return this.pagos.find(p => (p.estado || '').toUpperCase() === 'PENDIENTE');
  }

  get puedeReportar(): boolean {
    return this.tienePagoVigente && !this.pagoPendiente && !this.enviando;
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    if (!this.idEmpresa) {
      await this.toast('No se encontró la empresa de la sesión', 'warning');
      return;
    }

    this.loading = true;
    try {
      const [estado, calculo, pagos, cuentas] = await Promise.all([
        firstValueFrom(this.empresaSvc.puedeOperar(this.idEmpresa)),
        firstValueFrom(this.cargosSvc.calculo(this.idEmpresa)),
        firstValueFrom(this.pagoSvc.obtenerPagosEmpresa(this.idEmpresa)),
        firstValueFrom(this.cobrosSvc.cuentasCobro(true)).catch(() => [] as SuscripcionCuentaCobro[])
      ]);
      this.estadoServicio = (estado?.estadoServicio || '').toUpperCase();
      this.pagadoServicio = !!estado?.pagadoServicio;
      this.calculo = calculo;
      this.pagos = pagos || [];
      this.cuentasCobro = cuentas || [];
    } catch {
      await this.toast('No se pudo cargar la información de suscripción', 'danger');
    } finally {
      this.loading = false;
    }
  }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.archivo = input?.files?.[0] || null;
  }

  async enviarVoucher() {
    if (!this.tienePagoVigente) {
      await this.toast('No tiene un pago vigente por reportar', 'warning');
      return;
    }
    if (!this.puedeReportar) {
      await this.toast('Ya tiene un pago en validación', 'warning');
      return;
    }
    if (!this.archivo) {
      await this.toast('Adjunte el voucher / comprobante', 'warning');
      return;
    }

    this.enviando = true;
    const loading = await this.loadingCtrl.create({ message: 'Enviando voucher…' });
    await loading.present();

    const dto: CrearPagoDto = {
      idEmpresa: this.idEmpresa,
      monto: this.total,
      imagen: this.archivo,
      fechaPago: new Date().toISOString().substring(0, 10),
      idUsuarioReporta: this.parametros.IdUsuario
    };

    this.pagoSvc.subirPago(dto).subscribe({
      next: async () => {
        this.enviando = false;
        await loading.dismiss();
        this.archivo = null;
        this.parametros.setAlertaPago(null);
        const alert = await this.alertCtrl.create({
          header: 'Voucher enviado',
          message: 'MacroBits revisará el comprobante. Le avisaremos por correo cuando sea validado.',
          buttons: ['Entendido']
        });
        await alert.present();
        this.tab = 'historial';
        await this.cargar();
      },
      error: async (err) => {
        this.enviando = false;
        await loading.dismiss();
        const msg = err?.error?.message || err?.error || 'No se pudo enviar el voucher';
        await this.toast(typeof msg === 'string' ? msg : 'No se pudo enviar el voucher', 'danger');
      }
    });
  }

  estadoClass(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'APROBADO': return 'ok';
      case 'RECHAZADO': return 'bad';
      case 'PENDIENTE': return 'warn';
      default: return '';
    }
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

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2800, color, position: 'top' });
    await t.present();
  }
}
