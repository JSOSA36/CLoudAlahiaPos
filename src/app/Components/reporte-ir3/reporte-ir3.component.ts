import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Ir3Casilla, ReporteIr3 } from 'src/app/models/reporte-ir3.models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ReporteIr3Service } from 'src/app/servicios/reporte-ir3.service';
import { descargarExcel, excelFecha } from 'src/app/shared/export-excel';
import { pdfFecha, pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-reporte-ir3',
  templateUrl: './reporte-ir3.component.html',
  styleUrls: ['./reporte-ir3.component.scss'],
})
export class ReporteIr3Component implements OnInit {
  periodoMes = '';
  cargando = false;
  data: ReporteIr3 | null = null;
  seccionResumenAbierta = true;
  seccionLiqAbierta = true;
  seccionNominasAbierta = true;
  seccionAsalariadosAbierta = false;

  constructor(
    private reporteIr3: ReporteIr3Service,
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
    this.reporteIr3.obtener(this.parametro.GetIdEmpresa(), periodo).subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        this.data = null;
        const t = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo generar la liquidación IR-3',
          color: 'danger',
          duration: 2800
        });
        t.present();
      }
    });
  }

  origenClase(origen: string): string {
    switch (origen) {
      case 'AUTO_NOMINA': return 'orig-nomina';
      case 'FORMULA': return 'orig-formula';
      case 'MANUAL_PENDIENTE': return 'orig-manual';
      default: return 'orig-na';
    }
  }

  exportarExcel(): void {
    if (!this.data) {
      return;
    }
    const r = this.data;
    const rnc = (r.rncEmpresa || 'SINRNC').replace(/\D/g, '');
    const encabezado = ['#', 'Código', 'Casilla', 'Sección', 'Cantidad', 'Monto', 'Origen', 'Fórmula', 'Alertas'];
    const filasCasilla = (lista: Ir3Casilla[]) => [
      encabezado,
      ...(lista || []).map(c => [
        c.numero,
        c.codigo,
        c.etiqueta,
        c.seccion,
        c.cantidad ?? '',
        c.monto,
        c.origen,
        c.formulaAplicada || '',
        (c.alertas || []).join(' | ')
      ])
    ];

    descargarExcel(`DGII_IR3_${rnc}_${r.periodo || this.periodoAaaamm}`, [
      {
        nombre: 'Resumen',
        filas: [
          ['Declaración IR-3 — Retenciones ISR de asalariados'],
          ['Empresa', r.razonSocial || r.nombreComercial || ''],
          ['RNC', r.rncEmpresa || ''],
          ['Periodo', r.periodo],
          ['Desde', excelFecha(r.desde)],
          ['Hasta', excelFecha(r.hasta)],
          [],
          ['Indicador', 'Valor'],
          ['Nóminas', r.cantidadNominas],
          ['Asalariados', r.cantidadEmpleados],
          ['Remuneraciones', r.totalRemuneraciones],
          ['AFP empleado', r.totalAfpEmpleado],
          ['SFS empleado', r.totalSfsEmpleado],
          ['Base ISR', r.totalBaseImponible],
          ['ISR retenido', r.totalIsrRetenido],
          ['Impuesto a pagar', r.impuestoAPagar],
          ['Total a pagar', r.totalGeneralAPagar],
          [],
          ['Alertas globales'],
          ...((r.alertasGlobales || []).map(a => [a]))
        ]
      },
      { nombre: 'Liquidacion', filas: filasCasilla(r.liquidacion) },
      { nombre: 'Resumen nomina', filas: filasCasilla(r.resumen) },
      {
        nombre: 'Nominas',
        filas: [
          ['Id', 'Periodo', 'Estado', 'Frecuencia', 'Desde', 'Hasta', 'Pago', 'Empleados', 'Bruto', 'ISR'],
          ...(r.nominasIncluidas || []).map(n => [
            n.idNominaProceso,
            n.periodKey,
            n.estado,
            n.frecuencia,
            excelFecha(n.fechaInicio),
            excelFecha(n.fechaFin),
            excelFecha(n.fechaPago),
            n.empleados,
            n.totalBruto,
            n.totalIsr
          ])
        ]
      },
      {
        nombre: 'Asalariados',
        filas: [
          ['Nómina', 'Periodo', 'Estado', 'Cédula', 'Nombre', 'Salario', 'Horas extra',
            'Comisiones', 'Bonificaciones', 'Otros', 'Bruto', 'AFP', 'SFS', 'Base ISR', 'ISR'],
          ...(r.lineasAsalariados || []).map(l => [
            l.idNominaProceso,
            l.periodKey,
            l.estadoNomina,
            l.cedula || '',
            l.nombre || '',
            l.salarioBase,
            l.horasExtra,
            l.comisiones,
            l.bonificaciones,
            l.otrosIngresos,
            l.bruto,
            l.afpEmpleado,
            l.sfsEmpleado,
            l.baseImponibleIsr,
            l.isrRetenido
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
    const filasCas = (lista: Ir3Casilla[]) =>
      (lista || []).map(c => [
        String(c.numero),
        c.etiqueta,
        c.cantidad == null ? '—' : pdfNumero(c.cantidad),
        pdfNumero(c.monto),
        c.origen
      ]);

    emitirReporteTabla({
      titulo: 'Declaración IR-3 — Retenciones ISR de asalariados',
      empresa: r.razonSocial || r.nombreComercial || this.parametro.NombreEmpresa,
      subtitulo: `RNC ${r.rncEmpresa || '—'} · Periodo ${r.periodo} · ${pdfFecha(r.desde)} — ${pdfFecha(r.hasta)}`,
      landscape: true,
      kpis: [
        { label: 'Nóminas', value: String(r.cantidadNominas) },
        { label: 'Asalariados', value: String(r.cantidadEmpleados) },
        { label: 'Remuneraciones', value: pdfMoneda(r.totalRemuneraciones) },
        { label: 'ISR retenido', value: pdfMoneda(r.totalIsrRetenido) },
        { label: 'Impuesto a pagar', value: pdfMoneda(r.impuestoAPagar) },
        { label: 'Total a pagar', value: pdfMoneda(r.totalGeneralAPagar) }
      ],
      secciones: [
        {
          titulo: 'Resumen de nómina',
          columnas: [
            { header: '#', width: 28 },
            { header: 'Casilla', width: '*' },
            { header: 'Cant.', width: 40, align: 'right' },
            { header: 'Monto', width: 80, align: 'right' },
            { header: 'Origen', width: 80 }
          ],
          filas: filasCas(r.resumen)
        },
        {
          titulo: 'Liquidación IR-3',
          columnas: [
            { header: '#', width: 28 },
            { header: 'Casilla', width: '*' },
            { header: 'Cant.', width: 40, align: 'right' },
            { header: 'Monto', width: 80, align: 'right' },
            { header: 'Origen', width: 80 }
          ],
          filas: filasCas(r.liquidacion)
        },
        {
          titulo: `Asalariados (${(r.lineasAsalariados || []).length})`,
          columnas: [
            { header: 'Nómina', width: 50 },
            { header: 'Cédula', width: 80 },
            { header: 'Nombre', width: '*' },
            { header: 'Bruto', width: 70, align: 'right' },
            { header: 'Base ISR', width: 70, align: 'right' },
            { header: 'ISR', width: 70, align: 'right' }
          ],
          filas: (r.lineasAsalariados || []).map(l => [
            String(l.idNominaProceso),
            l.cedula || '—',
            l.nombre || '—',
            pdfNumero(l.bruto),
            pdfNumero(l.baseImponibleIsr),
            pdfNumero(l.isrRetenido)
          ])
        }
      ],
      nombreArchivo: `IR3_${r.periodo}.pdf`
    });
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'dark' });
    await t.present();
  }
}
