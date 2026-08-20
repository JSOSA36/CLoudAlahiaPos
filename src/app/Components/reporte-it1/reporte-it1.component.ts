import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { It1Casilla, ReporteIt1 } from 'src/app/models/reporte-it1.models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ReporteIt1Service } from 'src/app/servicios/reporte-it1.service';
import { pdfFecha, pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-reporte-it1',
  templateUrl: './reporte-it1.component.html',
  styleUrls: ['./reporte-it1.component.scss'],
})
export class ReporteIt1Component implements OnInit {
  periodoMes = '';
  cargando = false;
  data: ReporteIt1 | null = null;
  seccionAnexoAbierta = true;
  seccionIt1Abierta = true;

  constructor(
    private reporteIt1: ReporteIt1Service,
    public parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.periodoMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    this.cargar();
  }

  get periodoAaaamm(): string {
    return (this.periodoMes || '').replace('-', '');
  }

  cargar(): void {
    const periodo = this.periodoAaaamm;
    if (!periodo || periodo.length !== 6) {
      this.toast('Indique un periodo válido (mes/año)');
      return;
    }

    this.cargando = true;
    this.reporteIt1.obtener(this.parametro.GetIdEmpresa(), periodo).subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        this.data = null;
        const t = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo generar la liquidación IT-1',
          color: 'danger',
          duration: 2800
        });
        t.present();
      }
    });
  }

  casillasConColumna(lista: It1Casilla[] | undefined): boolean {
    return (lista || []).some(c =>
      c.montoLocal != null || c.montoServicios != null || c.montoImportaciones != null);
  }

  origenClase(origen: string): string {
    switch (origen) {
      case 'AUTO_607': return 'orig-607';
      case 'AUTO_606': return 'orig-606';
      case 'FORMULA': return 'orig-formula';
      case 'MANUAL_PENDIENTE': return 'orig-manual';
      case 'NO_APLICA': return 'orig-na';
      default: return 'orig-otro';
    }
  }

  exportarCsv(): void {
    if (!this.data?.contenidoCsv) {
      return;
    }
    const rnc = (this.data.rncEmpresa || 'SINRNC').replace(/\D/g, '');
    const periodo = this.data.periodo || this.periodoAaaamm || '000000';
    const blob = new Blob([this.data.contenidoCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DGII_IT1_${rnc}_${periodo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportarPdf(): void {
    if (!this.data) {
      return;
    }
    const r = this.data;
    const filasCasilla = (lista: It1Casilla[]) =>
      (lista || []).map(c => [
        String(c.numero),
        c.etiqueta,
        c.cantidad == null ? '—' : pdfNumero(c.cantidad),
        pdfNumero(c.monto),
        c.origen,
        (c.alertas || []).join(' · ') || '—'
      ]);

    emitirReporteTabla({
      titulo: 'Declaración IT-1 — Liquidación ITBIS',
      empresa: r.razonSocial || r.nombreComercial || this.parametro.NombreEmpresa,
      subtitulo: `RNC ${r.rncEmpresa || '—'} · Periodo ${r.periodo} · ${pdfFecha(r.desde)} — ${pdfFecha(r.hasta)}`,
      landscape: true,
      kpis: [
        { label: 'Ops. periodo', value: pdfMoneda(r.totalOperacionesPeriodo) },
        { label: 'ITBIS cobrado', value: pdfMoneda(r.totalItbisCobrado) },
        { label: 'ITBIS deducible', value: pdfMoneda(r.totalItbisDeducible) },
        { label: 'Impuesto a pagar', value: pdfMoneda(r.impuestoAPagar) },
        { label: 'Saldo a favor', value: pdfMoneda(r.saldoAFavor) },
        { label: 'Total general', value: pdfMoneda(r.totalGeneralAPagar) }
      ],
      secciones: [
        {
          titulo: 'Anexo A',
          columnas: [
            { header: '#', width: 28 },
            { header: 'Casilla', width: '*' },
            { header: 'Cant.', width: 45, align: 'right' },
            { header: 'Monto', width: 70, align: 'right' },
            { header: 'Origen', width: 70 },
            { header: 'Alertas', width: 90 }
          ],
          filas: filasCasilla(r.anexoA)
        },
        {
          titulo: 'IT-1',
          columnas: [
            { header: '#', width: 28 },
            { header: 'Casilla', width: '*' },
            { header: 'Cant.', width: 45, align: 'right' },
            { header: 'Monto', width: 70, align: 'right' },
            { header: 'Origen', width: 70 },
            { header: 'Alertas', width: 90 }
          ],
          filas: filasCasilla(r.it1)
        }
      ],
      nombreArchivo: `IT1_${r.periodo}.pdf`
    });
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'dark' });
    await t.present();
  }
}
