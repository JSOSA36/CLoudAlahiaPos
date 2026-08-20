import {
  Component,
  Input
} from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { EmpresaDto } from '../models/empresadto.models';
import { descargarMovimientoInventarioPdf } from './movimiento-inventario-pdf';

@Component({
  selector: 'app-movimiento-inventario-print',
  templateUrl: './movimiento-inventario-print.component.html',
  styleUrls: ['./movimiento-inventario-print.component.scss'],
})
export class MovimientoInventarioPrintComponent {
  @Input() movimiento: any;
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

  get esEntrada(): boolean {
    return (this.movimiento?.tipoMovimiento || '').toUpperCase() === 'ENTRADA';
  }

  get esTransferencia(): boolean {
    return (this.movimiento?.tipoMovimiento || '').toUpperCase() === 'TRANSFERENCIA';
  }

  get esSalida(): boolean {
    return (this.movimiento?.tipoMovimiento || '').toUpperCase() === 'SALIDA';
  }

  get tituloDocumento(): string {
    if (this.esTransferencia) {
      return 'TRANSFERENCIA DE INVENTARIO';
    }
    return this.esEntrada ? 'ENTRADA DE INVENTARIO' : 'SALIDA DE INVENTARIO';
  }

  get numeroMovimiento(): string {
    const id = this.movimiento?.id || this.movimiento?.Id || 0;
    return id ? String(id).padStart(6, '0') : '—';
  }

  get detalles(): any[] {
    return this.movimiento?.detalles || [];
  }

  get totalGeneral(): number {
    return this.detalles.reduce(
      (sum: number, item: any) =>
        sum + Number(item.subTotal ?? item.SubTotal ?? 0),
      0
    );
  }

  get usuarioRegistro(): string {
    if (this.movimiento?.nombreUsuario?.trim()) {
      return this.movimiento.nombreUsuario.trim();
    }
    const usuario = this.movimiento?.usuario;
    if (typeof usuario === 'string' && usuario.trim()) {
      return usuario.trim();
    }
    if (usuario?.nombre?.trim()) {
      return usuario.nombre.trim();
    }
    if (usuario?.userName?.trim()) {
      return usuario.userName.trim();
    }
    if (this.movimiento?.Usuario?.trim()) {
      return this.movimiento.Usuario.trim();
    }
    return '—';
  }

  get nombreAlmacen(): string {
    return this.movimiento?.nombreAlmacen || this.movimiento?.NombreAlmacen || '—';
  }

  get nombreAlmacenDestino(): string {
    return this.movimiento?.nombreAlmacenDestino || this.movimiento?.NombreAlmacenDestino || '—';
  }

  nombreProducto(item: any): string {
    return item?.producto || item?.Producto || item?.producto?.nombre || 'Producto';
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
    if (!this.movimiento) {
      return;
    }
    try {
      this.exportandoPdf = true;
      descargarMovimientoInventarioPdf({
        empresa: this.nombreComercial,
        direccion: this.empresa?.direccion,
        telefono: this.empresa?.telefono,
        rnc: this.empresa?.rnc,
        notaEmpresa: this.empresa?.nota,
        titulo: this.tituloDocumento,
        numero: this.numeroMovimiento,
        fecha: this.movimiento.fecha,
        almacen: this.nombreAlmacen,
        almacenDestino: this.nombreAlmacenDestino,
        esTransferencia: this.esTransferencia,
        motivo: this.movimiento.motivo,
        referencia: this.movimiento.referencia,
        usuario: this.usuarioRegistro,
        observacion: this.movimiento.observacion,
        lineas: this.detalles.map(item => ({
          producto: this.nombreProducto(item),
          cantidad: Number(item.cantidad ?? 0),
          stockAnterior: Number(item.stockAnterior ?? 0),
          stockNuevo: Number(item.stockNuevo ?? 0),
          precio: Number(item.precio ?? 0),
          subtotal: Number(item.subTotal ?? item.SubTotal ?? 0)
        })),
        total: this.totalGeneral,
        modo
      });
      if (modo === 'download') {
        this.mostrarToast('PDF exportado correctamente', 'success');
      }
    } catch {
      this.mostrarToast('No se pudo exportar el PDF', 'danger');
    } finally {
      this.exportandoPdf = false;
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ): Promise<void> {
    (
      await this.toastCtrl.create({
        message,
        duration: 2800,
        position: 'top',
        color
      })
    ).present();
  }
}
