import {
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EmpresaDto } from '../models/empresadto.models';

@Component({
  selector: 'app-movimiento-inventario-print',
  templateUrl: './movimiento-inventario-print.component.html',
  styleUrls: ['./movimiento-inventario-print.component.scss'],
})
export class MovimientoInventarioPrintComponent {

  @ViewChild('movimientoPage')
  movimientoPage?: ElementRef<HTMLElement>;

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
    return (
      (this.movimiento?.tipoMovimiento || '')
        .toUpperCase() === 'ENTRADA'
    );
  }

  get esTransferencia(): boolean {
    return (
      (this.movimiento?.tipoMovimiento || '')
        .toUpperCase() === 'TRANSFERENCIA'
    );
  }

  get esSalida(): boolean {
    return (
      (this.movimiento?.tipoMovimiento || '')
        .toUpperCase() === 'SALIDA'
    );
  }

  get tituloDocumento(): string {
    if (this.esTransferencia) {
      return 'TRANSFERENCIA DE INVENTARIO';
    }

    return this.esEntrada
      ? 'ENTRADA DE INVENTARIO'
      : 'SALIDA DE INVENTARIO';
  }

  get numeroMovimiento(): string {
    const id =
      this.movimiento?.id ||
      this.movimiento?.Id ||
      0;

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
    return (
      this.movimiento?.nombreAlmacen ||
      this.movimiento?.NombreAlmacen ||
      '—'
    );
  }

  get nombreAlmacenDestino(): string {
    return (
      this.movimiento?.nombreAlmacenDestino ||
      this.movimiento?.NombreAlmacenDestino ||
      '—'
    );
  }

  nombreProducto(item: any): string {
    return (
      item?.producto ||
      item?.Producto ||
      item?.producto?.nombre ||
      'Producto'
    );
  }

  imprimir(): void {
    window.print();
  }

  async exportarPdf(): Promise<void> {
    await this.generarYDescargarPdf();
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  private async generarYDescargarPdf(): Promise<void> {
    try {
      this.exportandoPdf = true;

      const { blob, fileName } =
        await this.generarPdfBlob();

      this.descargarBlob(blob, fileName);

      await this.mostrarToast(
        'PDF exportado correctamente',
        'success'
      );
    } catch (err) {
      console.error('Error exportando PDF:', err);
      await this.mostrarToast(
        'No se pudo exportar el PDF',
        'danger'
      );
    } finally {
      this.exportandoPdf = false;
    }
  }

  private async generarPdfBlob(): Promise<{
    blob: Blob;
    fileName: string;
  }> {
    const element =
      this.movimientoPage?.nativeElement ||
      document.querySelector('.movimiento-page');

    if (!element) {
      throw new Error('No se encontró el documento para exportar');
    }

    const pageEl = element as HTMLElement;
    const ionContent = pageEl.closest('ion-content') as HTMLElement | null;

    pageEl.classList.add('pdf-capture');

    if (ionContent) {
      ionContent.scrollTop = 0;
    }

    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: pageEl.scrollWidth,
        height: pageEl.scrollHeight,
        windowWidth: pageEl.scrollWidth,
        windowHeight: pageEl.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginMm = 12;
      const contentWidth = pageWidth - marginMm * 2;
      const contentHeight = pageHeight - marginMm * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      if (imgHeight <= contentHeight) {
        pdf.addImage(
          imgData,
          'PNG',
          marginMm,
          marginMm,
          contentWidth,
          imgHeight
        );
      } else {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(
          imgData,
          'PNG',
          marginMm,
          marginMm + position,
          contentWidth,
          imgHeight
        );
        heightLeft -= contentHeight;

        while (heightLeft > 2) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(
            imgData,
            'PNG',
            marginMm,
            marginMm + position,
            contentWidth,
            imgHeight
          );
          heightLeft -= contentHeight;
        }
      }

      const tipo =
        this.esTransferencia
          ? 'Transferencia'
          : this.esEntrada
            ? 'Entrada'
            : 'Salida';

      const fileName =
        `Movimiento-${tipo}-${this.numeroMovimiento}.pdf`;

      const pdfBytes = pdf.output('arraybuffer');

      return {
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        fileName
      };
    } finally {
      pageEl.classList.remove('pdf-capture');
    }
  }

  private descargarBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
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
