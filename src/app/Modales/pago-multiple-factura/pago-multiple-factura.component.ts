import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { FacturaHeaderDto } from 'src/app/Modales/facturaheader.dto';
import { MetodoPagoCuentaService } from 'src/app/servicios/metodo-pago-cuenta.service';
import { PagosFacturasClientesService } from 'src/app/servicios/PagosFacturasClientesService';
import { ParametrosService } from 'src/app/servicios/parametros.service';

interface LineaAplicacion {
  factura: FacturaHeaderDto;
  monto: number;
}

@Component({
  selector: 'app-pago-multiple-factura',
  templateUrl: './pago-multiple-factura.component.html',
  styleUrls: ['./pago-multiple-factura.component.scss'],
})
export class PagoMultipleFacturaComponent implements OnInit {
  @Input() facturas: FacturaHeaderDto[] = [];
  @Input() nombreCliente = 'Cliente';

  lineas: LineaAplicacion[] = [];
  montoTotal = 0;
  metodoPago = '';
  nota = '';
  cargando = false;
  metodosPago: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private pagosSrv: PagosFacturasClientesService,
    private metodoPagoSrv: MetodoPagoCuentaService,
    private parametros: ParametrosService
  ) {}

  ngOnInit(): void {
    this.lineas = (this.facturas || [])
      .slice()
      .sort((a, b) => {
        const fa = a.fechaBencimiento ? new Date(a.fechaBencimiento).getTime() : 0;
        const fb = b.fechaBencimiento ? new Date(b.fechaBencimiento).getTime() : 0;
        if (fa !== fb) return fa - fb;
        return Number(a.idFacturaHeader) - Number(b.idFacturaHeader);
      })
      .map((f) => ({
        factura: f,
        monto: Number(f.pendiente || 0),
      }));

    this.montoTotal = this.totalPendiente;
    this.cargarMetodosPago();
  }

  get totalPendiente(): number {
    return this.lineas.reduce((s, l) => s + Number(l.factura.pendiente || 0), 0);
  }

  get totalAplicado(): number {
    return this.lineas.reduce((s, l) => s + Number(l.monto || 0), 0);
  }

  get idCliente(): number {
    return Number(this.lineas[0]?.factura?.iDCliente || 0);
  }

  cargarMetodosPago(): void {
    this.metodoPagoSrv.getByEmpresa(this.parametros.GetIdEmpresa()).subscribe({
      next: (resp: any[]) => {
        this.metodosPago = (resp || []).filter((x) => x.activo);
        if (this.metodosPago.length && !this.metodoPago) {
          this.metodoPago = this.metodosPago[0].metodoPago;
        }
      },
    });
  }

  /** Redistribuye el monto total FIFO por vencimiento. */
  aplicarFifo(): void {
    let resto = Math.max(0, Number(this.montoTotal) || 0);
    for (const linea of this.lineas) {
      const pend = Number(linea.factura.pendiente || 0);
      const abono = Math.min(pend, resto);
      linea.monto = Math.round(abono * 100) / 100;
      resto = Math.round((resto - abono) * 100) / 100;
    }
  }

  onMontoTotalChange(): void {
    this.aplicarFifo();
  }

  onLineaChange(linea: LineaAplicacion): void {
    const pend = Number(linea.factura.pendiente || 0);
    let m = Number(linea.monto) || 0;
    if (m < 0) m = 0;
    if (m > pend) m = pend;
    linea.monto = Math.round(m * 100) / 100;
    this.montoTotal = this.totalAplicado;
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  async confirmar(): Promise<void> {
    const aplicadas = this.lineas.filter((l) => Number(l.monto) > 0);
    if (!aplicadas.length) {
      await this.toast('Indique al menos un monto a cobrar', 'warning');
      return;
    }
    if (!this.metodoPago) {
      await this.toast('Seleccione una forma de pago', 'warning');
      return;
    }
    for (const l of aplicadas) {
      if (Number(l.monto) > Number(l.factura.pendiente || 0) + 0.001) {
        await this.toast(`El monto supera el pendiente de la factura #${l.factura.idFacturaHeader}`, 'danger');
        return;
      }
    }
    if (this.idCliente <= 0) {
      await this.toast('Cliente no válido en las facturas seleccionadas', 'danger');
      return;
    }

    this.cargando = true;
    try {
      const result = await firstValueFrom(
        this.pagosSrv.registrarPagoLote({
          idEmpresa: this.parametros.GetIdEmpresa(),
          idCliente: this.idCliente,
          formaPago: this.metodoPago,
          nota: this.nota || undefined,
          aplicaciones: aplicadas.map((l) => ({
            idFacturaHeader: l.factura.idFacturaHeader,
            monto: Number(l.monto),
          })),
        })
      );

      await this.toast(result?.message || 'Cobro múltiple registrado', 'success');
      this.modalCtrl.dismiss({ actualizado: true });
    } catch (err: any) {
      const msg = err?.error?.message || 'Error registrando el cobro múltiple';
      await this.toast(msg, 'danger');
    } finally {
      this.cargando = false;
    }
  }

  private async toast(message: string, color = 'dark'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }
}
