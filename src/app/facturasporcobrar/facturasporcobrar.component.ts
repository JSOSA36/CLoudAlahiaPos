import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { clientes } from 'src/app/models/clientes';
import { ToastController, ModalController, ViewWillEnter } from '@ionic/angular';
import { PagoFacturaComponent } from '../pago-factura/pago-factura.component';
import { PagoMultipleFacturaComponent } from '../Modales/pago-multiple-factura/pago-multiple-factura.component';
import { FacturaHeaderDto } from '../Modales/facturaheader.dto';

@Component({
  selector: 'app-facturasporcobrar',
  templateUrl: './facturasporcobrar.component.html',
  styleUrls: ['./facturasporcobrar.component.scss'],
})
export class FacturasporcobrarComponent implements OnInit, ViewWillEnter {
  facturas: FacturaHeaderDto[] = [];
  clientes: clientes[] = [];
  todosClientes: clientes[] = [];
  clienteSeleccionado = 0;
  filtro = '';
  cargando = false;
  procesando = false;
  idSucursalFiltro = 0;
  /** Ids de facturas seleccionadas para cobro múltiple (mismo cliente). */
  seleccionadas = new Set<number>();
  /** Fuerza re-render del checkbox si se rechaza una selección. */
  seleccionTick = 0;

  constructor(
    private _facturaSrv: FacturaHeaderService,
    private _clientesSrv: ClienteService,
    private _parametro: ParametrosService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarClientes();
  }

  ionViewWillEnter() {
    if (this.todosClientes.length) {
      this.cargarFacturas();
    }
  }

  cargarClientes() {
    this._clientesSrv.GetListadoClientes(this._parametro.GetIdEmpresa()).subscribe({
      next: (res) => {
        this.todosClientes = res || [];
        this.cargarFacturas();
      },
      error: () => this.toast('Error cargando clientes', 'danger'),
    });
  }

