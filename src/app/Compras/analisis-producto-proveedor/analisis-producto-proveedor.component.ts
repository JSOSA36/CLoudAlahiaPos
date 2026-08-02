import { Component, Input, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { AnalisisProductoProveedor } from 'src/app/models/compras.models';
import { Proveedor } from 'src/app/models/proveedores';
import { Almacen } from 'src/app/models/almacenes.model';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ProveedoresService } from 'src/app/servicios/proveedores.service';
import { AlmacenesService } from 'src/app/servicios/almacenes.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ProductosService } from 'src/app/servicios/productos.service';

@Component({
  selector: 'app-analisis-producto-proveedor',
  templateUrl: './analisis-producto-proveedor.component.html',
  styleUrls: ['./analisis-producto-proveedor.component.scss'],
})
export class AnalisisProductoProveedorComponent implements OnInit {
  /** Si se abre como modal desde ficha producto. */
  @Input() idProductoModal?: number;
  @Input() esModal = false;

  proveedores: Proveedor[] = [];
  almacenes: Almacen[] = [];
  productosOpciones: { idProducto: number; nombre: string }[] = [];

  idProducto?: number;
  idProveedor?: number;
  idAlmacen?: number;
  desde = '';
  hasta = '';
  filtroProducto = '';

  cargando = false;
  data: AnalisisProductoProveedor | null = null;

  sparkPoints: { x: number; y: number; precio: number }[] = [];
  sparkLine = '';
  sparkArea = '';
  sparkMin = 0;
  sparkMax = 0;

  constructor(
    private comprasService: ComprasService,
    private proveedoresService: ProveedoresService,
    private almacenesService: AlmacenesService,
    private productosService: ProductosService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
    private router: Router,
    @Optional() private modalCtrl: ModalController
  ) {
    const hoy = new Date();
    const haceUnAnio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
    this.hasta = hoy.toISOString().substring(0, 10);
    this.desde = haceUnAnio.toISOString().substring(0, 10);
  }

  ngOnInit(): void {
    const idEmpresa = this.parametro.GetIdEmpresa();
    this.proveedoresService.listar(idEmpresa).subscribe(d => this.proveedores = d || []);
    this.almacenesService.getAlmacenes(idEmpresa).subscribe(d => this.almacenes = d || []);
    this.productosService.GetProductos(idEmpresa).subscribe((d: any[]) => {
      this.productosOpciones = (d || []).map(p => ({
        idProducto: Number(p.idProducto ?? p.IdProducto ?? 0),
        nombre: String(p.nombre ?? p.Nombre ?? '')
      })).filter(p => p.idProducto > 0);
    });

    const qp = Number(this.route.snapshot.queryParamMap.get('idProducto'));
    if (this.idProductoModal) {
      this.idProducto = this.idProductoModal;
      this.consultar();
    } else if (qp > 0) {
      this.idProducto = qp;
      this.consultar();
    }
  }

  get productosFiltrados() {
    const q = (this.filtroProducto || '').trim().toLowerCase();
    if (!q) {
      return this.productosOpciones.slice(0, 40);
    }
    return this.productosOpciones
      .filter(p => (p.nombre || '').toLowerCase().includes(q))
      .slice(0, 40);
  }

  get tieneCompras(): boolean {
    return !!this.data && (
      (this.data.historial?.length || 0) > 0 ||
      (this.data.resumenProveedores?.length || 0) > 0 ||
      (this.data.indicadores?.vecesComprado || 0) > 0
    );
  }

  get ahorroVsPeor(): number | null {
    const mejor = this.data?.indicadores?.mejorPrecio;
    const peor = this.data?.indicadores?.peorPrecio;
    if (mejor == null || peor == null || peor <= mejor) {
      return null;
    }
    return peor - mejor;
  }

  onProductoTyping() {
    this.idProducto = undefined;
    this.data = null;
    this.resetSpark();
  }

  seleccionarProducto(p: { idProducto: number; nombre: string }) {
    this.idProducto = p.idProducto;
    this.filtroProducto = p.nombre;
  }

  limpiarProducto() {
    this.idProducto = undefined;
    this.filtroProducto = '';
    this.data = null;
    this.resetSpark();
  }

  consultar() {
    if (!this.idProducto) {
      this.toast('Seleccione un producto de la lista');
      return;
    }

    this.cargando = true;
    this.comprasService.analisisProductoProveedor(this.parametro.GetIdEmpresa(), {
      idProducto: Number(this.idProducto),
      idProveedor: this.idProveedor ? Number(this.idProveedor) : undefined,
      idAlmacen: this.idAlmacen ? Number(this.idAlmacen) : undefined,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined
    }).subscribe({
      next: (res) => {
        this.data = {
          ...res,
          indicadores: res.indicadores || {
            vecesComprado: 0,
            cantidadTotal: 0,
            mayorCantidad: 0
          },
          resumenProveedores: res.resumenProveedores || [],
          historial: res.historial || [],
          evolucionPrecio: res.evolucionPrecio || []
        };
        this.buildSpark(this.data.evolucionPrecio || []);
        this.cargando = false;
        if (res.productoNombre) {
          this.filtroProducto = res.productoNombre;
        }
      },
      error: (e) => {
        this.cargando = false;
        this.data = null;
        this.resetSpark();
        this.toast(e?.error?.message || 'Error en análisis de compras');
      }
    });
  }

  volver() {
    this.router.navigate(['/compras/facturas']);
  }

  cerrarModal() {
    this.modalCtrl?.dismiss();
  }

  private buildSpark(
    evolucion: { fecha: string; precioUnitario: number }[]
  ) {
    const pts = (evolucion || [])
      .map(e => Number(e.precioUnitario))
      .filter(n => Number.isFinite(n));

    if (pts.length < 2) {
      this.resetSpark();
      if (pts.length === 1) {
        this.sparkMin = pts[0];
        this.sparkMax = pts[0];
      }
      return;
    }

    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const w = 320;
    const h = 90;
    const pad = 8;

    this.sparkMin = min;
    this.sparkMax = max;
    this.sparkPoints = pts.map((precio, i) => {
      const x = pad + (i * (w - pad * 2)) / (pts.length - 1);
      const y = pad + (1 - (precio - min) / span) * (h - pad * 2);
      return { x, y, precio };
    });

    this.sparkLine = this.sparkPoints.map(p => `${p.x},${p.y}`).join(' ');
    const first = this.sparkPoints[0];
    const last = this.sparkPoints[this.sparkPoints.length - 1];
    this.sparkArea =
      `M ${first.x},${h} L ${this.sparkLine.replace(/ /g, ' L ')} L ${last.x},${h} Z`;
  }

  private resetSpark() {
    this.sparkPoints = [];
    this.sparkLine = '';
    this.sparkArea = '';
    this.sparkMin = 0;
    this.sparkMax = 0;
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color: 'dark' });
    await t.present();
  }
}
