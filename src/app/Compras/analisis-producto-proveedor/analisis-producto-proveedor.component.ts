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
        idProducto: p.idProducto,
        nombre: p.nombre
      }));
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

  seleccionarProducto(p: { idProducto: number; nombre: string }) {
    this.idProducto = p.idProducto;
    this.filtroProducto = p.nombre;
  }

  consultar() {
    if (!this.idProducto) {
      this.toast('Seleccione un producto');
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
        this.data = res;
        this.cargando = false;
        if (res.productoNombre) {
          this.filtroProducto = res.productoNombre;
        }
      },
      error: (e) => {
        this.cargando = false;
        this.data = null;
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

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color: 'dark' });
    await t.present();
  }
}
