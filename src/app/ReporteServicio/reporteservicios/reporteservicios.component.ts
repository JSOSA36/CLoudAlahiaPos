import { Component, OnInit } from '@angular/core';
import {
  ReporteServiciosService,
  ServicioEmpleadoDto
} from 'src/app/servicios/reporteservicios';

import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { Empleado } from 'src/app/models/empleado.models';
import { pdfFecha, pdfMoneda } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-reporteservicios',
  templateUrl: './reporteservicios.component.html',
  styleUrls: ['./reporteservicios.component.scss'],
})
export class ReporteserviciosComponent implements OnInit {

  desde!: string;
  hasta!: string;

  idEmpresa = 0;

  // 👤 SOLO EMPLEADOS
  empleadoId: number | null = null;
  empleados: Empleado[] = [];

  servicios: ServicioEmpleadoDto[] = [];
  serviciosFiltrados: ServicioEmpleadoDto[] = [];

  totalServicios = 0;
  totalSubtotal = 0;
  totalComision = 0;
  avgComisionPorServicio = 0;
  avgPorcientoComision = 0;

  cargando = false;

  constructor(
    private reporteService: ReporteServiciosService,
    private empleadosService: EmpleadosService,
    private parametros: ParametrosService
  ) {
    this.idEmpresa = this.parametros.IdEmpresa;
  }

  ngOnInit(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.desde = inicioMes.toISOString().substring(0, 10);
    this.hasta = hoy.toISOString().substring(0, 10);

    this.cargarEmpleados();
    this.buscar();
  }

  // =====================================================
  // 👤 EMPLEADOS
  // =====================================================
  cargarEmpleados(): void {
    this.empleadosService.getByEmpresa(this.idEmpresa).subscribe({
      next: (data) => {
        this.empleados = data ?? [];
      },
      error: (err) => console.error('Error cargando empleados', err),
    });
  }

  // =====================================================
  // 🔎 BUSCAR
  // =====================================================
  buscar(): void {
    if (!this.desde || !this.hasta) return;

    this.cargando = true;

    this.reporteService
      .getServiciosPorEmpleado(
        new Date(this.desde),
        new Date(this.hasta),
        this.idEmpresa
      )
      .subscribe({
        next: (data) => {
          this.servicios = data ?? [];
          console.log('Servicios obtenidos:', this.servicios);
          this.aplicarFiltros();
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar servicios:', err);
          this.servicios = [];
          this.serviciosFiltrados = [];
          this.computeResumen();
          this.cargando = false;
        },
      });
  }

  // =====================================================
  // 🎯 FILTROS
  // =====================================================
  aplicarFiltros(): void {
    this.serviciosFiltrados =
      this.empleadoId == null
        ? this.servicios
        : this.servicios.filter(
            s => s.idEmpleado === this.empleadoId
          );

    this.computeResumen();
    console.log(this.serviciosFiltrados);
  }

  // =====================================================
  // 📊 RESUMEN
  // =====================================================
  private computeResumen(): void {
    const list = this.serviciosFiltrados ?? [];

    this.totalServicios = list.length;
    this.totalSubtotal = list.reduce((a, b) => a + (b.subTotal || 0), 0);
    this.totalComision = list.reduce((a, b) => a + (b.comision || 0), 0);

    this.avgComisionPorServicio =
      this.totalServicios > 0
        ? this.totalComision / this.totalServicios
        : 0;

    if (this.totalSubtotal > 0) {
      const ponderado = list.reduce(
        (a, b) => a + (b.subTotal || 0) * (b.porcientoComision || 0),
        0
      );
      this.avgPorcientoComision = ponderado / this.totalSubtotal;
    } else {
      const n = list.length || 1;
      this.avgPorcientoComision =
        list.reduce((a, b) => a + (b.porcientoComision || 0), 0) / n;
    }
  }

  // =====================================================
  // 🧠 HELPERS
  // =====================================================
  get empleadoSeleccionado(): string | null {
    const e = this.empleados.find(x => x.idEmpleados === this.empleadoId);
    return e ? e.nombre : null;
  }

  trackByFactura = (_: number, s: ServicioEmpleadoDto) =>
    `${s.noFactura}-${s.idProducto}`;

  exportarPdf(): void {
    if (!this.serviciosFiltrados.length) {
      return;
    }
    emitirReporteTabla({
      titulo: 'Reporte de servicios',
      empresa: this.parametros.NombreEmpresa,
      subtitulo: `${pdfFecha(this.desde)} — ${pdfFecha(this.hasta)}${this.empleadoSeleccionado ? ' · ' + this.empleadoSeleccionado : ''}`,
      landscape: true,
      kpis: [
        { label: 'Servicios', value: String(this.totalServicios) },
        { label: 'Subtotal', value: pdfMoneda(this.totalSubtotal) },
        { label: 'Comisiones', value: pdfMoneda(this.totalComision) }
      ],
      secciones: [{
        columnas: [
          { header: 'Fecha', width: 62 },
          { header: 'Servicio', width: '*' },
          { header: 'Cliente', width: 90 },
          { header: 'Empleado', width: 90 },
          { header: 'Factura', width: 70 },
          { header: 'Subtotal', width: 70, align: 'right' },
          { header: 'Comisión', width: 70, align: 'right' }
        ],
        filas: this.serviciosFiltrados.map(s => [
          pdfFecha(s.fecha as any),
          s.tipoFactura === 'Credito' ? `${s.producto} (Crédito)` : s.producto,
          s.cliente || 'Consumidor Final',
          s.empleado,
          s.noFactura,
          pdfMoneda(s.subTotal),
          pdfMoneda(s.comision)
        ]),
        filaTotales: [
          'TOTAL',
          '',
          '',
          '',
          String(this.totalServicios),
          pdfMoneda(this.totalSubtotal),
          pdfMoneda(this.totalComision)
        ]
      }],
      nombreArchivo: `Reporte_servicios_${this.desde}_${this.hasta}.pdf`
    });
  }
}
