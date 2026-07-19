import {
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EmpresaDto } from '../models/empresadto.models';
import { ConduceDto, EstadoEntregaFacturaDto } from '../models/conduces.models';

@Component({
  selector: 'app-conduce-print',
  templateUrl: './conduce-print.component.html',
  styleUrls: ['./conduce-print.component.scss'],
})
export class ConducePrintComponent {
  @ViewChild('conducePage') conducePage?: ElementRef<HTMLElement>;

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
      const el = this.conducePage?.nativeElement;
      if (!el) throw new Error('No se pudo capturar el documento');

      el.classList.add('pdf-capture');
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      el.classList.remove('pdf-capture');

      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;

      pdf.addImage(img, 'PNG', 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }

      const num = this.conduce?.numero || 'conduce';
      pdf.save(`${num}.pdf`);
    } catch (e: any) {
      const t = await this.toastCtrl.create({
        message: e?.message || 'Error al generar PDF',
        duration: 2500,
        color: 'danger',
      });
      await t.present();
    } finally {
      this.exportandoPdf = false;
      this.conducePage?.nativeElement?.classList.remove('pdf-capture');
    }
  }
}
