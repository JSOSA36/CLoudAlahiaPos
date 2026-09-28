import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ArsDocumentoCxC } from 'src/app/models/ars-aseguradora';
import { MetodoPagoCuenta } from 'src/app/models/MetodoPagoCuenta.models';
import { CuentaFinanciera } from 'src/app/models/CuentaFinanciera.models';
import { ArsAseguradoraService } from 'src/app/servicios/ars-aseguradora.service';
import { MetodoPagoCuentaService } from 'src/app/servicios/metodo-pago-cuenta.service';
import { CuentaFinancieraService } from 'src/app/servicios/cuenta-financiera.service';

@Component({
  selector: 'app-ars-pago-modal',
  templateUrl: './ars-pago-modal.component.html',
  styleUrls: ['./ars-pago-modal.component.scss'],
})
export class ArsPagoModalComponent implements OnInit {
  @Input() documentos: ArsDocumentoCxC[] = [];
  @Input() idEmpresa = 0;
  @Input() idUsuario?: number;

  metodos: MetodoPagoCuenta[] = [];
  cuentas: CuentaFinanciera[] = [];
  metodoPago = '';
  monto = 0;
  nota = '';
  cargando = false;
  procesando = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private ars: ArsAseguradoraService,
    private metodosSrv: MetodoPagoCuentaService,
    private cuentasSrv: CuentaFinancieraService
  ) {}

  ngOnInit(): void {
    this.monto = this.totalPendiente;
    this.cargarCatalogos();
  }

  get nombreArs(): string {
    return this.documentos[0]?.nombreArs || 'ARS';
  }

  get totalPendiente(): number {
    return Math.round(
      (this.documentos || []).reduce((s, d) => s + Number(d.pendienteArs || 0), 0) * 100
    ) / 100;
  }

  get esLote(): boolean {
    return (this.documentos || []).length > 1;
  }

  get metodoSeleccionado(): MetodoPagoCuenta | undefined {
    return this.metodos.find(m => m.metodoPago === this.metodoPago);
  }

  get nombreCuenta(): string {
    return this.etiquetaCuenta(this.metodoSeleccionado);
  }

  etiquetaCuenta(metodo?: MetodoPagoCuenta): string {
    if (!metodo) return '';
    const id = Number(metodo.idCuentaFinanciera || 0);
    if (!id) return 'Sin cuenta';
    return this.cuentas.find(c => Number(c.idCuentaFinanciera) === id)?.nombre
      || metodo.cuentaFinanciera?.nombre
      || `Cuenta #${id}`;
  }

  seleccionar(metodo: MetodoPagoCuenta): void {
    this.metodoPago = metodo?.metodoPago || '';
  }

  private cargarCatalogos(): void {
    this.cargando = true;
    this.cuentasSrv.getByEmpresa(this.idEmpresa).subscribe({
      next: (cuentas) => {
        this.cuentas = cuentas || [];
        this.metodosSrv.getByEmpresa(this.idEmpresa).subscribe({
          next: (rows) => {
            const activos = (rows || []).filter(m => m.activo && Number(m.idCuentaFinanciera) > 0);
            const sinArs = activos.filter(m => String(m.metodoPago || '').toUpperCase() !== 'ARS');
            const soloArs = sinArs.filter(m => !!(m as any).esCobroArs || !!(m as any).EsCobroArs);
            this.metodos = soloArs.length ? soloArs : sinArs;
            if (this.metodos.length) {
              this.metodoPago = this.metodos[0].metodoPago;
            }
            this.cargando = false;
          },
          error: () => {
            this.cargando = false;
            this.toast('No se pudieron cargar las formas de pago', 'danger');
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.toast('No se pudieron cargar las cuentas financieras', 'danger');
      }
    });
  }

  pagarExacto(): void {
    this.monto = this.totalPendiente;
  }

  cerrar(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async confirmar(): Promise<void> {
    if (this.procesando) return;
    const monto = Number(this.monto) || 0;
    if (monto <= 0.009) {
      this.toast('Indique el monto recibido de la ARS', 'warning');
      return;
    }
    if (monto > this.totalPendiente + 0.02) {
      this.toast('El monto no puede superar el pendiente de las facturas', 'danger');
      return;
    }
    if (!this.metodoPago) {
      this.toast('Seleccione la forma de pago vinculada a la cuenta financiera', 'warning');
      return;
    }
    if (!this.metodoSeleccionado?.idCuentaFinanciera) {
      this.toast('Esa forma de pago no tiene cuenta financiera. Configúrela en Métodos de pago.', 'warning');
      return;
    }

    this.procesando = true;
    const ids = this.documentos.map(d => d.idFacturaHeader);
    const req$ = this.esLote
      ? this.ars.registrarPagoLote({
          idEmpresa: this.idEmpresa,
          idFacturaHeaders: ids,
          monto,
          formaPago: this.metodoPago,
          nota: this.nota || undefined,
          idUsuario: this.idUsuario
        })
      : this.ars.registrarPago({
          idEmpresa: this.idEmpresa,
          idFacturaHeader: ids[0],
          monto,
          formaPago: this.metodoPago,
          nota: this.nota || undefined,
          idUsuario: this.idUsuario
        });

    req$.subscribe({
      next: (resp) => {
        this.procesando = false;
        this.modalCtrl.dismiss({ actualizado: true, message: resp?.message }, 'ok');
      },
      error: (e) => {
        this.procesando = false;
        this.toast(e?.error?.message || 'No se pudo registrar el cobro ARS', 'danger');
      }
    });
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2400, color, position: 'top' });
    await t.present();
  }
}
