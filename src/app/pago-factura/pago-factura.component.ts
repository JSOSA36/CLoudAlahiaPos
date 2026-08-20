import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { facturaheader } from 'src/app/models/facturaheader';

import { PagosFacturasClientesService } from '../servicios/PagosFacturasClientesService';
import { PagosFacturasClientes } from '../Modales/PagosFacturasClientes .models';

import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PrintService } from 'src/app/servicios/print.services';

import {
  MetodoPagoCuentaService
} from 'src/app/servicios/metodo-pago-cuenta.service';

@Component({
  selector: 'app-pago-factura',
  templateUrl: './pago-factura.component.html',
  styleUrls: ['./pago-factura.component.scss'],
})
export class PagoFacturaComponent implements OnInit {

  private _factura!: facturaheader;

  @Input()
  set factura(value: facturaheader) {
    this._factura = value;
  }

  get factura(): facturaheader {
    return this._factura;
  }

  private _modo: 'pago' | 'historial' = 'pago';

  @Input()
  set modo(value: 'pago' | 'historial') {
    this._modo = value;
    if (value === 'historial' && this.factura) {
      this.cargarHistorialPagos();
    }
  }

  get modo() {
    return this._modo;
  }

  montoAbono = 0;
  metodoPago = '';
  nota = '';
  cargando = false;
  imprimirRecibo = true;

  metodosPago: any[] = [];
  pagos: PagosFacturasClientes[] = [];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private _pagosSrv: PagosFacturasClientesService,
    private _metodoPagoSrv: MetodoPagoCuentaService,
    private _parametro: ParametrosService,
    private _printService: PrintService
  ) {}

  ngOnInit() {
    this.CargarMetodosPago();
  }

  CargarMetodosPago(): void {
    this._metodoPagoSrv
      .getByEmpresa(this._parametro.GetIdEmpresa())
      .subscribe({
        next: (resp: any[]) => {
          this.metodosPago = (resp || []).filter(x => x.activo);
        },
        error: (err) => console.error(err)
      });
  }

  cargarHistorialPagos() {
    if (!this.factura) return;

    this.cargando = true;
    this._pagosSrv
      .getPagosByFactura(this.factura.idFacturaHeader)
      .subscribe({
        next: (res) => {
          this.pagos = res || [];
          this.cargando = false;
        },
        error: async () => {
          this.cargando = false;
          (
            await this.toastCtrl.create({
              message: 'Error cargando historial',
              duration: 1500,
              color: 'danger'
            })
          ).present();
        }
      });
  }

  async procesarPago() {
    if (!this.montoAbono || this.montoAbono <= 0) {
      (
        await this.toastCtrl.create({
          message: 'Debe ingresar un monto válido',
          duration: 1500,
          color: 'warning'
        })
      ).present();
      return;
    }

    if (this.montoAbono > (this.factura.pendiente || 0)) {
      (
        await this.toastCtrl.create({
          message: 'El monto supera el pendiente',
          duration: 1500,
          color: 'danger'
        })
      ).present();
      return;
    }

    if (!this.metodoPago) {
      (
        await this.toastCtrl.create({
          message: 'Seleccione una forma de pago',
          duration: 1500,
          color: 'warning'
        })
      ).present();
      return;
    }

    this.cargando = true;

    const pago: PagosFacturasClientes = {
      id: 0,
      idFacturaHeader: this.factura.idFacturaHeader,
      numeroDocumento: this.factura.numeroDocumento || '',
      idCliente: this.factura.iDCliente || 0,
      formaPago: this.metodoPago,
      monto: this.montoAbono,
      fechaInseccion: new Date().toISOString(),
      nota: this.nota
    };

    try {
      const resp: any = await firstValueFrom(
        this._pagosSrv.registrarPago(this.factura.idFacturaHeader, pago)
      );

      // El abono ya quedó guardado; la impresión es opcional y no puede revertirlo.
      const idPago = Number(resp?.idPago || 0);
      let mensaje = 'Pago registrado correctamente';
      let color: 'success' | 'warning' = 'success';

      if (this.imprimirRecibo && idPago > 0) {
        const impreso = await this.intentarImprimirRecibo(idPago, false);
        if (!impreso) {
          mensaje =
            'Pago guardado. El recibo no se imprimió (ApiPrint fuera de línea). Puede reimprimirlo en el historial.';
          color = 'warning';
        }
      }

      (
        await this.toastCtrl.create({
          message: mensaje,
          duration: color === 'warning' ? 3500 : 1800,
          color,
          position: 'top'
        })
      ).present();

      this.modalCtrl.dismiss({ actualizado: true, idPago });
    } catch (err) {
      console.error(err);
      (
        await this.toastCtrl.create({
          message: 'Error registrando pago',
          duration: 1500,
          color: 'danger'
        })
      ).present();
    } finally {
      this.cargando = false;
    }
  }

  /** @returns true si se envió a la impresora */
  private async intentarImprimirRecibo(
    idPago: number,
    mostrarToastExito: boolean
  ): Promise<boolean> {
    const api = (this._parametro.ApiPrint || '').trim();
    if (!api) {
      return false;
    }

    try {
      await firstValueFrom(this._printService.printReciboAbono(idPago));
      if (mostrarToastExito) {
        (
          await this.toastCtrl.create({
            message: 'Recibo enviado a la impresora',
            duration: 1800,
            color: 'success',
            position: 'top'
          })
        ).present();
      }
      return true;
    } catch (err) {
      console.error('Error imprimiendo recibo de abono', err);
      return false;
    }
  }

  async reimprimirRecibo(pago: PagosFacturasClientes): Promise<void> {
    const id = Number(pago?.id || 0);
    if (id <= 0) {
      (
        await this.toastCtrl.create({
          message: 'Este pago no tiene Id para reimprimir',
          duration: 2000,
          color: 'warning'
        })
      ).present();
      return;
    }

    const ok = await this.intentarImprimirRecibo(id, true);
    if (!ok) {
      (
        await this.toastCtrl.create({
          message:
            'No se pudo imprimir. Verifique que PrinterApi (ApiPrint) esté en marcha.',
          duration: 3200,
          color: 'danger',
          position: 'top'
        })
      ).present();
    }
  }

  cerrarModal() {
    this.modalCtrl.dismiss();
  }
}
