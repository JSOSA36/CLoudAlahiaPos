import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { FacturaCompra } from 'src/app/models/compras.models';
import { CuentaFinanciera } from 'src/app/models/CuentaFinanciera.models';
import { MetodoPagoCuenta } from 'src/app/models/MetodoPagoCuenta.models';
import { ComprasService } from 'src/app/servicios/compras.service';
import { CuentaFinancieraService } from 'src/app/servicios/cuenta-financiera.service';
import { MetodoPagoCuentaService } from 'src/app/servicios/metodo-pago-cuenta.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-pago-proveedor-modal',
  templateUrl: './pago-proveedor-modal.component.html',
  styleUrls: ['./pago-proveedor-modal.component.scss'],
})
export class PagoProveedorModalComponent implements OnInit {
  @Input() factura!: FacturaCompra;

  monto = 0;
  formaPago = 'EFECTIVO';
  idCuentaFinanciera: number | null = null;
  nota = '';
  procesando = false;

  metodosPago: MetodoPagoCuenta[] = [];
  cuentas: CuentaFinanciera[] = [];

  constructor(
    private modalCtrl: ModalController,
    private comprasService: ComprasService,
    private metodoPagoService: MetodoPagoCuentaService,
    private cuentaService: CuentaFinancieraService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.monto = Number(this.factura?.pendiente || 0);
    const idEmpresa = this.parametros.GetIdEmpresa();

    this.metodoPagoService.getByEmpresa(idEmpresa).subscribe(d => {
      this.metodosPago = (d || []).filter(m => m.activo !== false);
      if (this.metodosPago.length) {
        this.formaPago = this.metodosPago[0].metodoPago;
        this.sincronizarCuentaDesdeMetodo();
      }
    });

    this.cuentaService.getByEmpresa(idEmpresa).subscribe(d => {
      this.cuentas = (d || []).filter(c => c.activa !== false);
      if (!this.idCuentaFinanciera && this.cuentas.length) {
        this.sincronizarCuentaDesdeMetodo();
      }
    });
  }

  get pendiente(): number {
    return Number(this.factura?.pendiente || 0);
  }

  get cuentaSeleccionada(): CuentaFinanciera | undefined {
    return this.cuentas.find(c => c.idCuentaFinanciera === Number(this.idCuentaFinanciera));
  }

  get saldoDisponible(): number {
    return Number(this.cuentaSeleccionada?.saldoDisponible ?? 0);
  }

  onMetodoChange(): void {
    this.sincronizarCuentaDesdeMetodo();
  }

  private sincronizarCuentaDesdeMetodo(): void {
    const metodo = this.metodosPago.find(
      m => (m.metodoPago || '').toUpperCase() === (this.formaPago || '').toUpperCase()
    );
    if (metodo?.idCuentaFinanciera) {
      this.idCuentaFinanciera = metodo.idCuentaFinanciera;
      return;
    }
    if (!this.idCuentaFinanciera && this.cuentas.length) {
      this.idCuentaFinanciera = this.cuentas[0].idCuentaFinanciera;
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async confirmar() {
    const monto = Number(this.monto);
    if (!monto || monto <= 0) {
      await this.toast('Indique un monto válido');
      return;
    }
    if (monto > this.pendiente + 0.0001) {
      await this.toast('El monto no puede superar el pendiente');
      return;
    }
    if (!this.idCuentaFinanciera) {
      await this.toast('Seleccione la cuenta de donde saldrá el dinero');
      return;
    }
    if (this.saldoDisponible < monto) {
      await this.toast(
        `Fondos insuficientes en ${this.cuentaSeleccionada?.nombre || 'la cuenta'}. Disponible: ${this.saldoDisponible.toFixed(2)}`
      );
      return;
    }
    if (!this.formaPago?.trim()) {
      await this.toast('Seleccione forma de pago');
      return;
    }

    this.procesando = true;
    try {
      const resp = await firstValueFrom(
        this.comprasService.registrarPago(this.factura.idOrdenCompraHeader, {
          idEmpresa: this.parametros.GetIdEmpresa(),
          idUsuario: this.parametros.IdUsuario || 0,
          monto,
          formaPago: this.formaPago.trim().toUpperCase(),
          idCuentaFinanciera: Number(this.idCuentaFinanciera),
          nota: this.nota?.trim() || undefined
        })
      );

      if (resp?.success === false) {
        await this.toast(resp?.message || 'No se pudo registrar el pago');
        return;
      }

      await this.toast(
        monto >= this.pendiente ? 'Pago completo registrado' : 'Abono registrado'
      );
      this.modalCtrl.dismiss({ ok: true, data: resp?.data });
    } catch (e: any) {
      await this.toast(e?.error?.message || e?.message || 'Error en pago');
    } finally {
      this.procesando = false;
    }
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      color: message.toLowerCase().includes('registrado') ? 'success' : 'warning'
    });
    await t.present();
  }
}
