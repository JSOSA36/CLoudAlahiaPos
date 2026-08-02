import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';
import {
  MetodoPagoCuentaService
} from 'src/app/servicios/metodo-pago-cuenta.service';
import {
  ClienteSaldoAFavorListado,
  NotasCreditoService
} from 'src/app/servicios/notas-credito.service';

@Component({
  selector: 'app-cuentax-pagar',
  templateUrl: './cuentaxpagar.component.html',
  styleUrls: ['./cuentaxpagar.component.scss'],
})
export class CuentaxPagarComponent implements OnInit {
  procesandoFactura = false;

  modalPagoAbierto = false;
  campoPagoActual: 'pago1' | 'pago2' = 'pago1';
  @Input() IdFactPay!: number;
  @Input() TotalFactura!: number;
  @Input() Subtotal!: number;
  @Input() Itbis!: number;
  /** Cliente del POS (requerido para pagar con NC). */
  @Input() IdCliente: number | null = null;
  @Input() NombreCliente: string | null = null;

  @Input() TipoOrden!: string;
  cambio: number = 0;
  _TipoComprobante: string = 'Consumo';
  _PropinaLegal: boolean = false;
  _MontoPropina: number = 0;
  TotalConPropina: number = 0;
  EfectivoRecibido: number = 0;
  Cambio: number = 0;
  _TipoDocumento: 'Orden' | 'Factura' = 'Factura';
  _TipoOrden: 'ComerAqui' | 'Llevar' | 'Delivery' = 'Llevar';

  _TipoFactura: 'Contado' | 'Credito' = 'Contado';
  _FormaPago: string = 'Efectivo';
  _MostrarQR: boolean = false;
  qrData: string = '';
  _PagoMixto: boolean = false;

  metodosPago: any[] = [];
  _ConAbonoCredito: boolean = false;
  _MontoAbonoCredito: number = 0;
  _FormaPagoAbonoCredito: string = '';
  _MetodoPago1: string = '';

  _AbonoMixtoCredito: boolean = false;
  rncCliente: string = '';
  _ClienteSeleccionado: any = null;
  loadingCliente = false;

  modalEfectivo = false;
  _MetodoAbono1: string = '';
  _MontoAbono1: number = 0;
  _MetodoAbono2: string = '';
  _MontoAbono2: number = 0;

  _MontoPago1: number = 0;
  _PagosMixtos: any[] = [];
  ImprimirFacturaCliente: boolean = false;
  _MetodoPago2: string = '';
  _MontoPago2: number = 0;

  MontoPago1 = 0;
  MontoPago2 = 0;

  totalPagado = 0;
  restante = 0;

  _UsarNotaCredito = false;
  ncfBusqueda = '';
  buscandoNc = false;
  saldoNc: ClienteSaldoAFavorListado | null = null;
  montoNc = 0;
  errorNc = '';

  readonly METODO_NC = 'NotaCredito';

  get restanteTrasNc(): number {
    const total = Number(this.TotalFactura) || 0;
    const nc = this._UsarNotaCredito ? (Number(this.montoNc) || 0) : 0;
    return Math.round((total - nc) * 100) / 100;
  }

  calcularPagoNormal() {
    const recibido = this.EfectivoRecibido || this.restanteTrasNc;
    this.cambio = recibido - this.restanteTrasNc;
  }

  calcularPagoMixto() {
    this._MontoPago1 = Number(this.MontoPago1) || 0;
    this._MontoPago2 = Number(this.MontoPago2) || 0;
    this.totalPagado = this._MontoPago1 + this._MontoPago2;
    this.restante = this.restanteTrasNc - this.totalPagado;
  }

  puedeProcesar(): boolean {
    if (this._UsarNotaCredito) {
      if (!this.saldoNc || this.montoNc <= 0) return false;
      if (this.restanteTrasNc < 0) return false;
      if (this.restanteTrasNc === 0) return true;
    }

    if (!this._PagoMixto) {
      return true;
    }

    this.calcularPagoMixto();
    return Math.abs(this.restante) < 0.01;
  }

  constructor(
    private modalCtrl: ModalController,
    private _Parametro: ParametrosService,
    private toastCtrl: ToastController,
    private _ClientesService: ClienteService,
    private alertCtrl: AlertController,
    private metodoPagoCuentaService: MetodoPagoCuentaService,
    private notasCreditoService: NotasCreditoService
  ) {}

  ngOnInit() {
    this.CargarMetodosPago();
    if (this.IdCliente && this.IdCliente > 0) {
      this._ClienteSeleccionado = {
        idCliente: this.IdCliente,
        nombre: this.NombreCliente
      };
    }
  }

