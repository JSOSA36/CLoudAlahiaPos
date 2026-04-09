import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { IngresosService } from 'src/app/servicios/ingresos.service';
import { GastosService } from 'src/app/servicios/gastos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { clientes as Cliente } from 'src/app/models/clientes';
import { HistoricoIngresosDto } from 'src/app/models/historico-ingresos.dto';
import { ComisionesResultDto } from '../models/comisionesresultdto';
import { map } from 'rxjs/operators';
import { registerLocaleData } from '@angular/common';
import localeEsDo from '@angular/common/locales/es-DO';
import { CitasService } from 'src/app/servicios/citas.service';
import { ServicioRankingDto } from '../models/ServicioRankingDto .models';
import { CuentaPorCobrarDto } from '../models/CuentaPorCobrarDto .models';

registerLocaleData(localeEsDo);

@Component({
  selector: 'app-dashboard',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class DashboardComponent implements OnInit {

  totalDia: number = 0;
  totalMes: number = 0;
  totalComisiones: number = 0;
  totalGastos: number = 0;
 topServicios: ServicioRankingDto[] = []; // ✅ ahora será dinámico
  meses: string[] = [];
  ingresosMensuales: number[] = [];
  cuentasPorCobrar: CuentaPorCobrarDto[] = [];
  totaldeudacobrar:number=0;

  // 📅 Citas del día (reales)
  citasHoy: any[] = [];

  private chartIngresos!: Chart<'bar'>;
  private chartBalance!: Chart<'doughnut'>;

  constructor(
    private ingresosService: IngresosService,
    private gastosService: GastosService,
    private facturaHeaderService: FacturaHeaderService,
    private parametrosService: ParametrosService,
    private clienteService: ClienteService,
    private citasService: CitasService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.cargarDatosDashboard();
    this.cargarCumpleaneros();
    this.cargarCitasHoy();
     this.cargarTopServicios();

     this.facturaHeaderService.GetCuentasPorCobrar(this.parametrosService.IdEmpresa).subscribe({
    next: (data) => {
      this.cuentasPorCobrar = data;
      this.totaldeudacobrar = data.reduce((sum, c) => sum + c.totalDeuda, 0);
    },
    error: (err) => console.error('Error al obtener cuentas por cobrar', err)
  });
  }

  handleRefresh(event: any) {
    this.cargarDatosDashboard(() => event.target.complete());
  }

  private cargarDatosDashboard(callback?: () => void) {
    const idEmpresa = this.parametrosService.IdEmpresa;

    this.ingresosService.getTotalDia(idEmpresa).subscribe({
      next: (res) => (this.totalDia = res),
      error: (err) => console.error('Error al cargar total del día', err),
    });

    this.ingresosService.getTotalMes(idEmpresa).subscribe({
      next: (res) => (this.totalMes = res),
      error: (err) => console.error('Error al cargar total del mes', err),
    });

    this.gastosService.getTotalGastos(idEmpresa).subscribe({
      next: (res) => (this.totalGastos = res),
      error: (err) => console.error('Error al cargar total de gastos', err),
    });

    this.getTotalComisionesMes(idEmpresa);

    this.ingresosService.getHistorico(idEmpresa).subscribe({
      next: (data: HistoricoIngresosDto[]) => {
        data.sort((a, b) => {
          const fechaA = new Date(a.mes);
          const fechaB = new Date(b.mes);
          return fechaA.getTime() - fechaB.getTime();
        });

        this.meses = data.map(x => x.mes || 'Sin Mes');
        this.ingresosMensuales = data.map(x => Number(x.total) || 0);

        this.renderGraficoIngresos();
        this.renderGraficoBalance();
      },
      error: (err) => console.error('Error cargando histórico', err),
      complete: () => callback?.(),
    });
  }

  private getTotalComisionesMes(idEmpresa: number) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

    this.facturaHeaderService.GetComisiones(inicioMes, finMes, idEmpresa)
      .pipe(map((res: ComisionesResultDto[]) => res.reduce((acc, c) => acc + c.totalComisiones, 0)))
      .subscribe({
        next: (total) => {
          this.totalComisiones = total;
          this.renderGraficoBalance();
        },
        error: (err) => console.error('Error al cargar comisiones del mes', err),
      });
  }

  get totalGanancia(): number {
    return (this.totalMes || 0) - (this.totalGastos || 0) - (this.totalComisiones || 0);
  }

  // 📊 GRÁFICO DE INGRESOS MENSUALES
  private renderGraficoIngresos() {
    const ctx = document.getElementById('ingresosChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chartIngresos) this.chartIngresos.destroy();

    this.chartIngresos = new Chart<'bar'>(ctx, {
      type: 'bar',
      data: {
        labels: this.meses,
        datasets: [
          {
            label: 'Ingresos por Mes (RD$)',
            data: this.ingresosMensuales,
            backgroundColor: '#1976d2',
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 20 } },
        animation: { duration: 1200, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: (ctx) => {
                const val = Number(ctx.raw ?? 0);
                return `RD$ ${val.toLocaleString('es-DO')}`;
              },
            },
          },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { color: '#555', font: { size: 13 } } },
          x: { grid: { display: false }, ticks: { color: '#555', font: { size: 13 } } },
        },
      },
    });
  }

  // ⚖️ GRÁFICO DE INGRESOS VS GASTOS
  private renderGraficoBalance() {
    const ctx = document.getElementById('ingresosGastosChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chartBalance) this.chartBalance.destroy();

    const config: any = {
      type: 'doughnut',
      data: {
        labels: ['Ingresos', 'Gastos', 'Comisiones'],
        datasets: [
          {
            data: [this.totalMes, this.totalGastos, this.totalComisiones],
            backgroundColor: ['#4CAF50', '#E53935', '#FFC107'],
            hoverBackgroundColor: ['#66BB6A', '#EF5350', '#FFD54F'],
            borderWidth: 3,
            borderColor: '#fff',
            spacing: 4,
            cutout: '55%',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        animation: { animateRotate: true, animateScale: true, duration: 1300, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#222',
              font: { size: 15, weight: '600' },
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (ctx: any) => {
                const label = ctx.label || '';
                const value = Number(ctx.raw || 0).toLocaleString('es-DO');
                return `${label}: RD$ ${value}`;
              },
            },
          },
        },
      },
    };

    this.chartBalance = new Chart(ctx, config);

    const total = (this.totalMes || 0) - (this.totalGastos || 0);
    const centerText = total >= 0 ? `+${total.toLocaleString('es-DO')}` : `${total.toLocaleString('es-DO')}`;

    setTimeout(() => {
      const ctx2 = ctx.getContext('2d');
      if (!ctx2) return;
      const centerX = ctx.width / 2;
      const centerY = ctx.height / 2;
      ctx2.save();
      ctx2.font = 'bold 18px Poppins';
      ctx2.fillStyle = '#333';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillText(centerText, centerX, centerY);
      ctx2.restore();
    }, 700);
  }

  // 🎂 CUMPLEAÑEROS
  clientesCumple: Cliente[] = [];

  cargarCumpleaneros() {
    const idEmpresa = this.parametrosService.IdEmpresa;

    this.citasService.GetListadoCitas(idEmpresa).subscribe({
      next: (data) => {
        const hoy = new Date().toISOString().substring(0, 10);
        const empleados = this.parametrosService._Empresa?.empleados || [];

        this.citasHoy = (data || [])
          .filter(c => c.fecha?.substring(0, 10) === hoy)
          .map(c => {
            const emp = empleados.find((e: any) => e.idEmpleados === c.idEmpleado);
            return {
              ...c,
              estilista: emp ? (emp.userName || emp.nombre) : 'No asignado'
            };
          });
      },
      error: (err) => console.error('Error cargando citas del día', err),
    });
  }

  // 📅 CITAS DEL DÍA (Versión ajustada)
// 📅 CITAS DEL DÍA (Versión final usando el backend con estilista)
cargarCitasHoy() {
  const idEmpresa = this.parametrosService.IdEmpresa;

  this.citasService.GetCitasConEmpleado(idEmpresa).subscribe({
    next: (data: any[]) => {

      const mapped = (data || []).map(c => {
        // hora 12h
        let horaFormateada = c.hora;
        if (c.hora && typeof c.hora === 'string' && c.hora.includes(':')) {
          const [hStr, mStr] = c.hora.split(':');
          const h = Number(hStr);
          const m = Number(mStr);
          if (!Number.isNaN(h) && !Number.isNaN(m)) {
            const d = new Date();
            d.setHours(h, m, 0, 0);
            horaFormateada = d.toLocaleTimeString('es-DO', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
          }
        }

        return {
          idCita: c.idCita,
          nombreCliente: c.nombreCliente ?? '—',
          servicio: c.nombreServicio ?? '—',
          hora: horaFormateada ?? '—',
          fecha: c.fecha,
          empleado: (c.nombreEstilista ?? '').trim(),
          estado: c.estado ?? 'Programada',
        };
      });

      console.table(mapped); // snapshot real
      this.citasHoy = mapped; // asignación final
    },
    error: (err) => {
      console.error('Error cargando citas del día', err);
      this.citasHoy = [];
    },
  });
}



  private hoyISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getEstadoColor(estado?: string) {
    switch (estado) {
      case 'Programada': return 'warning';
      case 'En curso':   return 'success';
      case 'Completada': return 'secondary';
      case 'Cancelada':  return 'danger';
      default:           return 'medium';
    }
  }

  cargarTopServicios() {
    const idEmpresa = this.parametrosService.IdEmpresa;

    this.facturaHeaderService.GetTopServicios(idEmpresa).subscribe({
      next: (data: ServicioRankingDto[]) => {
        this.topServicios = (data || []).map(s => ({
          nombreServicio: s.nombreServicio,
          veces: s.veces,
          totalFacturado: s.totalFacturado
        }));
      },
      error: (err) => console.error('Error cargando servicios más ofrecidos', err),
    });
  }

 

  

  trackById(index: number, item: any): number | string {
    return item?.idCita ?? index;
  }
}
