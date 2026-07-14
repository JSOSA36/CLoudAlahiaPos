import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { FacturaCompra } from 'src/app/models/compras.models';
import { ESTADOS_DOCUMENTO_COMPRA } from '../shared/compras-documento.config';
import { HistorialPagosProveedorComponent } from 'src/app/Modales/historial-pagos-proveedor/historial-pagos-proveedor.component';
import { PagoProveedorModalComponent } from 'src/app/Modales/pago-proveedor/pago-proveedor-modal.component';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-cxp-proveedores',
  templateUrl: './cxp-proveedores.component.html',
  styleUrls: ['./cxp-proveedores.component.scss'],
})
export class CxpProveedoresComponent implements OnInit {
  facturas: FacturaCompra[] = [];
  filtro = '';
  cargando = false;
  procesando = false;

  private readonly estados = ESTADOS_DOCUMENTO_COMPRA;

  constructor(
    private comprasService: ComprasService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ionViewWillEnter() {
    this.cargar();
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.comprasService.pendientes(this.parametro.GetIdEmpresa()).subscribe({
      next: (data) => {
        this.facturas = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: () => {
        this.cargando = false;
        event?.target?.complete?.();
        this.toast('Error cargando CxP');
      }
    });
  }

  get filtradas(): FacturaCompra[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) {
      return this.facturas;
    }
    return this.facturas.filter(f =>
      [f.numeroDocumento, f.proveedorNombre, f.estado, f.numeroComprobanteProveedor]
        .some(v => (v || '').toLowerCase().includes(q))
    );
  }

  get totalPendiente(): number {
    return this.filtradas.reduce((s, f) => s + Number(f.pendiente || 0), 0);
  }

  get totalDocumentos(): number {
    return this.filtradas.length;
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
    return map[codigo] || 'estado-confirmada';
  }

  esCredito(f: FacturaCompra): boolean {
    return (f.condicionFactura || '').toLowerCase() === 'credito';
  }

  async registrarPago(f: FacturaCompra, event?: Event) {
    event?.stopPropagation();
    this.procesando = true;
    const modal = await this.modalCtrl.create({
      component: PagoProveedorModalComponent,
      cssClass: 'modal-gasto',
      componentProps: { factura: { ...f } }
    });

    modal.onDidDismiss().then(res => {
      this.procesando = false;
      if (res.data?.ok) {
        this.cargar();
      }
    });

    await modal.present();
  }

  async verHistorial(f: FacturaCompra, event?: Event) {
    event?.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: HistorialPagosProveedorComponent,
      cssClass: 'modal-gasto',
      componentProps: { factura: { ...f } }
    });
    await modal.present();
  }

  irEstadoCuenta() {
    this.router.navigate(['/compras/cxp/estado-cuenta']);
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, position: 'top' });
    await t.present();
  }
}