  calcularCambio() {
    const recibido = Number(this.EfectivoRecibido) || 0;
    const total = Number(this.restanteTrasNc) || 0;
    this.cambio = recibido - total;
    if (this.cambio < 0) this.cambio = 0;
  }

  CargarMetodosPago(): void {
    this.metodoPagoCuentaService
      .getByEmpresa(this._Parametro.GetIdEmpresa())
      .subscribe({
        next: (resp: any[]) => {
          this.metodosPago = (resp || []).filter(x => x.activo);
        },
        error: (err) => console.error(err)
      });
  }

  onToggleNotaCredito() {
    if (!this._UsarNotaCredito) {
      this.limpiarNc();
    }
  }

  limpiarNc() {
    this.ncfBusqueda = '';
    this.saldoNc = null;
    this.montoNc = 0;
    this.errorNc = '';
  }

  async buscarNotaCredito() {
    this.errorNc = '';
    this.saldoNc = null;
    this.montoNc = 0;

    const idCliente = this.IdCliente || this._ClienteSeleccionado?.idCliente || 0;
    if (!idCliente) {
      this.errorNc = 'Seleccione el cliente en el POS antes de usar una nota de crédito.';
      return;
    }

    const numero = (this.ncfBusqueda || '').trim();
    if (!numero) {
      this.errorNc = 'Indique el e-NCF o el número de la nota de crédito.';
      return;
    }

    this.buscandoNc = true;
    this.notasCreditoService
      .obtenerSaldoPorNumero(this._Parametro.GetIdEmpresa(), idCliente, numero)
      .subscribe({
        next: (saldo) => {
          this.buscandoNc = false;
          this.saldoNc = saldo;
          const disponible = Number(saldo.saldoDisponible) || 0;
          const total = Number(this.TotalFactura) || 0;
          this.montoNc = Math.min(disponible, total);
          this.calcularCambio();
          this.calcularPagoMixto();
        },
        error: async (err) => {
          this.buscandoNc = false;
          this.errorNc = typeof err?.error === 'string'
            ? err.error
            : (err?.error?.message || err?.message || 'No se pudo consultar la nota de crédito.');
          (await this.toastCtrl.create({
            message: this.errorNc,
            duration: 2500,
            color: 'danger'
          })).present();
        }
      });
  }

  onMontoNcChange() {
    if (!this.saldoNc) return;
    const max = Math.min(
      Number(this.saldoNc.saldoDisponible) || 0,
      Number(this.TotalFactura) || 0
    );
    let m = Number(this.montoNc) || 0;
    if (m < 0) m = 0;
    if (m > max) m = max;
    this.montoNc = Math.round(m * 100) / 100;
    this.calcularCambio();
    this.calcularPagoMixto();
  }

  sumarEfectivo(monto: number) {
    this.EfectivoRecibido = monto;
    this.calcularCambio();
  }

  abrirModalEfectivo() {
    this.modalEfectivo = true;
  }

  cerrarModalEfectivo() {
    this.modalEfectivo = false;
  }

  pagoExacto() {
    this.EfectivoRecibido = this.restanteTrasNc;
    this.calcularCambio();
    this.cerrarModalEfectivo();
  }

  setEfectivo(monto: number) {
    this.EfectivoRecibido = monto;
    this.calcularCambio();
    this.cerrarModalEfectivo();
  }

  get restanteCredito(): number {
    if (!this._ConAbonoCredito) return this.TotalFactura;

    if (!this._AbonoMixtoCredito) {
      return this.TotalFactura - Number(this._MontoAbonoCredito || 0);
    }

    const abono =
      Number(this._MontoAbono1 || 0) +
      Number(this._MontoAbono2 || 0);

    return this.TotalFactura - abono;
  }

  setMonto(valor: number) {
    this.EfectivoRecibido = valor;
    this.calcularCambio();
  }

