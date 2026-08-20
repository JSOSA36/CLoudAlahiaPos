import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { productos } from 'src/app/models/productos';
import { categorias } from 'src/app/models/categorias';
import { ProductosService } from 'src/app/servicios/productos.service';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import {
  normalizarTipoComportamiento,
  TIPO_COMPORTAMIENTO,
  etiquetaTipoComportamiento
} from 'src/app/shared/tipo-comportamiento';
import { pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

type FiltroTipo = 'TODOS' | 'PRODUCTO' | 'SERVICIO';

@Component({
  selector: 'app-reporte-productos',
  templateUrl: './reporte-productos.component.html',
  styleUrls: ['./reporte-productos.component.scss'],
})
export class ReporteProductosComponent implements OnInit {
  lista: productos[] = [];
  categoriasMap = new Map<number, string>();
  filtro = '';
  filtroTipo: FiltroTipo = 'TODOS';
  soloActivos = true;
  cargando = false;

  readonly chips: { codigo: FiltroTipo; etiqueta: string }[] = [
    { codigo: 'TODOS', etiqueta: 'Todos' },
    { codigo: 'PRODUCTO', etiqueta: 'Productos' },
    { codigo: 'SERVICIO', etiqueta: 'Servicios' },
  ];

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(event?: any): void {
    this.cargando = !event;
    const idEmpresa = this.parametro.GetIdEmpresa();

    forkJoin({
      productos: this.productosService.GetProductos(idEmpresa),
      categorias: this.categoriasService.GetListadoCategorias(idEmpresa)
    }).subscribe({
      next: ({ productos: data, categorias: cats }) => {
        this.categoriasMap = new Map(
          (cats || []).map((c: categorias) => [Number(c.idCategoria), c.nombre || ''])
        );
        this.lista = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: async () => {
        this.cargando = false;
        event?.target?.complete?.();
        const t = await this.toastCtrl.create({
          message: 'No se pudo cargar el reporte de productos',
          color: 'danger',
          duration: 2500
        });
        t.present();
      }
    });
  }

  nombreCategoria(p: productos): string {
    const id = Number(p.idCategoria || 0);
    if (!id) return '—';
    return this.categoriasMap.get(id) || p.nombreCategoria || '—';
  }

  get filtrados(): productos[] {
    const q = this.filtro.trim().toLowerCase();
    return this.lista.filter(p => {
      if (this.soloActivos && !p.isActivo) return false;
      if (this.filtroTipo === 'PRODUCTO' && p.esServicio) return false;
      if (this.filtroTipo === 'SERVICIO' && !p.esServicio) return false;
      if (!q) return true;
      return [
        p.nombre,
        p.codigoBarra,
        this.nombreCategoria(p),
        p.tipoComportamiento
      ].some(v => (v || '').toLowerCase().includes(q));
    });
  }

  get resumen() {
    const filas = this.filtrados;
    const inventario = filas.filter(p =>
      !p.esServicio
      && normalizarTipoComportamiento(p.tipoComportamiento) === TIPO_COMPORTAMIENTO.INVENTARIO
    );
    const valorInventario = inventario.reduce(
      (s, p) => s + Number(p.precioCompra || 0) * Number(p.cantidad || 0),
      0
    );
    return {
      total: filas.length,
      productos: filas.filter(p => !p.esServicio).length,
      servicios: filas.filter(p => p.esServicio).length,
      valorInventario
    };
  }

  etiquetaTipo = etiquetaTipoComportamiento;

  exportarPdf(): void {
    if (!this.filtrados.length) {
      return;
    }
    emitirReporteTabla({
      titulo: 'Reporte de productos',
      empresa: this.parametro.NombreEmpresa,
      landscape: true,
      kpis: [
        { label: 'Registros', value: String(this.resumen.total) },
        { label: 'Productos', value: String(this.resumen.productos) },
        { label: 'Servicios', value: String(this.resumen.servicios) },
        { label: 'Valor inventario', value: pdfMoneda(this.resumen.valorInventario) }
      ],
      secciones: [{
        columnas: [
          { header: 'Código', width: 70 },
          { header: 'Nombre', width: '*' },
          { header: 'Tipo', width: 55 },
          { header: 'Comportamiento', width: 80 },
          { header: 'Categoría', width: 80 },
          { header: 'Existencia', width: 55, align: 'right' },
          { header: 'Costo', width: 55, align: 'right' },
          { header: 'Venta', width: 55, align: 'right' },
          { header: 'Estado', width: 50 }
        ],
        filas: this.filtrados.map(p => [
          p.codigoBarra || '—',
          p.nombre,
          p.esServicio ? 'Servicio' : 'Producto',
          this.etiquetaTipo(p.tipoComportamiento),
          this.nombreCategoria(p),
          pdfNumero(Number(p.cantidad || 0)),
          pdfNumero(Number(p.precioCompra || 0)),
          pdfNumero(Number(p.precioVenta || 0)),
          p.isActivo ? 'Activo' : 'Inactivo'
        ])
      }],
      nombreArchivo: 'Reporte_productos.pdf'
    });
  }
}
