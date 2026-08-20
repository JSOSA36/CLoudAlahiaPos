import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { registerLocaleData } from '@angular/common';
import localeEsDo from '@angular/common/locales/es-DO';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { DashboardGerencialService } from 'src/app/servicios/dashboard-gerencial.service';
import { AlahiaAiService } from 'src/app/servicios/alahia-ai.service';
import { ALAHIA_AI_TIPS, AlahiaAiResumenResponse } from 'src/app/models/alahia-ai.models';
import { Router } from '@angular/router';
import {
  DashboardGerencialDto,
  DashboardGerencialIndicadoresDto,
  DashboardGerencialPlDto,
  EstadoResultadosPasoDto,
  ProductoRentabilidadDto,
} from 'src/app/models/dashboard-gerencial.dto';

registerLocaleData(localeEsDo);
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-gerencial',
  templateUrl: './dashboard-gerencial.component.html',
  styleUrls: ['./dashboard-gerencial.component.scss'],
})
export class DashboardGerencialComponent implements OnInit, OnDestroy {
  loading = false;
  errorMsg = '';
  data: DashboardGerencialDto | null = null;

  plCards: { label: string; value: number; tone: string }[] = [];
  indCards: { label: string; value: number; icon: IconName; tone: string }[] = [];
  margenCards: { label: string; value: number; hint: string }[] = [];

  mostrarResumenAi = false;
  aiLoading = false;
  aiError = '';
  aiResumen: AlahiaAiResumenResponse | null = null;
  readonly aiTips = ALAHIA_AI_TIPS.slice(0, 3);

  private charts: Chart[] = [];

  constructor(
    private dashboardService: DashboardGerencialService,
    private parametros: ParametrosService,
    private alahiaAi: AlahiaAiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Resumen: ALAHIA_AI o DASHBOARD; FAB solo con ALAHIA_AI.
    this.mostrarResumenAi =
      this.parametros.tieneModulo('ALAHIA_AI') || this.parametros.tieneModulo('DASHBOARD');
    this.cargar();
    if (this.mostrarResumenAi) {
      this.cargarResumenAi();
    }
  }

