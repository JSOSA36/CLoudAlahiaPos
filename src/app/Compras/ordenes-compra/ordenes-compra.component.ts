import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { FacturaCompra } from 'src/app/models/compras.models';
import { ESTADOS_ORDEN_COMPRA } from '../shared/compras-documento.config';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

type FiltroEstado = 'TODAS' | 'BORRADOR' | 'EMITIDA' | 'ENVIADA' | 'FACTURADA' | 'ANULADA';

@Component({
  selector: 'app-ordenes-compra',
  templateUrl: './ordenes-compra.component.html',
  styleUrls: ['../facturas-compra/facturas-compra.component.scss'],
})
export class OrdenesCompraComponent implements OnInit {
  ordenes: FacturaCompra[] = [];
  filtro = '';
  filtroEstado: FiltroEstado = 'TODAS';
  cargando = false;

  readonly chips: { codigo: FiltroEstado; etiqueta: string }[] = [
    { codigo: 'TODAS', etiqueta: 'Todas' },
    { codigo: 'BORRADOR', etiqueta: 'Borradores' },
    { codigo: 'EMITIDA', etiqueta: 'Emitidas' },
    { codigo: 'ENVIADA', etiqueta: 'Enviadas' },
    { codigo: 'FACTURADA', etiqueta: 'Facturadas' },
    { codigo: 'ANULADA', etiqueta: 'Anuladas' }
  ];

  private readonly estados = ESTADOS_ORDEN_COMPRA;

  constructor(
    private comprasService: ComprasService,
    private parametro: ParametrosService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ionViewWillEnter() {
    this.cargar();
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.comprasService.listarOrdenes(this.parametro.GetIdEmpresa()).subscribe({
      next: (data) => {
        this.ordenes = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: () => {
        this.cargando = false;
        event?.target?.complete?.();
        this.toast('Error cargando órdenes de compra');
      }
    });
  }

  get filtradas(): FacturaCompra[] {
    const q = this.filtro.trim().toLowerCase();
    return this.ordenes.filter(f => {
      if (this.filtroEstado !== 'TODAS' && f.estado !== this.filtroEstado) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [
        f.numeroDocumento,
        f.proveedorNombre,
        f.estado,
        String(f.idOrdenCompraHeader)
      ].some(v => (v || '').toLowerCase().includes(q));
    });
  }

  get totalDocumentos(): number {
    return this.filtradas.length;
  }

  get cantidadBorradores(): number {
    return this.ordenes.filter(o => o.estado === 'BORRADOR').length;
  }

  etiquetaEstado(codigo: string): string {
    return this.estados.find(e => e.codigo === codigo)?.etiqueta ?? codigo;
  }

  claseEstado(codigo: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'estado-borrador',
      EMITIDA: 'estado-confirmada',
      ENVIADA: 'estado-parcial',
      FACTURADA: 'estado-pagada',
      ANULADA: 'estado-anulada'
    };
    return map[codigo] || 'estado-borrador';
  }

  tituloDocumento(f: FacturaCompra): string {
    return f.numeroDocumento || `Borrador #${f.idOrdenCompraHeader}`;
  }

  nueva() {
    this.router.navigate(['/compras/ordenes/nueva']);
  }

  abrir(f: FacturaCompra) {
    this.router.navigate(['/compras/ordenes', f.idOrdenCompraHeader]);
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'dark' });
    await t.present();
  }
}
