import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { IngresosService } from 'src/app/servicios/ingresos.service';
import { ReporteVentaService } from 'src/app/servicios/reporte-venta.service';
import {
  ReporteVentaFactura,
  ReporteVentaFacturas,
  ReporteVentaFormaPagoGrupo,
  ReporteVentaProducto,
  ReporteVentaProductos
} from 'src/app/models/reporte-venta.models';
import { descargarExcel, excelFecha } from 'src/app/shared/export-excel';
import { pdfFecha, pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

type VistaReporte = 'facturas' | 'productos' | 'resumen';

@Component({
  selector: 'app-cajas',
  templateUrl: './cajas.component.html',
  styleUrls: ['./cajas.component.scss'],
})
export class CajasComponent implements OnInit {
  vista: VistaReporte = 'facturas';
  fechaInicio = '';
  fechaFin = '';
  busqueda = '';
  cargando = false;
  idSucursalFiltro = 0;

  facturas: ReporteVentaFacturas | null = null;
  productos: ReporteVentaProductos | null = null;
  facturaAbierta: Record<number, boolean> = {};
  grupoAbierto: Record<string, boolean> = {};

  ingresosAgrupados: Array<{
    areaNegocio: string;
    metodos: Array<{ metodo: string; total: number }>;
    total: number;
  }> = [];
  totalLinea = 0;

  constructor(
    private reporte: ReporteVentaService,
    private ingresos: IngresosService,
    public parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = primero.toISOString().substring(0, 10);
    this.fechaFin = hoy.toISOString().substring(0, 10);
    this.consultar();
  }

  ionViewWillEnter(): void {
    if (!this.facturas && !this.cargando) {
      this.consultar();
    }
  }

  consultar(): void {
    const idEmpresa = this.parametro.GetIdEmpresa();
    if (!idEmpresa || !this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.cargando = true;
    this.facturaAbierta = {};
    this.grupoAbierto = {};

    forkJoin({
      facturas: this.reporte.facturas(idEmpresa, this.fechaInicio, this.fechaFin, this.idSucursalFiltro),
      productos: this.reporte.productos(idEmpresa, this.fechaInicio, this.fechaFin, this.idSucursalFiltro)
    }).subscribe({
      next: ({ facturas, productos }) => {
        this.facturas = facturas;
        this.productos = productos;
        (facturas.grupos || []).forEach(g => (this.grupoAbierto[g.formaPago] = true));
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        this.facturas = null;
        this.productos = null;
        const t = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo generar el reporte de ventas.',
          color: 'danger',
          duration: 2800
        });
        t.present();
      }
    });

    this.cargarResumenLinea(idEmpresa);
  }

  onFiltroSucursal(id: number): void {
    const next = Number(id) || 0;
    if (next === this.idSucursalFiltro) return;
    this.idSucursalFiltro = next;
    this.consultar();
  }

  get gruposFiltrados(): ReporteVentaFormaPagoGrupo[] {
    const q = this.busqueda.trim().toLowerCase();
    const grupos = this.facturas?.grupos || [];
    if (!q) {
      return grupos;
    }

    return grupos
      .map(g => ({
        ...g,
        facturas: (g.facturas || []).filter(f => this.facturaCoincide(f, q))
      }))
      .filter(g => g.facturas.length > 0);
  }

  get productosFiltrados(): ReporteVentaProducto[] {
    const q = this.busqueda.trim().toLowerCase();
    const list = this.productos?.productos || [];
    if (!q) {
      return list;
    }
    return list.filter(p =>
      (p.nombre || '').toLowerCase().includes(q)
      || (p.codigo || '').toLowerCase().includes(q)
    );
  }

  toggleGrupo(formaPago: string): void {
    this.grupoAbierto[formaPago] = !this.grupoAbierto[formaPago];
  }

  toggleFactura(id: number): void {
    this.facturaAbierta[id] = !this.facturaAbierta[id];
  }

  exportarExcel(): void {
    if (this.vista === 'productos') {
      this.exportarExcelProductos();
      return;
    }
    this.exportarExcelFacturas();
  }

  exportarPdf(): void {
    if (this.vista === 'productos') {
      this.exportarPdfProductos();
      return;
    }
    this.exportarPdfFacturas();
  }

  private facturaCoincide(f: ReporteVentaFactura, q: string): boolean {
    const hayLinea = (f.lineas || []).some(l =>
      (l.producto || '').toLowerCase().includes(q)
      || (l.codigo || '').toLowerCase().includes(q)
    );
    return (f.numeroDocumento || '').toLowerCase().includes(q)
      || (f.ncf || '').toLowerCase().includes(q)
      || (f.cliente || '').toLowerCase().includes(q)
      || (f.formaPago || '').toLowerCase().includes(q)
      || hayLinea;
  }

  private cargarResumenLinea(idEmpresa: number): void {
    this.ingresos.getIngresosPorLinea(idEmpresa, this.fechaInicio, this.fechaFin).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        this.ingresosAgrupados = this.agruparPorLinea(data);
        this.totalLinea = this.ingresosAgrupados.reduce((acc, x) => acc + x.total, 0);
      },
      error: () => {
        this.ingresosAgrupados = [];
        this.totalLinea = 0;
      }
    });
  }

  private agruparPorLinea(data: any[]): Array<{
    areaNegocio: string;
    metodos: Array<{ metodo: string; total: number }>;
    total: number;
  }> {
    const resultado: Record<string, {
      areaNegocio: string;
      metodos: Array<{ metodo: string; total: number }>;
      total: number;
    }> = {};

    (data || []).forEach(item => {
      const area = item.areaNegocio || 'Sin área';
      const metodo = item.metodoPago || 'N/A';
      if (!resultado[area]) {
        resultado[area] = { areaNegocio: area, metodos: [], total: 0 };
      }
      const existente = resultado[area].metodos.find(m => m.metodo === metodo);
      if (existente) {
        existente.total += Number(item.total || 0);
      } else {
        resultado[area].metodos.push({ metodo, total: Number(item.total || 0) });
      }
      resultado[area].total += Number(item.total || 0);
    });

    return Object.values(resultado);
  }

  private exportarExcelFacturas(): void {
    const grupos = this.gruposFiltrados;
    const encabezadoFact = [
      'Forma de pago', 'Fecha', 'Documento', 'Cliente', 'NCF', 'ITBIS',
      'Tipo', 'Estado', 'Subtotal', 'Descuento', 'ITBIS $', 'Total'
    ];
    const filasFact: Array<Array<string | number>> = [encabezadoFact];
    const filasLinea: Array<Array<string | number>> = [[
      'Documento', 'NCF', 'Producto', 'Código', 'Cantidad', 'Precio', 'Descuento', 'ITBIS', 'Subtotal', 'Total'
    ]];

    grupos.forEach(g => {
      (g.facturas || []).forEach(f => {
        filasFact.push([
          g.formaPago,
          excelFecha(f.fecha),
          f.numeroDocumento,
          f.cliente,
          f.ncf || '',
          f.tieneItbis ? 'Sí' : 'No',
          f.tipoFactura,
          f.estado,
          Number(f.subTotal || 0),
          Number(f.totalDescuento || 0),
          Number(f.totalItbis || 0),
          Number(f.total || 0)
        ]);
        (f.lineas || []).forEach(l => {
          filasLinea.push([
            f.numeroDocumento,
            f.ncf || '',
            l.producto,
            l.codigo || '',
            Number(l.cantidad || 0),
            Number(l.precioUnitario || 0),
            Number(l.descuento || 0),
            Number(l.itbis || 0),
            Number(l.subTotal || 0),
            Number(l.total || 0)
          ]);
        });
      });
    });

    descargarExcel(`ventas-facturas-${this.fechaInicio}-${this.fechaFin}.xls`, [
      { nombre: 'Facturas', filas: filasFact },
      { nombre: 'Lineas', filas: filasLinea }
    ]);
  }

  private exportarExcelProductos(): void {
    const filas: Array<Array<string | number>> = [[
      'Producto', 'Código', 'Tipo', 'Cantidad', 'Facturas', 'Precio promedio',
      'Descuento', 'ITBIS', 'Subtotal', 'Total'
    ]];
    this.productosFiltrados.forEach(p => {
      filas.push([
        p.nombre,
        p.codigo || '',
        p.esServicio ? 'Servicio' : 'Producto',
        Number(p.cantidad || 0),
        Number(p.cantidadFacturas || 0),
        Number(p.precioPromedio || 0),
        Number(p.descuento || 0),
        Number(p.itbis || 0),
        Number(p.subTotal || 0),
        Number(p.total || 0)
      ]);
    });
    descargarExcel(`ventas-productos-${this.fechaInicio}-${this.fechaFin}.xls`, [
      { nombre: 'Productos', filas }
    ]);
  }

  private exportarPdfFacturas(): void {
    const r = this.facturas;
    emitirReporteTabla({
      titulo: 'Reporte de ventas por factura',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: `${this.fechaInicio} — ${this.fechaFin}`,
      landscape: true,
      nombreArchivo: `ventas-facturas-${this.fechaInicio}-${this.fechaFin}.pdf`,
      kpis: [
        { label: 'Facturas', value: String(r?.cantidadFacturas || 0) },
        { label: 'Con NCF', value: String(r?.conNcf || 0) },
        { label: 'ITBIS', value: pdfMoneda(r?.totalItbis) },
        { label: 'Total', value: pdfMoneda(r?.total) }
      ],
      secciones: this.gruposFiltrados.map(g => ({
        titulo: `${g.formaPago} · ${g.cantidadFacturas} facturas · ${pdfMoneda(g.total)}`,
        columnas: [
          { header: 'Fecha', width: 70 },
          { header: 'Documento', width: 80 },
          { header: 'Cliente', width: '*' },
          { header: 'NCF', width: 90 },
          { header: 'ITBIS', width: 40, align: 'center' as const },
          { header: 'Desc.', width: 60, align: 'right' as const },
          { header: 'ITBIS $', width: 70, align: 'right' as const },
          { header: 'Total', width: 75, align: 'right' as const }
        ],
        filas: (g.facturas || []).map(f => [
          pdfFecha(f.fecha),
          f.numeroDocumento,
          f.cliente,
          f.ncf || '—',
          f.tieneItbis ? 'Sí' : 'No',
          pdfNumero(f.totalDescuento),
          pdfNumero(f.totalItbis),
          pdfNumero(f.total)
        ]),
        filaTotales: ['', '', '', '', '', pdfNumero(g.totalDescuento), pdfNumero(g.totalItbis), pdfNumero(g.total)]
      }))
    });
  }

  private exportarPdfProductos(): void {
    const r = this.productos;
    emitirReporteTabla({
      titulo: 'Reporte de ventas por producto',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: `${this.fechaInicio} — ${this.fechaFin}`,
      landscape: true,
      nombreArchivo: `ventas-productos-${this.fechaInicio}-${this.fechaFin}.pdf`,
      kpis: [
        { label: 'Productos', value: String(r?.cantidadProductos || 0) },
        { label: 'Unidades', value: pdfNumero(r?.cantidadVendida) },
        { label: 'ITBIS', value: pdfMoneda(r?.totalItbis) },
        { label: 'Total', value: pdfMoneda(r?.total) }
      ],
      secciones: [{
        columnas: [
          { header: 'Producto', width: '*' },
          { header: 'Código', width: 70 },
          { header: 'Tipo', width: 60 },
          { header: 'Cant.', width: 50, align: 'right' as const },
          { header: 'Facts.', width: 45, align: 'right' as const },
          { header: 'P. prom.', width: 65, align: 'right' as const },
          { header: 'Desc.', width: 55, align: 'right' as const },
          { header: 'ITBIS', width: 60, align: 'right' as const },
          { header: 'Total', width: 70, align: 'right' as const }
        ],
        filas: this.productosFiltrados.map(p => [
          p.nombre,
          p.codigo || '—',
          p.esServicio ? 'Servicio' : 'Producto',
          pdfNumero(p.cantidad),
          String(p.cantidadFacturas || 0),
          pdfNumero(p.precioPromedio),
          pdfNumero(p.descuento),
          pdfNumero(p.itbis),
          pdfNumero(p.total)
        ]),
        filaTotales: [
          'Total', '', '', pdfNumero(r?.cantidadVendida), '', '',
          pdfNumero(r?.totalDescuento), pdfNumero(r?.totalItbis), pdfNumero(r?.total)
        ]
      }]
    });
  }
}
