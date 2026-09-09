import { Component, OnInit } from '@angular/core';
import { CajaCierreService } from 'src/app/servicios/caja-cierre.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ProductosService } from 'src/app/servicios/productos.service';
import { productos } from 'src/app/models/productos';
import { pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

export interface LineaCruceStock {
  idCajaCierre: number;
  fechaApertura: string | Date;
  fechaCierre: string | Date;
  usuario: string;
  idProducto: number;
  producto: string;
  stockAlAbrir: number;
  cantidadVendida: number;
  otrosMovimientos: number;
  stockEsperado: number;
  stockAlCerrar: number;
  diferencia: number;
  cuadra: boolean;
}

@Component({
  selector: 'app-reporte-cruce-stock',
  templateUrl: './reporte-cruce-stock.component.html',
  styleUrls: ['./reporte-cruce-stock.component.scss'],
})
export class ReporteCruceStockComponent implements OnInit {

  lineas: LineaCruceStock[] = [];
  desde: string = this.inicioMes();
  hasta: string = new Date().toISOString().split('T')[0];
  cargando = false;

  idProducto = 0;
  filtroProducto = '';
  productos: productos[] = [];
  productosFiltrados: productos[] = [];

  totalLineas = 0;
  totalVendidos = 0;
  totalDescuadres = 0;

  constructor(
    private cajaService: CajaCierreService,
    public parametros: ParametrosService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarReporte();
  }

  private inicioMes(): string {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split('T')[0];
  }

  cargarProductos(): void {
    this.productosService
      .GetProductos(this.parametros.GetIdEmpresa())
      .subscribe({
        next: (data) => {
          this.productos = (data || [])
            .filter(p => !p.esServicio)
            .sort((a, b) =>
              (a.nombre || '').localeCompare(b.nombre || '')
            );
        }
      });
  }

  filtrarProductos(): void {
    const texto = this.filtroProducto.trim().toLowerCase();
    if (!texto) {
      this.idProducto = 0;
      this.productosFiltrados = [];
      return;
    }

    if (this.idProducto > 0) {
      const elegido = this.productos.find(p => p.idProducto === this.idProducto);
      if ((elegido?.nombre || '').toLowerCase() !== texto) {
        this.idProducto = 0;
      }
    }

    this.productosFiltrados = this.productos
      .filter(p =>
        (p.nombre || '').toLowerCase().includes(texto)
        || (p.codigoBarra || '').toLowerCase().includes(texto)
      )
      .slice(0, 25);

    const exacto = this.productosFiltrados.find(
      p => (p.nombre || '').toLowerCase() === texto
    );
    if (exacto) {
      this.idProducto = exacto.idProducto;
    }
  }

  seleccionarProducto(item: productos): void {
    this.idProducto = item.idProducto;
    this.filtroProducto = item.nombre || '';
    this.productosFiltrados = [];
  }

  limpiarProducto(): void {
    this.idProducto = 0;
    this.filtroProducto = '';
    this.productosFiltrados = [];
  }

  cargarReporte(): void {
    if (!(this.idProducto > 0) && this.filtroProducto.trim()) {
      const texto = this.filtroProducto.trim().toLowerCase();
      const exacto = this.productos.find(
        p => (p.nombre || '').toLowerCase() === texto
      );
      if (exacto) {
        this.idProducto = exacto.idProducto;
      }
    }

    this.cargando = true;

    this.cajaService
      .cruceStockVsVentas(
        this.parametros.GetIdEmpresa(),
        this.desde,
        this.hasta,
        this.idProducto > 0 ? this.idProducto : undefined
      )
      .subscribe({
        next: (res) => {
          this.lineas = (res || []).map((x: any) => ({
            idCajaCierre: x.idCajaCierre ?? x.IdCajaCierre,
            fechaApertura: x.fechaApertura ?? x.FechaApertura,
            fechaCierre: x.fechaCierre ?? x.FechaCierre,
            usuario: x.usuario ?? x.Usuario ?? '',
            idProducto: x.idProducto ?? x.IdProducto,
            producto: x.producto ?? x.Producto ?? '',
            stockAlAbrir: Number(x.stockAlAbrir ?? x.StockAlAbrir ?? 0),
            cantidadVendida: Number(x.cantidadVendida ?? x.CantidadVendida ?? 0),
            otrosMovimientos: Number(x.otrosMovimientos ?? x.OtrosMovimientos ?? 0),
            stockEsperado: Number(x.stockEsperado ?? x.StockEsperado ?? 0),
            stockAlCerrar: Number(x.stockAlCerrar ?? x.StockAlCerrar ?? 0),
            diferencia: Number(x.diferencia ?? x.Diferencia ?? 0),
            cuadra: !!(x.cuadra ?? x.Cuadra)
          }));
          this.calcularTotales();
          this.cargando = false;
        },
        error: () => {
          this.lineas = [];
          this.calcularTotales();
          this.cargando = false;
        }
      });
  }

  limpiarFiltros(): void {
    this.desde = this.inicioMes();
    this.hasta = new Date().toISOString().split('T')[0];
    this.limpiarProducto();
    this.cargarReporte();
  }

  private calcularTotales(): void {
    this.totalLineas = this.lineas.length;
    this.totalVendidos = this.lineas.reduce(
      (acc, x) => acc + x.cantidadVendida,
      0
    );
    this.totalDescuadres = this.lineas.filter(x => !x.cuadra).length;
  }

  formatearFecha(valor: string): string {
    if (!valor) {
      return '';
    }
    const partes = valor.split('-');
    if (partes.length !== 3) {
      return valor;
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  imprimir(): void {
    if (!this.lineas.length) {
      return;
    }

    emitirReporteTabla({
      titulo: 'Cruce stock vs ventas',
      empresa: this.parametros.NombreEmpresa,
      subtitulo:
        `Al abrir − vendido (+ otros) = esperado · Del ${this.formatearFecha(this.desde)} al ${this.formatearFecha(this.hasta)}`,
      nombreArchivo: `cruce-stock-${this.desde}_${this.hasta}`,
      kpis: [
        { label: 'Líneas', value: String(this.totalLineas) },
        { label: 'Unidades vendidas', value: pdfNumero(this.totalVendidos) },
        { label: 'Descuadres', value: String(this.totalDescuadres) }
      ],
      secciones: [{
        columnas: [
          { header: 'Cierre', width: 40 },
          { header: 'Producto', width: '*' },
          { header: 'Abrir', width: 45, align: 'right' },
          { header: 'Vend.', width: 40, align: 'right' },
          { header: 'Otros', width: 40, align: 'right' },
          { header: 'Esperado', width: 50, align: 'right' },
          { header: 'Cerrar', width: 45, align: 'right' },
          { header: 'Dif.', width: 40, align: 'right' },
          { header: 'OK', width: 30 }
        ],
        filas: this.lineas.map(item => [
          String(item.idCajaCierre),
          item.producto,
          pdfNumero(item.stockAlAbrir),
          pdfNumero(item.cantidadVendida),
          pdfNumero(item.otrosMovimientos),
          pdfNumero(item.stockEsperado),
          pdfNumero(item.stockAlCerrar),
          pdfNumero(item.diferencia),
          item.cuadra ? 'Sí' : 'No'
        ])
      }]
    });
  }
}
