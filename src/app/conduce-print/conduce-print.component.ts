import {
  Component,
  Input,
} from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { EmpresaDto } from '../models/empresadto.models';
import { ConduceDto, EstadoEntregaFacturaDto } from '../models/conduces.models';
import { descargarConducePdf } from './conduce-pdf';

@Component({
  selector: 'app-conduce-print',
  templateUrl: './conduce-print.component.html',
  styleUrls: ['./conduce-print.component.scss'],
})
export class ConducePrintComponent {
  @Input() conduce?: ConduceDto;
  @Input() estado?: EstadoEntregaFacturaDto | null;
  @Input() empresa?: EmpresaDto;
  @Input() nombreEmpresa = '';

  exportandoPdf = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  get nombreComercial(): string {
    return (
      this.empresa?.nombreComercial ||
      this.nombreEmpresa ||
      'Mi Empresa'
    );
  }

  get detalles() {
    return this.conduce?.detalles || [];
  }

  get lineasEstado() {
    return this.estado?.lineas || [];
  }

  get totalEntregadoEste(): number {
    return this.detalles.reduce(
      (s, d) => s + Number(d.cantidadEntregada || 0),
      0
    );
  }

  imprimir(): void {
    this.emitir('open');
  }

  async exportarPdf(): Promise<void> {
    this.emitir('download');
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  private emitir(modo: 'download' | 'open'): void {
    if (!this.conduce) {
      return;
    }
    try {
      this.exportandoPdf = true;
      descargarConducePdf({
        empresa: this.nombreComercial,
        direccion: this.empresa?.direccion,
        telefono: this.empresa?.telefono,
        rnc: this.empresa?.rnc,
        numero: this.conduce.numero || 'conduce',
        fecha: this.conduce.fecha as any,
        factura: this.conduce.numeroFactura || ('#' + this.conduce.idFacturaHeader),
        ncf: this.conduce.ncf,
        cliente: this.conduce.clienteNombre,
        almacen: this.conduce.almacenNombre,
        quienEntrega: this.conduce.quienEntrega,
        quienRecibe: this.conduce.quienRecibe,
        observacion: this.conduce.observacion,
        lineas: this.detalles.map(d => ({
          producto: d.productoNombre,
          entregada: Number(d.cantidadEntregada || 0),
          facturada: Number(d.cantidadFacturada || 0),
          pendiente: Number(d.cantidadPendiente || 0)
        })),
        totalEntregado: this.totalEntregadoEste,
        estado: this.estado
          ? {
              facturado: Number(this.estado.totalFacturado || 0),
              entregado: Number(this.estado.totalEntregado || 0),
              pendiente: Number(this.estado.totalPendiente || 0),
              lineas: this.lineasEstado.map(l => ({
                producto: l.productoNombre,
                facturada: Number(l.cantidadFacturada || 0),
                devuelta: Number(l.cantidadDevuelta || 0),
                entregada: Number(l.cantidadEntregada || 0),
                pendiente: Number(l.cantidadPendiente || 0)
              }))
            }
          : null,
        modo
      });
    } catch (e: any) {
      this.toastCtrl.create({
        message: e?.message || 'Error al generar PDF',
        duration: 2500,
        color: 'danger',
      }).then(t => t.present());
    } finally {
      this.exportandoPdf = false;
    }
  }
}