  preguntarAi(tip: string): void {
    void this.router.navigate(['/alahia-ai'], { queryParams: { q: tip } });
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private emptyPl(): DashboardGerencialPlDto {
    return {
      ventasBrutas: 0,
      costoVenta: 0,
      utilidadBruta: 0,
      gastosOperativos: 0,
      comisiones: 0,
      perdidasInventario: 0,
      otrosIngresos: 0,
      otrosEgresos: 0,
      utilidadOperativa: 0,
      margenBrutoPct: 0,
      margenOperativoPct: 0,
    };
  }

  get pl(): DashboardGerencialPlDto {
    return this.data?.pl ?? this.emptyPl();
  }

  get plHoy(): DashboardGerencialPlDto {
    return this.data?.plHoy ?? this.emptyPl();
  }

  get ind(): DashboardGerencialIndicadoresDto {
    return (
      this.data?.indicadores ?? {
        caja: 0,
        bancos: 0,
        valorInventario: 0,
        valorActivosFijos: 0,
        cuentasPorCobrar: 0,
        cuentasPorPagar: 0,
      }
    );
  }

  get estadoResultados(): EstadoResultadosPasoDto[] {
    const fromApi = this.data?.charts?.estadoResultados ?? [];
    if (fromApi.length) return fromApi;
    return this.buildEstadoResultadosLocal(this.pl);
  }

  get topRentables(): ProductoRentabilidadDto[] {
    return this.data?.charts?.topProductosRentables ?? [];
  }

  get flujoNeto(): number {
    const flujo = this.data?.charts?.flujoEfectivo ?? [];
    const neto = flujo.find((x) => x.nombre === 'Neto');
    return neto?.monto ?? 0;
  }

  private buildEstadoResultadosLocal(pl: DashboardGerencialPlDto): EstadoResultadosPasoDto[] {
    const pasos: EstadoResultadosPasoDto[] = [];
    let acum = 0;

    const push = (concepto: string, monto: number, tipo: string) => {
      if (tipo === 'base') acum = monto;
      else if (tipo === 'resta') acum -= monto;
      else if (tipo === 'suma') acum += monto;
      else acum = monto;

      pasos.push({
        concepto,
        monto,
        acumulado: acum,
        tipo,
      });
    };

    push('Ventas brutas', pl.ventasBrutas || 0, 'base');
    push('Costo de venta', pl.costoVenta || 0, 'resta');
    push('Utilidad bruta', pl.utilidadBruta || 0, 'subtotal');
    push('Gastos operativos', pl.gastosOperativos || 0, 'resta');
    push('Comisiones', pl.comisiones || 0, 'resta');
    push('Pérdidas de inventario', pl.perdidasInventario || 0, 'resta');
    if ((pl.otrosEgresos || 0) > 0) push('Otros egresos', pl.otrosEgresos, 'resta');
    if ((pl.otrosIngresos || 0) > 0) push('Otros ingresos', pl.otrosIngresos, 'suma');
    push('Utilidad operativa', pl.utilidadOperativa || 0, 'total');
    return pasos;
  }

  handleRefresh(event: any): void {
    this.cargar(() => {
      if (this.mostrarResumenAi) {
        this.cargarResumenAi();
      }
      event?.target?.complete?.();
    });
  }

  cargarResumenAi(): void {
    if (!this.mostrarResumenAi) return;
    this.aiLoading = true;
    this.aiError = '';
    this.alahiaAi.resumen().subscribe({
      next: (res) => {
        this.aiResumen = res;
        this.aiLoading = false;
        if (!res?.bullets?.length && !res?.greeting) {
          this.aiError = 'Sin insights por ahora.';
        }
      },
      error: () => {
        this.aiLoading = false;
        this.aiError = 'No se pudo cargar el resumen inteligente.';
      },
    });
  }

  cargar(done?: () => void): void {
    const idEmpresa = this.parametros.IdEmpresa;
    if (!idEmpresa) {
      this.errorMsg = 'No hay empresa en sesión.';
      done?.();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.dashboardService.getMesActual(idEmpresa).subscribe({
      next: (res) => {
        // Compat: APIs viejas sin plHoy → objeto vacío (no romper pantalla)
        this.data = {
          ...res,
          plHoy: res?.plHoy ?? this.emptyPl(),
          periodoHoyLabel: res?.periodoHoyLabel || 'Hoy',
        };
        this.refreshCards();
        this.loading = false;
        setTimeout(() => this.renderCharts(), 80);
        done?.();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMsg = 'No se pudo cargar el Panel Gerencial.';
        done?.();
      },
    });
  }

  private refreshCards(): void {
    const p = this.pl;
    const i = this.ind;

    this.plCards = [
      { label: 'Ventas brutas', value: p.ventasBrutas, tone: 'blue' },
      { label: 'Costo de venta', value: p.costoVenta, tone: 'orange' },
      { label: 'Utilidad bruta', value: p.utilidadBruta, tone: 'yellow' },
      { label: 'Gastos operativos', value: p.gastosOperativos, tone: 'navy' },
      { label: 'Comisiones', value: p.comisiones, tone: 'amber' },
      { label: 'Pérdidas inventario', value: p.perdidasInventario, tone: 'orange' },
      { label: 'Otros ingresos', value: p.otrosIngresos, tone: 'blue' },
      { label: 'Otros egresos', value: p.otrosEgresos, tone: 'slate' },
    ];

    this.margenCards = [
      {
        label: 'Margen bruto',
        value: p.margenBrutoPct,
        hint: 'Utilidad bruta / ventas',
      },
      {
        label: 'Margen operativo',
        value: p.margenOperativoPct,
        hint: 'Utilidad operativa / ventas',
      },
    ];

    const cards: { label: string; value: number; icon: IconName; tone: string }[] = [
      { label: 'Caja', value: i.caja, icon: 'cash-register', tone: 'yellow' },
      { label: 'Bancos', value: i.bancos, icon: 'building-columns', tone: 'navy' },
      { label: 'Valor inventario', value: i.valorInventario, icon: 'boxes-stacked', tone: 'amber' },
      { label: 'Activos fijos', value: i.valorActivosFijos, icon: 'warehouse', tone: 'blue' },
    ];

    if (this.parametros.tieneModulo('CUENTAS_COBRAR')) {
      cards.push({ label: 'Cuentas por cobrar', value: i.cuentasPorCobrar, icon: 'hand-holding-dollar', tone: 'orange' });
    }

    cards.push({ label: 'Cuentas por pagar', value: i.cuentasPorPagar, icon: 'file-invoice-dollar', tone: 'slate' });

    this.indCards = cards;
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  private renderCharts(): void {
    this.destroyCharts();
    if (!this.data) return;

    const charts = this.data.charts;

    this.createChart('chartVentasCostosUtilidad', {
      type: 'bar',
      data: {
        labels: charts.ventasVsCostosVsUtilidad.map((x) => x.nombre),
        datasets: [
          {
            data: charts.ventasVsCostosVsUtilidad.map((x) => x.monto),
            backgroundColor: ['#1976d2', '#ef6c00', '#ffc107'],
            borderRadius: 6,
            barPercentage: 0.55,
          },
        ],
      },
      options: this.moneyBarOptions(false),
    });

    this.createChart('chartEvolucionVentas', {
      type: 'line',
      data: {
        labels: charts.evolucionVentasMes.map((x) => x.fecha),
        datasets: [
          {
            label: 'Ventas',
            data: charts.evolucionVentasMes.map((x) => x.monto),
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 2,
          },
        ],
      },
      options: this.moneyBarOptions(false),
    });

    this.createChart('chartDistribucionGastos', {
      type: 'doughnut',
      data: {
        labels: charts.distribucionGastos.map((x) => x.nombre),
        datasets: [
          {
            data: charts.distribucionGastos.map((x) => x.monto),
            backgroundColor: this.palette(charts.distribucionGastos.length),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: this.doughnutOptions(),
    });

    this.createChart('chartDistribucionPerdidas', {
      type: 'doughnut',
      data: {
        labels: charts.distribucionPerdidas.map((x) => x.nombre),
        datasets: [
          {
            data: charts.distribucionPerdidas.map((x) => x.monto),
            backgroundColor: this.palette(charts.distribucionPerdidas.length, true),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: this.doughnutOptions(),
    });

    this.createChart('chartComisionesEmpleado', {
      type: 'bar',
      data: {
        labels: charts.comisionesPorEmpleado.map((x) => x.nombre),
        datasets: [
          {
            label: 'Comisión',
            data: charts.comisionesPorEmpleado.map((x) => x.monto),
            backgroundColor: '#ffc107',
            borderRadius: 6,
          },
        ],
      },
      options: { ...this.moneyBarOptions(false), indexAxis: 'y' },
    });

    this.createChart('chartTopRentables', {
      type: 'bar',
      data: {
        labels: charts.topProductosRentables.map((x) => x.nombre),
        datasets: [
          {
            label: 'Margen',
            data: charts.topProductosRentables.map((x) => x.margen),
            backgroundColor: '#1976d2',
            borderRadius: 6,
          },
        ],
      },
      options: { ...this.moneyBarOptions(false), indexAxis: 'y' },
    });

    this.createChart('chartTopPerdidas', {
      type: 'bar',
      data: {
        labels: charts.topProductosPerdidas.map((x) => x.nombre),
        datasets: [
          {
            label: 'Pérdida',
            data: charts.topProductosPerdidas.map((x) => x.monto),
            backgroundColor: '#ef6c00',
            borderRadius: 6,
          },
        ],
      },
      options: { ...this.moneyBarOptions(false), indexAxis: 'y' },
    });

    // Flujo de efectivo (reemplaza Caja vs Bancos)
    const flujo = (charts.flujoEfectivo || []).filter((x) => x.nombre !== 'Neto');
    this.createChart('chartFlujoEfectivo', {
      type: 'bar',
      data: {
        labels: flujo.map((x) => x.nombre),
        datasets: [
          {
            data: flujo.map((x) => x.monto),
            backgroundColor: ['#1976d2', '#ffc107'],
            borderRadius: 6,
            barPercentage: 0.5,
          },
        ],
      },
      options: this.moneyBarOptions(false),
    });

    // Waterfall Estado de Resultados (API o fallback local desde P&L)
    this.renderWaterfall(this.estadoResultados);
  }

  private renderWaterfall(pasos: EstadoResultadosPasoDto[]): void {
    if (!pasos.length) return;

    const labels = pasos.map((p) => p.concepto);
    const bases: number[] = [];
    const deltas: number[] = [];
    const colors: string[] = [];

    let running = 0;
    for (const p of pasos) {
      if (p.tipo === 'base') {
        bases.push(0);
        deltas.push(p.monto);
        colors.push('#1976d2');
        running = p.monto;
      } else if (p.tipo === 'resta') {
        bases.push(running - p.monto);
        deltas.push(p.monto);
        colors.push('#c62828');
        running -= p.monto;
      } else if (p.tipo === 'suma') {
        bases.push(running);
        deltas.push(p.monto);
        colors.push('#ffc107');
        running += p.monto;
      } else {
        // subtotal / total — barra desde 0
        bases.push(0);
        deltas.push(p.acumulado);
        colors.push(p.tipo === 'total' ? (p.acumulado >= 0 ? '#1e3c72' : '#c62828') : '#2a5298');
        running = p.acumulado;
      }
    }

    this.createChart('chartEstadoResultados', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Base',
            data: bases,
            backgroundColor: 'rgba(0,0,0,0)',
            borderWidth: 0,
            stack: 'wf',
            barPercentage: 0.6,
          },
          {
            label: 'Monto',
            data: deltas,
            backgroundColor: colors,
            borderRadius: 4,
            stack: 'wf',
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: (item) => item.datasetIndex === 1,
            callbacks: {
              label: (ctx) => {
                const paso = pasos[ctx.dataIndex];
                const signo =
                  paso.tipo === 'resta' ? '−' : paso.tipo === 'suma' ? '+' : '';
                return `${signo}RD$ ${Number(paso.monto).toLocaleString('es-DO')}  →  acum. ${Number(
                  paso.acumulado
                ).toLocaleString('es-DO')}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#475569', maxRotation: 45, minRotation: 0, font: { size: 11 } },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: '#e2e8f0' },
            ticks: { color: '#64748b' },
          },
        },
      },
    });
  }

  private createChart(canvasId: string, config: ChartConfiguration): void {
    const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!el) return;
    this.charts.push(new Chart(el, config));
  }

  private moneyBarOptions(showLegend: boolean): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: showLegend, position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = Number(ctx.raw ?? 0);
              return `RD$ ${val.toLocaleString('es-DO')}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' },
          ticks: { color: '#64748b' },
        },
      },
    };
  }

  private doughnutOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = Number(ctx.raw ?? 0);
              return `${ctx.label}: RD$ ${val.toLocaleString('es-DO')}`;
            },
          },
        },
      },
    };
  }

  private palette(n: number, warm = false): string[] {
    // Gastos / categorías: azules y slate (no rojo; el rojo se reserva para alertas reales)
    const cool = ['#1976d2', '#2a5298', '#1e3c72', '#42a5f5', '#1565c0', '#5c6bc0', '#78909c', '#64b5f6'];
    // Pérdidas: naranja/ámbar (alerta), sin rojo puro
    const hot = ['#ef6c00', '#f9a825', '#ffc107', '#fb8c00', '#ffb300', '#ff8f00', '#ffa726', '#ffcc80'];
    const base = warm ? hot : cool;
    if (n <= 0) return base;
    return Array.from({ length: n }, (_, i) => base[i % base.length]);
  }
}
