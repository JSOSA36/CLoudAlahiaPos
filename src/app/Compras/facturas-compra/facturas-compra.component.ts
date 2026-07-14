import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { FacturaCompra } from 'src/app/models/compras.models';
import { ESTADOS_DOCUMENTO_COMPRA } from '../shared/compras-documento.config';
import { HistorialPagosProveedorComponent } from 'src/app/Modales/historial-pagos-proveedor/historial-pagos-proveedor.component';
import { PagoProveedorModalComponent } from 'src/app/Modales/pago-proveedor/pago-proveedor-modal.component';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

type FiltroEstado = 'TODAS' | 'BORRADOR' | 'CONFIRMADA' | 'PENDIENTE' | 'PAGADA' | 'ANULADA';

@Component({
  selector: 'app-facturas-compra',
  templateUrl: './facturas-compra.component.html',
  styleUrls: ['./facturas-compra.component.scss'],
})
export class FacturasCompraComponent implements OnInit {
  facturas: FacturaCompra[] = [];
  filtro = '';
  filtroEstado: FiltroEstado = 'TODAS';
  cargando = false;
  procesandoPago = false;

  readonly chips: { codigo: FiltroEstado; etiqueta: string }[] = [
    { codigo: 'TODAS', etiqueta: 'Todas' },
    { codigo: 'BORRADOR', etiqueta: 'Borradores' },
    { codigo: 'CONFIRMADA', etiqueta: 'Confirmadas' },
    { codigo: 'PENDIENTE', etiqueta: 'Por pagar' },
    { codigo: 'PAGADA', etiqueta: 'Pagadas' },
    { codigo: 'ANULADA', etiqueta: 'Anuladas' }
  ];

  private readonly estados = ESTADOS_DOCUMENTO_COMPRA;

  constructor(
    private comprasService: ComprasService,
    private parametro: ParametrosService,
    private router: Router,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ionViewWillEnter() {
    this.cargar();
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.comprasService.listar(this.parametro.GetIdEmpresa()).subscribe({
      next: (data) => {
        this.facturas = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: () => {
        this.cargando = false;
        event?.target?.complete?.();
        this.toast('Error cargando facturas de compra');
      }
    });
  }

  get filtradas(): FacturaCompra[] {
    const q = this.filtro.trim().toLowerCase();
    return this.facturas.filter(f => {
      if (!this.coincideEstado(f)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [
        f.numeroDocumento,
        f.proveedorNombre,
        f.estado,
        f.numeroComprobanteProveedor,
        f.condicionFactura
      ].some(v => (v || '').toLowerCase().includes(q));
    });
  }

  get totalPendiente(): number {
    return this.filtradas
      .filter(f => f.estado !== 'ANULADA' && f.estado !== 'BORRADOR')
      .reduce((s, f) => s + Number(f.pendiente || 0), 0);
  }

  get totalDocumentos(): number {
    return this.filtradas.length;
  }

  get cantidadBorradores(): number {
    return this.facturas.filter(f => f.estado === 'BORRADOR').length;
  }

  private coincideEstado(f: FacturaCompra): boolean {
    switch (this.filtroEstado) {
      case 'TODAS':
        return true;
      case 'PENDIENTE':
        return Number(f.pendiente || 0) > 0
          && f.estado !== 'BORRADOR'
          && f.estado !== 'ANULADA';
      case 'CONFIRMADA':
        return f.estado === 'CONFIRMADA' || f.estado === 'PARCIALMENTE_PAGADA';
      default:
        return f.estado === this.filtroEstado;
    }
  }

  etiquetaEstado(codigo: string): string {
    return this.estados.find(e => e.codigo === codigo)?.etiqueta ?? codigo;
  }

  claseEstado(codigo: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'estado-borrador',
      CONFIRMADA: 'estado-confirmada',
      PARCIALMENTE_PAGADA: 'estado-parcial',
      PAGADA: 'estado-pagada',
      ANULADA: 'estado-anulada'
    };
    return map[codigo] || 'estado-borrador';
  }

  muestraRecepcion(f: FacturaCompra): boolean {
    const er = f.estadoRecepcion;
    return !!er
      && er !== 'NO_APLICA'
      && f.estado !== 'BORRADOR'
      && f.estado !== 'ANULADA';
  }

  etiquetaRecepcion(codigo?: string): string {
    const map: Record<string, string> = {
      PENDIENTE_RECEPCION: 'Pend. recepción',
      PARCIALMENTE_RECIBIDA: 'Rec. parcial',
      RECIBIDA: 'Recibida'
    };
    return map[codigo || ''] || (codigo || '');
  }

  claseRecepcion(codigo?: string): string {
    const map: Record<string, string> = {
      PENDIENTE_RECEPCION: 'rec-pendiente',
      PARCIALMENTE_RECIBIDA: 'rec-parcial',
      RECIBIDA: 'rec-ok'
    };
    return map[codigo || ''] || 'rec-pendiente';
  }

  tituloDocumento(f: FacturaCompra): string {
    return f.numeroDocumento || `Borrador #${f.idOrdenCompraHeader}`;
  }

  esCredito(f: FacturaCompra): boolean {
    return (f.condicionFactura || '').toLowerCase() === 'credito';
  }

  sePuedePagar(f: FacturaCompra): boolean {
    return Number(f.pendiente || 0) > 0
      && f.estado !== 'BORRADOR'
      && f.estado !== 'ANULADA';
  }

  nueva() {
    this.router.navigate(['/compras/nueva']);
  }

  abrir(f: FacturaCompra) {
    this.router.navigate(['/compras', f.idOrdenCompraHeader]);
  }

  async registrarPago(f: FacturaCompra, event: Event) {
    event.stopPropagation();

    if (!this.sePuedePagar(f)) {
      this.toast('Esta factura no tiene saldo pendiente');
      return;
    }

    this.procesandoPago = true;
    const modal = await this.modalCtrl.create({
      component: PagoProveedorModalComponent,
      cssClass: 'modal-gasto',
      componentProps: { factura: { ...f } }
    });

    modal.onDidDismiss().then(res => {
      this.procesandoPago = false;
      if (res.data?.ok) {
        this.cargar();
      }
    });

    await modal.present();
  }

  async verHistorial(f: FacturaCompra, event: Event) {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: HistorialPagosProveedorComponent,
      cssClass: 'modal-gasto',
      componentProps: { factura: { ...f } }
    });
    await modal.present();
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2200, position: 'top' });
    await t.present();
  }
}