  async abrirModalClientes() {
    const modal = await this.modalCtrl.create({
      component: ClientesComponent,
      cssClass: 'modal-clientes-full',
      componentProps: { isModalSeleccion: true },
      presentingElement: await this.modalCtrl.getTop(),
      breakpoints: [0, 1],
      initialBreakpoint: 1
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.cliente) {
      this._ClienteSeleccionado = data.cliente;
      this.IdCliente = data.cliente.idCliente ?? data.cliente.id ?? null;
      this.NombreCliente = data.cliente.nombreComercial || data.cliente.nombre || null;
      this.limpiarNc();
    }
  }

  private construirPagosContado(): any[] {
    const pagos: any[] = [];
    const total = Number(this.TotalFactura) || 0;
    const montoNc = this._UsarNotaCredito ? (Number(this.montoNc) || 0) : 0;
    const restante = Math.round((total - montoNc) * 100) / 100;

    if (montoNc > 0 && this.saldoNc) {
      pagos.push({
        metodo: this.METODO_NC,
        monto: montoNc,
        idSaldoAFavor: this.saldoNc.idSaldoAFavor,
        idNotaCredito: this.saldoNc.idNotaCredito,
        ncfNotaCredito: this.saldoNc.ncfNotaCredito
          || this.saldoNc.numeroDocumentoNotaCredito
          || this.ncfBusqueda
      });
    }

    if (restante <= 0) {
      return pagos;
    }

    if (!this._PagoMixto) {
      pagos.push({
        metodo: this._FormaPago,
        monto: restante
      });
    } else {
      let monto1 = Number(this.MontoPago1) || Number(this._MontoPago1) || 0;
      let monto2 = Number(this.MontoPago2) || Number(this._MontoPago2) || 0;
      const suma = monto1 + monto2;

      if (suma < restante) {
        const diferencia = restante - suma;
        if (this._MetodoPago1 === 'Efectivo') monto1 += diferencia;
        else if (this._MetodoPago2 === 'Efectivo') monto2 += diferencia;
        else monto2 += diferencia;
      }

      if (monto1 > 0) {
        pagos.push({ metodo: this._MetodoPago1, monto: monto1 });
      }
      if (monto2 > 0) {
        pagos.push({ metodo: this._MetodoPago2, monto: monto2 });
      }
    }

    return pagos;
  }

  private construirPagosAbono(): any[] {
    const pagos: any[] = [];

    if (!this._AbonoMixtoCredito) {
      pagos.push({
        metodo: this._FormaPagoAbonoCredito,
        monto: Number(this._MontoAbonoCredito)
      });
    } else {
      let monto1 = Number(this._MontoAbono1) || 0;
      let monto2 = Number(this._MontoAbono2) || 0;
      const total = Number(this.TotalFactura) || 0;
      const suma = monto1 + monto2;

      if (suma > total) {
        const exceso = suma - total;
        if (this._MetodoAbono1 === 'Efectivo') monto1 -= exceso;
        else if (this._MetodoAbono2 === 'Efectivo') monto2 -= exceso;
        else monto2 -= exceso;
      }

      if (monto1 > 0) {
        pagos.push({ metodo: this._MetodoAbono1, monto: monto1 });
      }
      if (monto2 > 0) {
        pagos.push({ metodo: this._MetodoAbono2, monto: monto2 });
      }
    }

    return pagos;
  }

  async CloseModal() {
    if (this._TipoFactura === 'Credito' && !this._ClienteSeleccionado && !this.IdCliente) {
      (await this.toastCtrl.create({
        message: 'Debe seleccionar un cliente para crédito',
        duration: 1500,
        color: 'warning'
      })).present();
      return;
    }

    if (this._UsarNotaCredito) {
      const idCliente = this.IdCliente || this._ClienteSeleccionado?.idCliente || 0;
      if (!idCliente) {
        (await this.toastCtrl.create({
          message: 'Seleccione el cliente titular de la nota de crédito',
          duration: 2000,
          color: 'warning'
        })).present();
        return;
      }
      if (!this.saldoNc || this.montoNc <= 0) {
        (await this.toastCtrl.create({
          message: 'Busque la nota de crédito e indique el monto a aplicar',
          duration: 2000,
          color: 'warning'
        })).present();
        return;
      }
      if (this.montoNc > (Number(this.saldoNc.saldoDisponible) || 0) + 0.001) {
        (await this.toastCtrl.create({
          message: 'El monto de la NC supera el saldo disponible',
          duration: 2000,
          color: 'danger'
        })).present();
        return;
      }
    }

    if (this._TipoFactura === 'Contado') {
      if (this.restanteTrasNc > 0.009) {
        if (!this._PagoMixto && !this._FormaPago) {
          (await this.toastCtrl.create({
            message: 'Seleccione una forma de pago para el restante',
            duration: 1500,
            color: 'warning'
          })).present();
          return;
        }

        if (this._PagoMixto) {
          if (!this._MetodoPago1 || !this._MetodoPago2) {
            (await this.toastCtrl.create({
              message: 'Debe seleccionar ambos métodos de pago',
              duration: 1500,
              color: 'warning'
            })).present();
            return;
          }

          const m1 = Number(this.MontoPago1) || Number(this._MontoPago1) || 0;
          const m2 = Number(this.MontoPago2) || Number(this._MontoPago2) || 0;
          if (!m1 || !m2) {
            (await this.toastCtrl.create({
              message: 'Debe colocar ambos montos',
              duration: 1500,
              color: 'warning'
            })).present();
            return;
          }

          const totalPagos = m1 + m2;
          if (Math.abs(totalPagos - this.restanteTrasNc) > 0.01) {
            (await this.toastCtrl.create({
              message: 'Los montos mixtos deben cubrir el restante tras la nota de crédito',
              duration: 2000,
              color: 'danger'
            })).present();
            return;
          }
        }
      }
    }

    let pagos: any[] = [];

    if (this._TipoFactura === 'Contado') {
      pagos = this.construirPagosContado();
    }

    if (this._TipoFactura === 'Credito' && this._ConAbonoCredito) {
      pagos = this.construirPagosAbono();

      const totalAbono = pagos.reduce(
        (sum: number, p: any) => sum + Number(p.monto),
        0
      );

      if (totalAbono >= this.TotalFactura) {
        (await this.toastCtrl.create({
          message: 'El abono no puede ser igual o mayor al total',
          duration: 1500,
          color: 'danger'
        })).present();
        return;
      }
    }

    const sumaPagos = pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
    if (this._TipoFactura === 'Contado' && Math.abs(sumaPagos - Number(this.TotalFactura)) > 0.02) {
      (await this.toastCtrl.create({
        message: 'La suma de pagos no coincide con el total de la factura',
        duration: 2000,
        color: 'danger'
      })).present();
      return;
    }

    const dataSalida = {
      idFactura: this.IdFactPay ?? 0,
      tipoFactura: this._TipoFactura,
      idCliente: this.IdCliente || this._ClienteSeleccionado?.idCliente || 0,
      imprimir: this.ImprimirFacturaCliente,
      pagos
    };

    this.limpiarEstado();
    this.modalCtrl.dismiss(dataSalida, 'ok');
  }

  CerrarModal() {
    this.limpiarEstado();
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async ConfirmarCierre() {
    this.limpiarEstado();
    this.modalCtrl.dismiss(true, 'ok');
  }

  limpiarEstado() {
    this._ClienteSeleccionado = null;
    this._TipoFactura = 'Contado';
    this._FormaPago = 'Efectivo';
    this._MostrarQR = false;
    this.qrData = '';
    this._UsarNotaCredito = false;
    this.limpiarNc();
  }

  async abrirModalFormaPago() {
    const alert = await this.alertCtrl.create({
      header: 'Forma de Pago',
      inputs: [
        { type: 'radio', label: 'Efectivo', value: 'Efectivo', checked: this._FormaPago === 'Efectivo' },
        { type: 'radio', label: 'Tarjeta', value: 'Tarjeta', checked: this._FormaPago === 'Tarjeta' },
        { type: 'radio', label: 'Transferencia BHD', value: 'Transferencia BHD', checked: this._FormaPago === 'Transferencia BHD' },
        { type: 'radio', label: 'Transferencia Popular', value: 'Transferencia Popular', checked: this._FormaPago === 'Transferencia Popular' },
        { type: 'radio', label: 'Transferencia BanReservas', value: 'Transferencia Reserva', checked: this._FormaPago === 'Transferencia Reserva' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'OK', handler: (data) => { this._FormaPago = data; } }
      ]
    });
    await alert.present();
  }

  abrirMetodosPago(campo: 'pago1' | 'pago2') {
    this.campoPagoActual = campo;
    this.modalPagoAbierto = true;
  }

  seleccionarPago(pago: string) {
    if (!this._PagoMixto) {
      this._FormaPago = pago;
    } else if (this.campoPagoActual === 'pago1') {
      this._MetodoPago1 = pago;
    } else {
      this._MetodoPago2 = pago;
    }

    this.modalPagoAbierto = false;

    if (pago === 'UberEats' || pago === 'PedidosYa') {
      this.EfectivoRecibido = this.restanteTrasNc;
      this.cambio = 0;
    }
  }

  validarClienteAutomatico() {
    if (this._TipoFactura === 'Contado' && this._TipoComprobante === 'Consumo') {
      this._ClienteSeleccionado = null;
    }
  }

  getIconoFormaPago(pago: string): string {
    switch (pago) {
      case 'Efectivo': return 'assets/bancos/efectivo.png';
      case 'Tarjeta': return 'assets/bancos/tarjeta.png';
      case 'Transferencia BHD': return 'assets/bancos/bhd.png';
      case 'Transferencia Popular': return 'assets/bancos/popular.png';
      case 'Transferencia Reserva': return 'assets/bancos/reserva.png';
      default: return '';
    }
  }

  limpiarCliente() {
    this._ClienteSeleccionado = null;
    this.rncCliente = '';
    this.limpiarNc();
  }

  buscarCliente() {
    if (!this.rncCliente) return;
    this.loadingCliente = true;
    this.loadingCliente = false;
  }
}
