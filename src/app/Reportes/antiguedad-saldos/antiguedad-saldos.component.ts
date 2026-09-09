import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ProveedoresService } from 'src/app/servicios/proveedores.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AntiguedadSaldosService } from 'src/app/servicios/antiguedad-saldos.service';
import {
  AntiguedadModo,
  AntiguedadSaldosIndicadores,
  AntiguedadSaldosReporte,
} from 'src/app/models/antiguedad-saldos.models';
import { clientes } from 'src/app/models/clientes';
import { Proveedor } from 'src/app/models/proveedores';
import { pdfFecha, pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

Chart.register(...registerables);

const COLOR_RANGOS = {
  '0-30': '#2e7d32',
  '31-60': '#f9a825',
  '61-90': '#ef6c00',
  '>90': '#c62828',
};

@Component({
  selector: 'app-antiguedad-saldos',
  templateUrl: './antiguedad-saldos.component.html',
  styleUrls: ['./antiguedad-saldos.component.scss'],
})
export class AntiguedadSaldosComponent implements OnInit, OnDestroy {
  modo: AntiguedadModo = 'cxc';
  cargando = false;
  exportando = false;
  data: AntiguedadSaldosReporte | null = null;

  idTercero = 0;
  documento = '';
  fechaDesde = '';
  fechaHasta = '';
  fechaCorte = '';
  soloVencidas = false;
  soloPendientes = true;
  idSucursalFiltro = 0;

  clientes: clientes[] = [];
  proveedores: Proveedor[] = [];

  private chartDist: Chart | null = null;
  private chartTop: Chart | null = null;

  constructor(
    private route: ActivatedRoute,
    private servicio: AntiguedadSaldosService,
    private clientesSrv: ClienteService,
    private proveedoresSrv: ProveedoresService,
    public parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.modo = (this.route.snapshot.data['modo'] as AntiguedadModo) || 'cxc';
    this.fechaCorte = new Date().toISOString().substring(0, 10);
    this.cargarCatalogo();
    this.consultar();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  get titulo(): string {
    return this.modo === 'cxc'
      ? 'Antigüedad de Saldos — Cuentas por Cobrar'
      : 'Antigüedad de Saldos — Cuentas por Pagar';
  }

  get etiquetaTercero(): string {
    return this.modo === 'cxc' ? 'Cliente' : 'Proveedor';
  }

  get etiquetaTerceros(): string {
    return this.modo === 'cxc' ? 'Clientes' : 'Proveedores';
  }

  get tituloTop(): string {
    return this.modo === 'cxc'
      ? 'Top clientes con mayor deuda'
      : 'Top proveedores con mayor saldo';
  }

  get nombreEmpresa(): string {
    return this.data?.nombreEmpresa || 'Empresa';
  }

  get totales() {
    return (
      this.data?.totales || {
        totalPendiente: 0,
        total0a30: 0,
        total31a60: 0,
        total61a90: 0,
        totalMas90: 0,
        cantidadDocumentos: 0,
        cantidadTerceros: 0,
      }
    );
  }

  get ind(): AntiguedadSaldosIndicadores {
    return (
      this.data?.indicadores || {
        totalTerceros: 0,
        promedioPorTercero: 0,
        saldoPromedioDocumento: 0,
        mayorDeuda: 0,
        terceroMayorDeuda: '—',
        promedioDiasVencidos: 0,
      }
    );
  }

  cargarCatalogo(): void {
    const idEmpresa = this.parametros.GetIdEmpresa();
    if (this.modo === 'cxc') {
      this.clientesSrv.GetListadoClientes(idEmpresa).subscribe({
        next: (res) => (this.clientes = res || []),
      });
    } else {
      this.proveedoresSrv.listar(idEmpresa, true).subscribe({
        next: (res) => (this.proveedores = res || []),
      });
    }
  }

  onFiltroSucursal(id: number): void {
    const next = Number(id) || 0;
    if (next === this.idSucursalFiltro) return;
    this.idSucursalFiltro = next;
    this.consultar();
  }

  consultar(): void {
    this.cargando = true;
    const idEmpresa = this.parametros.GetIdEmpresa();
    const filtro = {
      idTercero: this.idTercero || 0,
      documento: this.documento,
      fechaDesde: this.fechaDesde || undefined,
      fechaHasta: this.fechaHasta || undefined,
      fechaCorte: this.fechaCorte || undefined,
      soloVencidas: this.soloVencidas,
      soloPendientes: this.soloPendientes,
      idSucursalFiltro: this.idSucursalFiltro,
    };

    const req =
      this.modo === 'cxc'
        ? this.servicio.cxc(idEmpresa, filtro)
        : this.servicio.cxp(idEmpresa, filtro);

    req.subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
        setTimeout(() => this.renderCharts(), 50);
      },
      error: async (err) => {
        this.cargando = false;
        this.data = null;
        this.destroyCharts();
        const t = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo generar el reporte',
          color: 'danger',
          duration: 2500,
        });
        t.present();
      },
    });
  }

  limpiarFiltros(): void {
    this.idTercero = 0;
    this.documento = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.fechaCorte = new Date().toISOString().substring(0, 10);
    this.soloVencidas = false;
    this.soloPendientes = true;
    this.idSucursalFiltro = 0;
    this.consultar();
  }

  etiquetaRango(l: { rangoEtiqueta?: string; rangoCodigo?: string }): string {
    if (l.rangoEtiqueta) return l.rangoEtiqueta;
    switch (l.rangoCodigo) {
      case '0-30':
        return '0-30 días';
      case '31-60':
        return '31-60 días';
      case '61-90':
        return '61-90 días';
      default:
        return 'Más de 90 días';
    }
  }

  tonoRango(codigo: string): string {
    switch (codigo) {
      case '0-30':
        return 'ok';
      case '31-60':
        return 'warn';
      case '61-90':
        return 'risk';
      default:
        return 'crit';
    }
  }

  imprimir(): void {
    this.emitirPdf('open');
  }

  exportarExcel(): void {
    if (!this.data?.lineas?.length) {
      this.toast('No hay datos para exportar', 'warning');
      return;
    }

    const sep = ';';
    const headers = [
      this.etiquetaTercero,
      'Documento',
      'Fecha factura',
      'Fecha vencimiento',
      'Días vencidos',
      'Rango',
      'Saldo pendiente',
      '0-30',
      '31-60',
      '61-90',
      'Mas de 90',
    ];

    const rows = this.data.lineas.map((l) => [
      this.csv(l.terceroNombre),
      this.csv(l.documento),
      this.fmtFecha(l.fechaDocumento),
      this.fmtFecha(l.fechaVencimiento),
      String(l.diasVencidos ?? 0),
      this.csv(this.etiquetaRango(l)),
      this.num(l.saldoPendiente),
      this.num(l.rango0a30),
      this.num(l.rango31a60),
      this.num(l.rango61a90),
      this.num(l.rangoMas90),
    ]);

    const resumen = [
      [],
      ['Indicadores'],
      [`Total ${this.etiquetaTerceros}`, String(this.ind.totalTerceros)],
      ['Promedio por ' + this.etiquetaTercero.toLowerCase(), this.num(this.ind.promedioPorTercero)],
      ['Saldo promedio documento', this.num(this.ind.saldoPromedioDocumento)],
      ['Mayor deuda', this.num(this.ind.mayorDeuda)],
      [
        `${this.etiquetaTercero} con mayor deuda`,
        this.csv(this.ind.terceroMayorDeuda || ''),
      ],
      ['Promedio días vencidos', this.num(this.ind.promedioDiasVencidos)],
      ['Total pendiente', this.num(this.totales.totalPendiente)],
    ];

    const lines = [
      [this.csv(this.titulo)],
      [this.csv(this.nombreEmpresa)],
      [`Corte`, this.fmtFecha(this.data.fechaCorte)],
      [],
      headers.map((h) => this.csv(h)).join(sep),
      ...rows.map((r) => r.join(sep)),
      ...resumen.map((r) => r.map((c) => this.csv(String(c))).join(sep)),
    ];

    const blob = new Blob(['\ufeff' + lines.join('\r\n')], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    this.downloadBlob(blob, `Antiguedad_${this.modo.toUpperCase()}_${this.fechaCorte}.xls`);
  }

  async exportarPdf(): Promise<void> {
    this.emitirPdf('download');
  }

  private emitirPdf(modo: 'download' | 'open'): void {
    if (!this.data?.lineas?.length) {
      this.toast('No hay datos para exportar', 'warning');
      return;
    }

    this.exportando = true;
    try {
      emitirReporteTabla({
        titulo: this.titulo,
        empresa: this.nombreEmpresa,
        subtitulo: `Corte ${this.fmtFecha(this.data.fechaCorte)}`,
        landscape: true,
        kpis: [
          { label: 'Total pendiente', value: pdfMoneda(this.totales.totalPendiente) },
          { label: this.etiquetaTerceros, value: String(this.ind.totalTerceros) },
          { label: 'Documentos', value: String(this.totales.cantidadDocumentos) },
          { label: 'Mayor deuda', value: `${pdfMoneda(this.ind.mayorDeuda)} · ${this.ind.terceroMayorDeuda || '—'}` }
        ],
        secciones: [{
          columnas: [
            { header: this.etiquetaTercero, width: 110 },
            { header: 'Documento', width: 70 },
            { header: 'Fecha', width: 58 },
            { header: 'Vence', width: 58 },
            { header: 'Días', width: 32, align: 'right' },
            { header: 'Rango', width: 70 },
            { header: 'Saldo', width: 70, align: 'right' },
            { header: '0-30', width: 58, align: 'right' },
            { header: '31-60', width: 58, align: 'right' },
            { header: '61-90', width: 58, align: 'right' },
            { header: '>90', width: '*', align: 'right' }
          ],
          filas: this.data.lineas.map(l => [
            l.terceroNombre,
            l.documento,
            this.fmtFecha(l.fechaDocumento),
            this.fmtFecha(l.fechaVencimiento),
            l.diasVencidos ?? 0,
            this.etiquetaRango(l),
            pdfMoneda(l.saldoPendiente),
            pdfNumero(l.rango0a30),
            pdfNumero(l.rango31a60),
            pdfNumero(l.rango61a90),
            pdfNumero(l.rangoMas90)
          ]),
          filaTotales: [
            'Totales',
            String(this.totales.cantidadDocumentos),
            '',
            '',
            pdfNumero(this.ind.promedioDiasVencidos),
            '',
            pdfMoneda(this.totales.totalPendiente),
            pdfMoneda(this.totales.total0a30),
            pdfMoneda(this.totales.total31a60),
            pdfMoneda(this.totales.total61a90),
            pdfMoneda(this.totales.totalMas90)
          ]
        }],
        nombreArchivo: `Antiguedad_${this.modo.toUpperCase()}_${this.fechaCorte}.pdf`,
        modo
      });
    } catch {
      this.toast('No se pudo generar el PDF', 'danger');
    } finally {
      this.exportando = false;
    }
  }

  private csv(v: string): string {
    const s = (v ?? '').replace(/"/g, '""');
    return `"${s}"`;
  }

  private num(v: number | null | undefined): string {
    return Number(v || 0).toFixed(2);
  }

  private fmtFecha(v: string | null | undefined): string {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v).substring(0, 10);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async toast(message: string, color = 'dark'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }

  private destroyCharts(): void {
    this.chartDist?.destroy();
    this.chartTop?.destroy();
    this.chartDist = null;
    this.chartTop = null;
  }

  private renderCharts(): void {
    this.destroyCharts();
    this.renderDistChart();
    this.renderTopChart();
  }

  private renderDistChart(): void {
    const canvas = document.getElementById('chartAntiguedad') as HTMLCanvasElement | null;
    if (!canvas || !this.data?.distribucion?.length) return;

    const labels = this.data.distribucion.map((d) => d.etiqueta);
    const valores = this.data.distribucion.map((d) => Number(d.monto || 0));
    const colors = this.data.distribucion.map(
      (d) => COLOR_RANGOS[d.codigo as keyof typeof COLOR_RANGOS] || '#64748b'
    );

    this.chartDist = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Saldo pendiente',
            data: valores,
            backgroundColor: colors,
            borderRadius: 8,
            maxBarThickness: 56,
          },
        ],
      },
      options: this.chartOptions(),
    });
  }

  private renderTopChart(): void {
    const canvas = document.getElementById('chartTopTerceros') as HTMLCanvasElement | null;
    const top = this.data?.topTerceros || [];
    if (!canvas || !top.length) return;

    const labels = top.map((t) =>
      t.nombre.length > 18 ? t.nombre.substring(0, 16) + '…' : t.nombre
    );
    const valores = top.map((t) => Number(t.saldo || 0));

    this.chartTop = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Deuda',
            data: valores,
            backgroundColor: '#1976d2',
            borderRadius: 8,
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.raw || 0);
                return ` RD$ ${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: '#64748b',
              callback: (v) =>
                Number(v).toLocaleString('es-DO', { maximumFractionDigits: 0 }),
            },
            grid: { color: 'rgba(148,163,184,0.25)' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } },
          },
        },
      },
    });
  }

  private chartOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = Number(ctx.raw || 0);
              return ` RD$ ${v.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#64748b',
            callback: (v) =>
              Number(v).toLocaleString('es-DO', { maximumFractionDigits: 0 }),
          },
          grid: { color: 'rgba(148,163,184,0.25)' },
        },
      },
    };
  }
}
