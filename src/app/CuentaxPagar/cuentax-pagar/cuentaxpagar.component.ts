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
import { RncCLienteDGIIService } from 'src/app/servicios/RncCLienteDGII.services';
import { RrhhService } from 'src/app/servicios/rrhh.service';
import { ParametroConfigService } from 'src/app/servicios/parametrosconfig.service';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import {
  PLAZOS_CREDITO,
  PlazoCreditoOpcion,
  resolverDiasPlazo
} from 'src/app/shared/plazo-credito.util';
import {
  CargoPagoAplicado,
  CargoPagoRegla,
  CargoPagoService
} from 'src/app/servicios/cargo-pago.service';

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
  /** Solo en venta nueva del POS; no en cobro de factura existente. */
  @Input() mostrarConsumoColaborador = true;
  @Input() TotalFactura!: number;
  @Input() Subtotal!: number;
  @Input() Itbis!: number;
  /** Cliente del POS (requerido para pagar con NC). */
  @Input() IdCliente: number | null = null;
  @Input() NombreCliente: string | null = null;
  /** Plazo en días si el cobro parcial pasa a crédito (default 30). */
  @Input() PlazoDias: number = 30;

  @Input() TipoOrden!: string;
  /** CONTADO | CREDITO desde el POS. */
  @Input() TipoPagoInicial: 'CONTADO' | 'CREDITO' = 'CONTADO';
  @Input() UsaCxC = false;
  @Input() PlazosCredito: PlazoCreditoOpcion[] = PLAZOS_CREDITO;
  @Input() PlazoCreditoCodigo = '30';
  @Input() PlazoCreditoDiasCustom: number | null = 30;
  @Input() FacturacionElectronica = false;
  @Input() TiposComprobante: Array<{
    value: number | null;
    label: string;
    disabled?: boolean;
    alertaBaja?: boolean;
    restantes?: number;
  }> = [];
  @Input() TipoEcfDgii: number | null = null;
  @Input() RncFiscal = '';
  @Input() NombreFiscal = '';

  colaboradores: Array<{
    idEmpleados: number;
    nombre: string;
    porcentaje: number;
    descontarNomina: boolean;
  }> = [];
  idEmpleadoConsumo: number | null = 0;
  pctColaborador = 0;
  descontarNominaColaborador = false;
  nombreColaborador = '';

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
  ImprimirFacturaCliente: boolean = true;
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

  plazoCreditoCodigo = '30';
  plazoCreditoDiasCustom: number | null = 30;
  plazosCredito = PLAZOS_CREDITO;
  tipoEcfDgii: number | null = null;
  rncFiscal = '';
  nombreFiscal = '';
  estadoRnc = '';
  mensajeRnc = '';

  readonly METODO_NC = 'NotaCredito';

  cargoReglas: CargoPagoRegla[] = [];
  cargosPagoHabilitado = false;

  /** Total de la venta sin cargo por método de pago. */
  get baseSinCargo(): number {
    const t = Number(this.TotalFactura) || 0;
    const desc = this.montoDescuentoColaborador;
    return Math.round((t - desc) * 100) / 100;
  }

  get omitirCargoPorEcf(): boolean {
    if (this.tipoEcfDgii != null) return true;
    const t = (this._TipoComprobante || '').trim().toLowerCase();
    return t === 'crédito fiscal'
      || t === 'credito fiscal'
      || t === 'consumidor final'
      || t === 'gubernamental';
  }

  get metodosParaCargo(): string[] {
    if (this._TipoFactura !== 'Contado') return [];
    if (this._PagoMixto) {
      return [this._MetodoPago1, this._MetodoPago2].filter(m => !!m);
    }
    return this._FormaPago ? [this._FormaPago] : [];
  }

  get cargoCalculo() {
    if (!this.cargosPagoHabilitado || this.omitirCargoPorEcf) {
      return {
        baseCalculo: this.baseSinCargo,
        montoCargo: 0,
        totalConCargo: this.baseSinCargo,
        cargos: [] as CargoPagoAplicado[]
      };
    }
    return this.cargoPagoService.calcularLocal(
      this.cargoReglas,
      this.metodosParaCargo,
      this.baseSinCargo
    );
  }

  get cargosAplicados(): CargoPagoAplicado[] {
    return this.cargoCalculo.cargos;
  }

  get montoCargoPago(): number {
    return this.cargoCalculo.montoCargo;
  }

  get etiquetaCargoPago(): string {
    const cargos = this.cargosAplicados;
    if (!cargos.length) return '';
    return cargos.map(c => c.nombre).join(' + ');
  }

  get totalAPagar(): number {
    return Math.round((this.baseSinCargo + this.montoCargoPago) * 100) / 100;
  }

  get montoDescuentoColaborador(): number {
    const pct = Number(this.pctColaborador) || 0;
    if (pct <= 0) return 0;
    const base = Number(this.Subtotal) || Number(this.TotalFactura) || 0;
    return Math.round(base * (pct / 100) * 100) / 100;
  }

  get restanteTrasNc(): number {
    const total = this.totalAPagar;
    const nc = this._UsarNotaCredito ? (Number(this.montoNc) || 0) : 0;
    return Math.round((total - nc) * 100) / 100;
  }

  get requiereDatosFiscales(): boolean {
    return (
      this._TipoComprobante === 'Crédito Fiscal' ||
      this._TipoComprobante === 'Gubernamental'
    );
  }

  get diasPlazoCredito(): number {
    return resolverDiasPlazo(this.plazoCreditoCodigo, this.plazoCreditoDiasCustom);
  }

  calcularPagoNormal() {
    this.calcularCambio();
  }

  /** Saldo que queda a crédito si el cobro es parcial. */
  get pendienteAbono(): number {
    if (!this.esAbonoParcialCredito) return 0;
    return Math.max(
      0,
      Math.round((this.restanteTrasNc - this.montoRecibidoAplicar) * 100) / 100
    );
  }

  calcularPagoMixto() {
    this._MontoPago1 = Number(this.MontoPago1) || 0;
    this._MontoPago2 = Number(this.MontoPago2) || 0;
    this.totalPagado = this._MontoPago1 + this._MontoPago2;
    this.restante = this.restanteTrasNc - this.totalPagado;
  }

  puedeProcesar(): boolean {
    if (this._TipoFactura === 'Credito') {
      return true;
    }

    if (this._UsarNotaCredito) {
      if (!this.saldoNc || this.montoNc <= 0) return false;
      if (this.restanteTrasNc < 0) return false;
      if (this.restanteTrasNc === 0) return true;
    }

    if (!this._PagoMixto) {
      return true;
    }

    this.calcularPagoMixto();
    // Mixto: al menos un monto; puede ser parcial (queda a crédito)
    return this.totalPagado > 0.009;
  }

  /** Monto que realmente se aplica como pago (sin NC). */
  get montoRecibidoAplicar(): number {
    const restante = this.restanteTrasNc;
    if (restante <= 0) return 0;

    if (!this._PagoMixto) {
      const recibido = Number(this.EfectivoRecibido);
      if (!Number.isFinite(recibido) || recibido <= 0) return 0;
      return Math.min(recibido, restante);
    }

    this.calcularPagoMixto();
    return Math.min(this.totalPagado, restante);
  }

  get esAbonoParcialCredito(): boolean {
    const restante = this.restanteTrasNc;
    const recibido = this.montoRecibidoAplicar;
    return restante > 0.02 && recibido > 0.009 && recibido < restante - 0.02;
  }

  constructor(
    private modalCtrl: ModalController,
    private _Parametro: ParametrosService,
    private toastCtrl: ToastController,
    private _ClientesService: ClienteService,
    private alertCtrl: AlertController,
    private metodoPagoCuentaService: MetodoPagoCuentaService,
    private notasCreditoService: NotasCreditoService,
    private rncService: RncCLienteDGIIService,
    private rrhh: RrhhService,
    private parametroConfig: ParametroConfigService,
    private feService: FacturacionElectronicaService,
    private cargoPagoService: CargoPagoService
  ) {}

  ngOnInit() {
    this.plazosCredito = this.PlazosCredito?.length
      ? this.PlazosCredito
      : PLAZOS_CREDITO;
    this.plazoCreditoCodigo = this.PlazoCreditoCodigo || '30';
    this.plazoCreditoDiasCustom = this.PlazoCreditoDiasCustom ?? 30;
    this.tipoEcfDgii = this.TipoEcfDgii ?? null;
    this.rncFiscal = this.RncFiscal || '';
    this.nombreFiscal = this.NombreFiscal || '';
    this._TipoFactura =
      this.TipoPagoInicial === 'CREDITO' && this.UsaCxC ? 'Credito' : 'Contado';
    this.onTipoEcfChange(false);
    this.onPlazoCreditoChange();

    this.CargarMetodosPago();
    this.cargarCargosPago();
    this.asegurarFacturacionElectronica();
    if (Number(this.IdFactPay) > 0 || !this._Parametro.tieneModuloRrhh()) {
      this.mostrarConsumoColaborador = false;
    }
    this.cargarColaboradores();
    this.EfectivoRecibido = this.restanteTrasNc;
    this.calcularPagoNormal();
    if (this.IdCliente && this.IdCliente > 0) {
      this._ClienteSeleccionado = {
        idCliente: this.IdCliente,
        nombre: this.NombreCliente
      };
      this.precargarSaldoCliente();
    }
  }

  private cargarCargosPago(): void {
    this.cargosPagoHabilitado = this._Parametro.tieneModulo('CARGOS_PAGO');
    if (!this.cargosPagoHabilitado) {
      this.cargoReglas = [];
      return;
    }
    const idEmpresa = this._Parametro.GetIdEmpresa();
    if (!idEmpresa) return;
    this.cargoPagoService.listar(idEmpresa).subscribe({
      next: (rows) => {
        this.cargoReglas = rows || [];
        this.sincronizarMontoCobroTrasCargo();
      },
      error: () => {
        this.cargoReglas = [];
      }
    });
  }

  /** Recalcula total (con cargo) y ajusta el monto a cobrar si seguía el total anterior. */
  onMetodoPagoChange(): void {
    this.sincronizarMontoCobroTrasCargo();
  }

  private sincronizarMontoCobroTrasCargo(): void {
    if (this._TipoFactura !== 'Contado') return;
    if (this._PagoMixto) {
      this.calcularPagoMixto();
      return;
    }
    this.EfectivoRecibido = this.restanteTrasNc;
    this.calcularPagoNormal();
  }

  /** Órdenes/mesas no pasan FE; el POS sí. Carga param + secuencias si hace falta. */
  private asegurarFacturacionElectronica() {
    const idEmpresa = this._Parametro.IdEmpresa || this._Parametro.GetIdEmpresa();
    if (!idEmpresa) return;

    const aplicarSecuencias = () => {
      if (this.TiposComprobante?.length) return;
      this.feService.getSecuenciasDisponibles(idEmpresa).subscribe({
        next: (secuencias) => {
          this.TiposComprobante = [
            { value: null, label: 'FACT (Sin comprobante)', disabled: false, alertaBaja: false, restantes: 0 }
          ];
          for (const s of secuencias || []) {
            const disabled = !!s.agotada || !!s.vencida;
            const alertaBaja = !disabled && s.restantes <= s.stockMinimo;
            let label = `e${s.tipoEcfDgii} - ${s.descripcion}`;
            if (disabled) label += ' (No disponible)';
            else if (alertaBaja) label += ` (${s.restantes} restantes)`;
            this.TiposComprobante.push({
              value: s.tipoEcfDgii,
              label,
              disabled,
              alertaBaja,
              restantes: s.restantes
            });
          }
        },
        error: () => {
          this.TiposComprobante = [
            { value: null, label: 'FACT (Sin comprobante)', disabled: false, alertaBaja: false, restantes: 0 }
          ];
        }
      });
    };

    if (this.FacturacionElectronica) {
      aplicarSecuencias();
      return;
    }

    this.parametroConfig.getParametrosEmpresa(idEmpresa).subscribe({
      next: (params) => {
        const fe = (params || []).find(
          (x: any) => (x.clave || x.Clave) === 'FACTURACION_ELECTRONICA'
        );
        const valor = (fe?.valor ?? '').toString().toLowerCase();
        if (valor === 'true') {
          this.FacturacionElectronica = true;
          aplicarSecuencias();
        }
      }
    });
  }

  onTipoFacturaChange() {
    if (this._TipoFactura === 'Credito') {
      this._UsarNotaCredito = false;
      this.limpiarNc();
      this._PagoMixto = false;
      this._FormaPago = '';
      this.EfectivoRecibido = 0;
      this._MontoPago1 = 0;
      this._MontoPago2 = 0;
      this.MontoPago1 = 0;
      this.MontoPago2 = 0;
      this.cambio = 0;
      this._ConAbonoCredito = false;
      this.onPlazoCreditoChange();
    } else {
      this.EfectivoRecibido = this.restanteTrasNc;
      this.calcularPagoNormal();
    }
  }

  onPlazoCreditoChange(): void {
    if (this.plazoCreditoCodigo === 'custom' && (this.plazoCreditoDiasCustom == null || this.plazoCreditoDiasCustom < 0)) {
      this.plazoCreditoDiasCustom = 30;
    }
    const dias = this.diasPlazoCredito;
    if (dias >= 0) {
      this.PlazoDias = dias;
    }
  }

  onTipoEcfChange(limpiarSiNoRequiere = true) {
    if (this.tipoEcfDgii === null || this.tipoEcfDgii === undefined) {
      this._TipoComprobante = 'FACT';
    } else if (this.tipoEcfDgii === 32) {
      this._TipoComprobante = 'Consumidor Final';
    } else if (this.tipoEcfDgii === 45) {
      this._TipoComprobante = 'Gubernamental';
    } else {
      this._TipoComprobante = 'Crédito Fiscal';
    }

    if (limpiarSiNoRequiere && !this.requiereDatosFiscales) {
      this.rncFiscal = '';
      this.nombreFiscal = '';
      this.mensajeRnc = '';
      this.estadoRnc = '';
    }

    this.sincronizarMontoCobroTrasCargo();
  }

  consultarRnc() {
    if (!this.rncFiscal) return;

    this.estadoRnc = 'loading';
    this.mensajeRnc = 'Consultando DGII...';

    this.rncService.consultarRnc(this.rncFiscal).subscribe({
      next: (resp: any) => {
        this.nombreFiscal = resp?.nombre || '';
        this.estadoRnc = 'success';
        this.mensajeRnc = 'RNC encontrado correctamente';
      },
      error: () => {
        this.nombreFiscal = '';
        this.estadoRnc = 'error';
        this.mensajeRnc = 'No se encontró el RNC';
      }
    });
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

  cargarColaboradores(): void {
    if (!this.mostrarConsumoColaborador) return;
    const id = this._Parametro.GetIdEmpresa();
    if (!id) return;
    this.rrhh.consumoColaborador(id).subscribe({
      next: (rows) => (this.colaboradores = rows || []),
      error: (err) => console.error(err)
    });
  }

  onColaboradorChange(): void {
    const id = Number(this.idEmpleadoConsumo) || 0;
    this.idEmpleadoConsumo = id > 0 ? id : null;
    const row = this.colaboradores.find(c => Number(c.idEmpleados) === id);
    this.pctColaborador = Number(row?.porcentaje) || 0;
    this.descontarNominaColaborador = !!row?.descontarNomina;
    this.nombreColaborador = row?.nombre || '';
    if (this._TipoFactura === 'Contado') {
      this.EfectivoRecibido = this.restanteTrasNc;
      this.calcularPagoNormal();
    }
  }

  onToggleNotaCredito() {
    if (!this._UsarNotaCredito) {
      this.limpiarNc();
    }
  }

  precargarSaldoCliente() {
    const idCliente = this.IdCliente || this._ClienteSeleccionado?.idCliente || 0;
    if (!idCliente || this._TipoFactura !== 'Contado') return;

    this.notasCreditoService
      .listarSaldosAFavor(this._Parametro.GetIdEmpresa(), idCliente)
      .subscribe({
        next: (rows) => {
          const disponible = (rows || []).filter(s =>
            (Number(s.saldoDisponible) || 0) > 0.009
            && String(s.estado || '').toLowerCase() !== 'agotado'
            && String(s.estado || '').toLowerCase() !== 'anulado'
          );
          if (!disponible.length) return;
          const saldo = disponible[0];
          this._UsarNotaCredito = true;
          this.saldoNc = saldo;
          this.ncfBusqueda = saldo.numeroDocumentoNotaCredito || saldo.ncfNotaCredito || '';
          this.montoNc = Math.min(Number(saldo.saldoDisponible) || 0, this.totalAPagar);
          this.calcularCambio();
          this.calcularPagoMixto();
          this.EfectivoRecibido = this.restanteTrasNc;
          this.calcularPagoNormal();
        },
        error: () => { /* sin saldo, el cobro sigue normal */ }
      });
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
          const total = this.totalAPagar;
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
      Number(this.totalAPagar) || 0
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
    if (!this._ConAbonoCredito) return this.totalAPagar;

    if (!this._AbonoMixtoCredito) {
      return this.totalAPagar - Number(this._MontoAbonoCredito || 0);
    }

    const abono =
      Number(this._MontoAbono1 || 0) +
      Number(this._MontoAbono2 || 0);

    return this.totalAPagar - abono;
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
    const total = this.totalAPagar;
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
      const recibido = Number(this.EfectivoRecibido);
      const monto = (!Number.isFinite(recibido) || recibido <= 0)
        ? 0
        : Math.min(recibido, restante);
      if (monto > 0.009) {
        pagos.push({
          metodo: this._FormaPago,
          monto: Math.round(monto * 100) / 100
        });
      }
    } else {
      const monto1 = Number(this.MontoPago1) || Number(this._MontoPago1) || 0;
      const monto2 = Number(this.MontoPago2) || Number(this._MontoPago2) || 0;
      // No forzar a cubrir el total: si paga menos, queda a crédito
      if (monto1 > 0) {
        pagos.push({ metodo: this._MetodoPago1, monto: Math.round(monto1 * 100) / 100 });
      }
      if (monto2 > 0) {
        pagos.push({ metodo: this._MetodoPago2, monto: Math.round(monto2 * 100) / 100 });
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
      const total = this.totalAPagar;
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
    const idCliente =
      this.IdCliente ||
      this._ClienteSeleccionado?.idCliente ||
      this._ClienteSeleccionado?.id ||
      0;

    if (this._UsarNotaCredito) {
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
          if (m1 + m2 <= 0.009) {
            (await this.toastCtrl.create({
              message: 'Indique al menos un monto de pago',
              duration: 1500,
              color: 'warning'
            })).present();
            return;
          }
        } else {
          const recibido = Number(this.EfectivoRecibido) || 0;
          if (recibido <= 0.009) {
            (await this.toastCtrl.create({
              message: 'Indique el monto a cobrar. Si no habrá abono, seleccione Crédito arriba.',
              duration: 2500,
              color: 'warning'
            })).present();
            return;
          }
        }
      }
    }

    if (this._TipoFactura === 'Credito') {
      if (!this.UsaCxC && !this.idEmpleadoConsumo) {
        (await this.toastCtrl.create({
          message: 'Módulo Cuentas por Cobrar no disponible',
          duration: 2000,
          color: 'danger'
        })).present();
        return;
      }
      if (!idCliente && !this.idEmpleadoConsumo) {
        (await this.toastCtrl.create({
          message: 'Seleccione un cliente o un colaborador para dejar a crédito',
          duration: 2000,
          color: 'warning'
        })).present();
        return;
      }
      const dias = this.diasPlazoCredito;
      if (dias < 0) {
        (await this.toastCtrl.create({
          message: 'Indique un plazo de crédito válido',
          duration: 2000,
          color: 'warning'
        })).present();
        return;
      }
      this.PlazoDias = dias;
    }

    if (this.requiereDatosFiscales) {
      if (!this.rncFiscal?.trim() || !this.nombreFiscal?.trim()) {
        (await this.toastCtrl.create({
          message: 'Consulte el RNC / cédula del comprobante fiscal',
          duration: 2200,
          color: 'warning'
        })).present();
        return;
      }
    }

    let pagos: any[] = [];

    if (this._TipoFactura === 'Contado') {
      pagos = this.construirPagosContado();
    }

    if (this._TipoFactura === 'Credito') {
      // En crédito el cobro queda oculto; no tomar un efectivo residual del modo Contado.
      this.EfectivoRecibido = 0;
      this._PagoMixto = false;
      this._ConAbonoCredito = false;
      if (this.montoRecibidoAplicar > 0.009) {
        this._ConAbonoCredito = true;
        if (!this._PagoMixto) {
          this._FormaPagoAbonoCredito = this._FormaPago;
          this._MontoAbonoCredito = this.montoRecibidoAplicar;
          this._AbonoMixtoCredito = false;
        } else {
          this._AbonoMixtoCredito = true;
          this._MetodoAbono1 = this._MetodoPago1;
          this._MontoAbono1 = Number(this.MontoPago1) || Number(this._MontoPago1) || 0;
          this._MetodoAbono2 = this._MetodoPago2;
          this._MontoAbono2 = Number(this.MontoPago2) || Number(this._MontoPago2) || 0;
        }
        pagos = this.construirPagosAbono();

        const totalAbono = pagos.reduce(
          (sum: number, p: any) => sum + Number(p.monto),
          0
        );

        if (totalAbono >= this.totalAPagar) {
          (await this.toastCtrl.create({
            message: 'El abono no puede ser igual o mayor al total',
            duration: 1500,
            color: 'danger'
          })).present();
          return;
        }
      }
    }

    // Pagos de métodos (sin NC) vs total a cubrir tras NC
    const sumaMetodos = pagos
      .filter(p => p.metodo !== this.METODO_NC)
      .reduce((s, p) => s + Number(p.monto || 0), 0);
    const restante = this.restanteTrasNc;
    let tipoFacturaSalida: 'Contado' | 'Credito' = this._TipoFactura;
    const plazoDias = Number.isFinite(Number(this.PlazoDias)) && Number(this.PlazoDias) >= 0
      ? Math.floor(Number(this.PlazoDias))
      : 30;

    if (this._TipoFactura === 'Contado' && restante > 0.02) {
      if (sumaMetodos <= 0.009 && !(this._UsarNotaCredito && this.restanteTrasNc <= 0.009)) {
        (await this.toastCtrl.create({
          message: 'Indique un monto de pago mayor a cero',
          duration: 2000,
          color: 'warning'
        })).present();
        return;
      }

      if (sumaMetodos < restante - 0.02) {
        // Abono parcial → crédito automático
        if (!idCliente && !this.idEmpleadoConsumo) {
          (await this.toastCtrl.create({
            message: 'Para dejar saldo pendiente debe seleccionar un cliente o un colaborador (queda a crédito)',
            duration: 2800,
            color: 'warning'
          })).present();
          return;
        }
        tipoFacturaSalida = 'Credito';
      } else if (Math.abs(sumaMetodos - restante) > 0.02 && sumaMetodos > restante + 0.02) {
        // Solo efectivo puede sobrar (cambio); otros métodos no deben exceder
        const esEfectivo = !this._PagoMixto &&
          String(this._FormaPago || '').toUpperCase().includes('EFECTIVO');
        if (!esEfectivo) {
          (await this.toastCtrl.create({
            message: 'El monto no puede superar el total a pagar',
            duration: 2000,
            color: 'danger'
          })).present();
          return;
        }
        // Recortar pagos de efectivo al restante; el cambio ya se calcula
        pagos = pagos.map(p =>
          p.metodo === this.METODO_NC
            ? p
            : { ...p, monto: Math.min(Number(p.monto) || 0, restante) }
        );
      }
    }

    const dataSalida = {
      idFactura: this.IdFactPay ?? 0,
      tipoFactura: tipoFacturaSalida,
      idCliente,
      idEmpleadoConsumo: this.idEmpleadoConsumo,
      porcentajeDescuentoEmpleado: this.pctColaborador,
      cargarConsumoNomina: !!this.idEmpleadoConsumo
        && this.descontarNominaColaborador
        && tipoFacturaSalida === 'Credito',
      nombreColaborador: this.nombreColaborador || null,
      imprimir: this.ImprimirFacturaCliente,
      plazoDias: tipoFacturaSalida === 'Credito' ? plazoDias : undefined,
      plazoCreditoCodigo: this.plazoCreditoCodigo,
      plazoCreditoDiasCustom: this.plazoCreditoDiasCustom,
      tipoEcfDgii: this.tipoEcfDgii,
      tipoComprobante: this._TipoComprobante,
      rnc: this.rncFiscal || null,
      nombreFiscal: this.nombreFiscal || this.nombreColaborador || null,
      pagado: pagos.reduce((s, p) => s + Number(p.monto || 0), 0),
      pendiente: Math.max(
        0,
        Math.round((this.totalAPagar - pagos.reduce((s, p) => s + Number(p.monto || 0), 0)) * 100) / 100
      ),
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
    this.onMetodoPagoChange();

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
