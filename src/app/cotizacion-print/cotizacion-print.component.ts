import {
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EmpresaDto } from '../models/empresadto.models';
import { FacturaHeaderService } from '../servicios/factura-header.service';
import { ParametrosService } from '../servicios/parametros.service';
@Component({
  selector: 'app-cotizacion-print',
  templateUrl: './cotizacion-print.component.html',
  styleUrls: ['./cotizacion-print.component.scss'],
})
export class CotizacionPrintComponent implements OnInit {

  @ViewChild('cotizacionPage')
  cotizacionPage?: ElementRef<HTMLElement>;

  @Input() cotizacion: any;
  @Input() empresa?: EmpresaDto;
  @Input() nombreEmpresa = '';

  fechaValidez = new Date();
  exportandoPdf = false;
  compartiendo = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private facturaHeader: FacturaHeaderService,
    private parametros: ParametrosService
  ) {}
  ngOnInit(): void {
    const base =
      this.cotizacion?.fechaInseccion
        ? new Date(this.cotizacion.fechaInseccion)
        : new Date();

    this.fechaValidez = new Date(base);
    this.fechaValidez.setDate(this.fechaValidez.getDate() + 15);
  }

  get nombreComercial(): string {
    return (
      this.empresa?.nombreComercial ||
      this.nombreEmpresa ||
      'Mi Empresa'
    );
  }

  /** Solo si la empresa tiene logo propio (ruta/URL real). */
  get mostrarLogo(): boolean {
    const url = (this.empresa?.logoUrl || this.empresa?.logo || '').trim();
    return !!url && !/assets\/logo\.png/i.test(url);
  }

  get numeroDocumento(): string {
    const num =
      this.cotizacion?.numeroDocumento ||
      this.cotizacion?.NumeroDocumento ||
      '';

    if (num.trim()) {
      return num.trim();
    }

    if (this.cotizacion?.idFacturaHeader) {
      return String(this.cotizacion.idFacturaHeader);
    }

    return '—';
  }

  private get detalles(): any[] {
    return this.cotizacion?.facturaDetalles || [];
  }

  get subtotal(): number {
    const desdeLineas = this.detalles.reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.precioOferta ?? item.PrecioOferta ?? 0) *
        Number(item.cantidad ?? item.Cantidad ?? 0),
      0
    );

    if (desdeLineas > 0) {
      return desdeLineas;
    }

    return Number(
      this.cotizacion?.subTotal ??
      this.cotizacion?.SubTotal ??
      0
    );
  }

  get itbis(): number {
    return Number(
      this.cotizacion?.totalItbis ??
      this.cotizacion?.TotalItbis ??
      0
    );
  }

  get descuento(): number {
    const headerDesc = Number(
      this.cotizacion?.totalDescuento ??
      this.cotizacion?.TotalDescuento ??
      0
    );

    if (headerDesc > 0.009) {
      return headerDesc;
    }

    const lineasDesc = this.detalles.reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.descuento ?? item.Descuento ?? 0) *
        Number(item.cantidad ?? item.Cantidad ?? 0),
      0
    );

    if (lineasDesc > 0.009) {
      return lineasDesc;
    }

    const bruto = this.subtotal + this.itbis;
    const neto = Number(
      this.cotizacion?.total ??
      this.cotizacion?.Total ??
      0
    );

    if (neto > 0 && bruto - neto > 0.009) {
      return +(bruto - neto).toFixed(2);
    }

    return 0;
  }

  get mostrarDescuento(): boolean {
    return this.descuento > 0.009;
  }

  get total(): number {
    const stored = Number(
      this.cotizacion?.total ??
      this.cotizacion?.Total ??
      0
    );

    if (stored > 0) {
      return stored;
    }

    return +(this.subtotal + this.itbis - this.descuento).toFixed(2);
  }

  nombreProducto(item: any): string {
    return (
      item?.productos?.nombre ||
      item?.productos?.descripcion ||
      'Producto'
    );
  }

  imprimir(): void {
    window.print();
  }

  async exportarPdf(): Promise<void> {
    await this.generarYDescargarPdf();
  }

  async copiarLink(): Promise<void> {
    try {
      this.compartiendo = true;
      const link = await this.obtenerLinkPublico();
      if (!link) return;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        await this.mostrarToast(
          'Link copiado. Péguelo al cliente en WhatsApp o correo.',
          'success'
        );
      } else {
        await this.mostrarToast(link, 'warning');
      }
    } catch (err) {
      console.error(err);
      await this.mostrarToast(
        'No se pudo generar el link de la cotización',
        'danger'
      );
    } finally {
      this.compartiendo = false;
    }
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  private async obtenerLinkPublico(): Promise<string | null> {
    const idFactura = Number(
      this.cotizacion?.idFacturaHeader ||
        this.cotizacion?.IdFacturaHeader ||
        0
    );
    const idEmpresa = Number(
      this.cotizacion?.idEmpresa ||
        this.cotizacion?.IdEmpresa ||
        this.parametros.IdEmpresa ||
        0
    );

    if (idFactura <= 0) {
      await this.mostrarToast(
        'Guarde la cotización antes de compartir el link.',
        'warning'
      );
      return null;
    }

    if (idEmpresa <= 0) {
      await this.mostrarToast(
        'No se pudo identificar la empresa para compartir.',
        'danger'
      );
      return null;
    }

    const res = await firstValueFrom(
      this.facturaHeader.crearLinkCotizacionPublica(idFactura, idEmpresa)
    );

    if (!res?.token) {
      await this.mostrarToast(
        'No se pudo generar el link de la cotización.',
        'danger'
      );
      return null;
    }

    return this.facturaHeader.buildLinkCotizacionPublica(res);
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
      this.cotizacionPage?.nativeElement ||
      document.querySelector('.cotizacion-page');

    if (!element) {
      throw new Error('No se encontró la cotización para exportar');
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

      const fileName =
        `Cotizacion-${this.numeroDocumento.replace(/[^\w.-]+/g, '_')}.pdf`;

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