  cargarFacturas(event?: any) {
    this.cargando = !event;
    const idCliente = this.clienteSeleccionado || 0;
    const idEmpresa = this._parametro.IdEmpresa;

    this._facturaSrv.GetAllFacturaPendiente(idCliente, idEmpresa, this.idSucursalFiltro).subscribe({
      next: (res) => {
        this.facturas = (res || []).map((f) => this.normalizarFactura(f));
        this.actualizarClientesConDeuda();
        this.limpiarSeleccionInvalida();
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: () => {
        this.cargando = false;
        event?.target?.complete?.();
        this.toast('Error cargando facturas pendientes', 'danger');
      },
    });
  }

  onFiltroSucursal(id: number): void {
    const next = Number(id) || 0;
    if (next === this.idSucursalFiltro) return;
    this.idSucursalFiltro = next;
    this.cargarFacturas();
  }

  /** El API serializa IDCliente como idCliente; el DTO usa iDCliente. */
  private idClienteDe(f: FacturaHeaderDto | any): number {
    const nested = f?.clientes || {};
    return Number(
      f?.iDCliente ||
        f?.idCliente ||
        f?.IDCliente ||
        nested.idCliente ||
        nested.iDCliente ||
        nested.IDCliente ||
        0
    );
  }

  private normalizarFactura(f: FacturaHeaderDto): FacturaHeaderDto {
    f.iDCliente = this.idClienteDe(f);
    return f;
  }

  private syncSeleccion(forzarRemountCheckbox = false): void {
    this.seleccionadas = new Set(this.seleccionadas);
    if (forzarRemountCheckbox) {
      this.seleccionTick++;
    }
  }

  private actualizarClientesConDeuda() {
    const map = new Map<number, clientes>();
    this.facturas.forEach((f) => {
      if (Number(f.pendiente || 0) <= 0) return;
      const id = this.idClienteDe(f);
      if (id <= 0) return;
      const c = this.todosClientes.find((x) => x.idCliente === id);
      if (c) map.set(c.idCliente, c);
    });
    this.clientes = Array.from(map.values());
  }

  private limpiarSeleccionInvalida() {
    const ids = new Set(this.facturas.map((f) => f.idFacturaHeader));
    for (const id of Array.from(this.seleccionadas)) {
      if (!ids.has(id)) this.seleccionadas.delete(id);
    }
    this.syncSeleccion();
  }

  get filtradas(): FacturaHeaderDto[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.facturas;
    return this.facturas.filter((f) => {
      const nombre = this.nombreCliente(f).toLowerCase();
      const ncf = (f.nCF || '').toLowerCase();
      const id = String(f.idFacturaHeader || '');
      return nombre.includes(q) || ncf.includes(q) || id.includes(q);
    });
  }

  get totalPendiente(): number {
    return this.filtradas.reduce((s, f) => s + Number(f.pendiente || 0), 0);
  }

  get totalDocumentos(): number {
    return this.filtradas.length;
  }

  get facturasSeleccionadas(): FacturaHeaderDto[] {
    return this.facturas.filter((f) => this.seleccionadas.has(f.idFacturaHeader));
  }

  get cantidadSeleccionada(): number {
    return this.seleccionadas.size;
  }

  get totalSeleccionPendiente(): number {
    return this.facturasSeleccionadas.reduce((s, f) => s + Number(f.pendiente || 0), 0);
  }

  get clienteSeleccionId(): number | null {
    const list = this.facturasSeleccionadas;
    if (!list.length) return null;
    const id = this.idClienteDe(list[0]);
    return id > 0 ? id : null;
  }

  get todasVisiblesSeleccionadas(): boolean {
    const list = this.filtradas;
    if (!list.length) return false;
    const clienteId = this.clienteSeleccionId;
    const candidatas = clienteId
      ? list.filter((f) => this.idClienteDe(f) === clienteId)
      : list;
    return candidatas.length > 0 && candidatas.every((f) => this.seleccionadas.has(f.idFacturaHeader));
  }

  estaSeleccionada(f: FacturaHeaderDto): boolean {
    return this.seleccionadas.has(f.idFacturaHeader);
  }

  /** Clave para remount del checkbox al rechazar / cambiar selección. */
  checkboxKey(f: FacturaHeaderDto): string {
    return `${f.idFacturaHeader}-${this.seleccionadas.has(f.idFacturaHeader)}-${this.seleccionTick}`;
  }

  /**
   * Única fuente de verdad para marcar/desmarcar (evita doble toggle por shadow DOM).
   */
  async onSeleccionChange(f: FacturaHeaderDto, ev: Event): Promise<void> {
    const checked = !!((ev as CustomEvent)?.detail?.checked);
    const id = f.idFacturaHeader;

    if (!checked) {
      this.seleccionadas.delete(id);
      this.syncSeleccion();
      return;
    }

    const idCliente = this.idClienteDe(f);
    if (idCliente <= 0) {
      await this.toast('Esta factura no tiene cliente válido', 'warning');
      this.syncSeleccion(true);
      return;
    }

    if (this.seleccionadas.size > 0) {
      const actual = this.clienteSeleccionId;
      if (actual != null && actual !== idCliente) {
        await this.toast('Solo puedes seleccionar facturas del mismo cliente', 'warning');
        this.syncSeleccion(true);
        return;
      }
    }

    this.seleccionadas.add(id);
    this.syncSeleccion();
  }

  async toggleSeleccionarTodas() {
    if (this.todasVisiblesSeleccionadas) {
      this.seleccionadas.clear();
      this.syncSeleccion();
      return;
    }

    const list = this.filtradas;
    if (!list.length) return;

    let idCliente = this.clienteSeleccionId;
    if (idCliente == null) {
      idCliente = this.idClienteDe(list[0]);
    }
    if (!idCliente || idCliente <= 0) {
      await this.toast('No se pudo identificar el cliente de las facturas', 'warning');
      return;
    }

    const delCliente = list.filter((f) => this.idClienteDe(f) === idCliente);
    const otras = list.some((f) => this.idClienteDe(f) !== idCliente);
    if (otras && !this.clienteSeleccionado) {
      await this.toast(
        'Se marcaron solo las facturas del mismo cliente. Filtra por cliente para cobrar otro.',
        'warning'
      );
    }

    this.seleccionadas.clear();
    for (const f of delCliente) {
      this.seleccionadas.add(f.idFacturaHeader);
    }
    this.syncSeleccion();
  }

  limpiarSeleccion() {
    this.seleccionadas.clear();
    this.syncSeleccion();
  }

  nombreCliente(f: FacturaHeaderDto): string {
    const nested = (f as any).clientes?.nombreComercial || (f as any).clientes?.NombreComercial;
    if (nested) return nested;
    const c = this.todosClientes.find((x) => x.idCliente === this.idClienteDe(f));
    if (c?.nombreComercial) return c.nombreComercial;
    const cuenta = ((f as any).nombreCuenta || (f as any).nombreEmpresa || '').trim();
    if (Number((f as any).idEmpleadoConsumo) > 0) {
      return cuenta ? `Colaborador · ${cuenta}` : 'Colaborador';
    }
    return cuenta || 'Cliente';
  }

  diasVencimiento(f: FacturaHeaderDto): number | null {
    if (!f.fechaBencimiento) return null;
    const vence = new Date(f.fechaBencimiento);
    if (isNaN(vence.getTime())) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    vence.setHours(0, 0, 0, 0);
    return Math.round((hoy.getTime() - vence.getTime()) / 86400000);
  }

  etiquetaVencimiento(f: FacturaHeaderDto): string {
    const d = this.diasVencimiento(f);
    if (d == null) return '';
    if (d > 0) return `${d} día(s) vencido`;
    if (d < 0) return `Vence en ${Math.abs(d)} día(s)`;
    return 'Vence hoy';
  }

  onClienteChange() {
    this.limpiarSeleccion();
    this.cargarFacturas();
  }

  irEstadoCuenta() {
    this.router.navigate(['/cuentaxcobrar/estado-cuenta']);
  }

  async efectuarPago(factura: FacturaHeaderDto, event?: Event) {
    event?.stopPropagation();
    this.procesando = true;
    factura.iDCliente = this.idClienteDe(factura) || this.clienteSeleccionado || 0;

    const modal = await this.modalCtrl.create({
      component: PagoFacturaComponent,
      componentProps: { factura, modo: 'pago' },
      cssClass: 'modal-pago-factura',
    });

    modal.onDidDismiss().then((res) => {
      this.procesando = false;
      if (res.data?.actualizado) {
        this.limpiarSeleccion();
        this.cargarFacturas();
      }
    });

    await modal.present();
  }

  async cobrarSeleccionadas() {
    const seleccion = this.facturasSeleccionadas;
    if (seleccion.length < 2) {
      await this.toast('Selecciona al menos 2 facturas del mismo cliente', 'warning');
      return;
    }

    const idCliente = this.idClienteDe(seleccion[0]);
    if (seleccion.some((f) => this.idClienteDe(f) !== idCliente)) {
      await this.toast('Solo puedes cobrar facturas del mismo cliente', 'warning');
      return;
    }

    const nombre = this.nombreCliente(seleccion[0]);
    this.procesando = true;

    const modal = await this.modalCtrl.create({
      component: PagoMultipleFacturaComponent,
      componentProps: {
        facturas: seleccion.map((f) => this.normalizarFactura({ ...f })),
        nombreCliente: nombre,
      },
      cssClass: 'modal-pago-multiple',
    });

    modal.onDidDismiss().then((res) => {
      this.procesando = false;
      if (res.data?.actualizado) {
        this.limpiarSeleccion();
        this.cargarFacturas();
      }
    });

    await modal.present();
  }

  async verHistorial(factura: FacturaHeaderDto, event?: Event) {
    event?.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: PagoFacturaComponent,
      componentProps: { factura, modo: 'historial' },
      cssClass: 'modal-historial-factura',
    });
    await modal.present();
  }

  private async toast(message: string, color = 'dark') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'top' });
    await t.present();
  }
}
