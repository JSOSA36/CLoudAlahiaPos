import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Ir17Casilla, ReporteIr17 } from 'src/app/models/reporte-ir17.models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ReporteIr17Service } from 'src/app/servicios/reporte-ir17.service';
import { descargarExcel, excelFecha } from 'src/app/shared/export-excel';
import { pdfFecha, pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-reporte-ir17',
  templateUrl: './reporte-ir17.component.html',
  styleUrls: ['./reporte-ir17.component.scss'],
})
export class ReporteIr17Component implements OnInit {
  periodoMes = '';
  cargando = false;
  data: ReporteIr17 | null = null;
  seccionRetencionesAbierta = true;
  seccionLiqAbierta = true;
  seccionOrigenAbierta = false;

  constructor(
    private reporteIr17: ReporteIr17Service,
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
    this.reporteIr17.obtener(this.parametro.GetIdEmpresa(), periodo).subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        this.data = null;
        const t = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo generar la liquidación IR-17',
          color: 'danger',
          duration: 2800
        });
        t.present();
      }
    });
  }

  origenClase(origen: string): string {
    switch (origen) {
      case 'AUTO_606': return 'orig-606';
      case 'FORMULA': return 'orig-formula';
      case 'MANUAL_PENDIENTE': return 'orig-manual';
      case 'R9C': return 'orig-r9c';
      case 'NO_APLICA': return 'orig-na';
      default: return 'orig-na';
    }
  }

  exportarExcel(): void {
    if (!this.data) {
      return;
    }
    const r = this.data;
    const rnc = (r.rncEmpresa || 'SINRNC').replace(/\D/g, '');
    const encabezado = [
      '#', 'Código', 'Casilla', 'Sección', 'Tasa %', 'Cantidad',
      'Base imponible', 'Impuesto', 'Origen', 'Fórmula', 'Alertas'
    ];
    const filasCasilla = (lista: Ir17Casilla[]) => [
      encabezado,
      ...(lista || []).map(c => [
        c.numero,
        c.codigo,
        c.etiqueta,
        c.seccion,
        c.tasa == null ? '' : c.tasa * 100,
        c.cantidad ?? '',
        c.montoImponible,
        c.impuesto,
        c.origen,
        c.formulaAplicada || '',
        (c.alertas || []).join(' | ')
      ])
    ];

    descargarExcel(`DGII_IR17_${rnc}_${r.periodo || this.periodoAaaamm}`, [
      {
        nombre: 'Resumen',
        filas: [
          ['Declaración IR-17 — Otras retenciones ISR'],
          ['Empresa', r.razonSocial || r.nombreComercial || ''],
          ['RNC', r.rncEmpresa || ''],
          ['Periodo', r.periodo],
          ['Desde', excelFecha(r.desde)],
          ['Hasta', excelFecha(r.hasta)],
          ['Instructivo', r.versionInstructivo],
          [],
          ['Indicador', 'Valor'],
          ['Retenciones 606', r.cantidadRetenciones],
          ['Base imponible', r.totalMontoImponible],
          ['Otras retenciones', r.totalOtrasRetenciones],
          ['Impuesto a pagar', r.impuestoAPagar],
          ['Saldo a favor', r.saldoAFavor],
          ['Total a pagar', r.totalGeneralAPagar],
          [],
          ['Alertas globales'],
          ...((r.alertasGlobales || []).map(a => [a]))
        ]
      },
      { nombre: 'Otras retenciones', filas: filasCasilla(r.otrasRetenciones) },
      { nombre: 'Liquidacion', filas: filasCasilla(r.liquidacion) },
      {
        nombre: 'Origen 606',
        filas: [
          ['FACTC', 'NCF', 'Documento', 'Tipo ISR 606', 'Casilla', 'Base', 'Impuesto', 'Fecha pago'],
          ...(r.lineasOrigen || []).map(l => [
            l.idOrdenCompraHeader,
            l.ncf || '',
            l.numeroDocumento || '',
            l.tipoRetencionIsr ?? '',
            l.casilla,
            l.montoImponible,
            l.impuesto,
            excelFecha(l.fechaPagoFiscal)
          ])
        ]
      }
    ]);
  }

  exportarPdf(): void {
    if (!this.data) {
      return;
    }
    const r = this.data;
    const filasRet = (lista: Ir17Casilla[]) =>
      (lista || []).map(c => [
        String(c.numero),
        c.etiqueta,
        c.tasa == null ? '—' : `${(c.tasa * 100).toFixed(2)}%`,
        c.cantidad == null ? '—' : pdfNumero(c.cantidad),
        pdfNumero(c.montoImponible),
        pdfNumero(c.impuesto),
        c.origen
      ]);

    emitirReporteTabla({
      titulo: 'Declaración IR-17 — Otras retenciones y retribuciones complementarias',
      empresa: r.razonSocial || r.nombreComercial || this.parametro.NombreEmpresa,
      subtitulo: `RNC ${r.rncEmpresa || '—'} · Periodo ${r.periodo} · ${pdfFecha(r.desde)} — ${pdfFecha(r.hasta)} · ${r.versionInstructivo}`,
      landscape: true,
      kpis: [
        { label: 'Retenciones 606', value: String(r.cantidadRetenciones) },
        { label: 'Base imponible', value: pdfMoneda(r.totalMontoImponible) },
        { label: 'Otras retenciones', value: pdfMoneda(r.totalOtrasRetenciones) },
        { label: 'Impuesto a pagar', value: pdfMoneda(r.impuestoAPagar) },
        { label: 'Saldo a favor', value: pdfMoneda(r.saldoAFavor) },
        { label: 'Total a pagar', value: pdfMoneda(r.totalGeneralAPagar) }
      ],
      secciones: [
        {
          titulo: 'Otras retenciones (1–27)',
          columnas: [
            { header: '#', width: 28 },
            { header: 'Casilla', width: '*' },
            { header: 'Tasa', width: 45, align: 'right' },
            { header: 'Cant.', width: 40, align: 'right' },
            { header: 'Base', width: 70, align: 'right' },
            { header: 'Impuesto', width: 70, align: 'right' },
            { header: 'Origen', width: 70 }
          ],
          filas: filasRet(r.otrasRetenciones)
        },
        {
          titulo: 'Liquidación (28–37)',
          columnas: [
            { header: '#', width: 28 },
            { header: 'Casilla', width: '*' },
            { header: 'Tasa', width: 45, align: 'right' },
            { header: 'Cant.', width: 40, align: 'right' },
            { header: 'Base', width: 70, align: 'right' },
            { header: 'Impuesto', width: 70, align: 'right' },
            { header: 'Origen', width: 70 }
          ],
          filas: filasRet(r.liquidacion)
        }
      ],
      nombreArchivo: `IR17_${r.periodo}.pdf`
    });
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'dark' });
    await t.present();
  }
}
