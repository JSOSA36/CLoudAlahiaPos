import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';

import { ParametrosService } from '../servicios/parametros.service';
import { FacturaHeaderService } from '../servicios/factura-header.service';
import { FactDetalleService } from '../servicios/fact-detalle.service';
import { EmpleadosService } from '../servicios/empleados.service';
import { PrintService } from '../servicios/print.services';
import { productos } from '../models/productos';
import { facturaheader } from '../models/facturaheader';
import { facturadetalles } from '../models/facturadetalles';
import { Empleado } from '../models/empleado.models';

import { ClientesComponent } from '../Clientes/clientes/clientes.component';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {

  // ============================
  // DATA
  // ============================
  public ListadoProductos: productos[] = [];
  public ListadoEmpleados: Empleado[] = [];

  public TotalBruto = 0;
  public TotalDescuento = 0;
  public TotalNeto = 0;

  constructor(
    public parametro: ParametrosService,
    private router: Router,
    private facturaHeaderSrv: FacturaHeaderService,
    private factDetalleSrv: FactDetalleService,
    private empleadosService: EmpleadosService,
    private modal: ModalController,
    private printService: PrintService,

  ) {}

  // ============================
  // INIT
  // ============================
  ngOnInit() {
    this.cargarEmpleados();
    this.blindarPrecios();
    this.calcularTotales();
  }

  // ============================
  // EMPLEADOS (SOLO EMPLEADOS)
  // ============================
  cargarEmpleados() {
    this.empleadosService
      .getByEmpresa(this.parametro.GetIdEmpresa())
      .subscribe({
        next: (res) => {
          this.ListadoEmpleados = res || [];
        }
      });
  }

  // ============================
  // BLINDAJE PRECIOS
  // ============================
  private blindarPrecios() {
    this.parametro.ListadoProductosCate.forEach(p => {
      if (p.precioOriginal == null) {
        p.precioOriginal = p.precioVenta;
      }
    });
  }

  // ============================
  // CÁLCULO CENTRAL
  // ============================
  calcularTotales() {
    this.TotalBruto = 0;
    this.TotalDescuento = 0;
    this.TotalNeto = 0;
    this.parametro.Cart = 0;

    for (const p of this.parametro.ListadoProductosCate) {

      const precioOriginal = p.precioOriginal ?? p.precioVenta;
      const precioFinal = p.precioVenta;
      const cantidad = p._cantidad;

      const bruto = precioOriginal * cantidad;
      const descuento = Math.max(0, (precioOriginal - precioFinal)) * cantidad;

      this.TotalBruto += bruto;
      this.TotalDescuento += descuento;
      this.parametro.Cart += cantidad;
    }

    this.TotalNeto = this.TotalBruto - this.TotalDescuento;

    this.TotalNeto = this.TotalBruto - this.TotalDescuento;

// 🔴 ESTO FALTABA
this.parametro.Total = this.TotalNeto;

  }

  // ============================
  // ORDEN
  // ============================
  procesarOrden() {
    
    this.parametro.IdFacturaHeader === 0
      ? this.crearOrden()
      : this.editarOrden();
  }

  private crearOrden() {

    
    
    const header = new facturaheader();

    header.iDCliente =  this.parametro.IdCliente;
    header.moneda = this.parametro.Moneda;
    header.idEmpresa = this.parametro.GetIdEmpresa();
    header.idMesa = this.parametro.IdMesa;
    header.idMoso = this.parametro.IdUsuario;
    header.nombreCuenta = this.parametro.NombreCliente;
    header.nota = this.parametro.NombreCliente;
    header.idTipoDocumentos = 10;
    header.total = this.TotalNeto;

    this.parametro.ListadoProductosCate.forEach(p => {

      const precioOriginal = p.precioOriginal ?? p.precioVenta;
      const precioFinal = p.precioVenta;
      const descuentoUnit = Math.max(0, precioOriginal - precioFinal);

      const det = new facturadetalles();
      det.idProducto = p.idProducto;
      det.cantidad = p._cantidad;
      det.comentario = p.comentario;
      det.subTotal = precioFinal * p._cantidad;
      det.precioOferta = precioFinal;
      det.descuento = 0; // ✅ UNITARIO
      det.itbis = 0;
      det.idEmpresa = header.idEmpresa;
      det.idEmpleadoComision = p.idEmpleadoComision;

      header.facturaDetalles.push(det);
    });

    this.facturaHeaderSrv.Enviarorden(header).subscribe(() => {
      this.parametro.LoadListaFactura();
      this.limpiarCarrito();
    });
  }

  private editarOrden() {
    const detalles: facturadetalles[] = [];

    this.parametro.ListadoProductosCate.forEach(p => {

      const precioOriginal = p.precioOriginal ?? p.precioVenta;
      const precioFinal = p.precioVenta;
      const descuentoUnit = Math.max(0, precioOriginal - precioFinal);

      const det = new facturadetalles();
      det.idFacturaHeader = this.parametro.IdFacturaHeader;
      det.idProducto = p.idProducto;
      det.cantidad = p._cantidad;
      det.comentario = p.comentario;
      det.subTotal = precioFinal * p._cantidad;
      det.descuento = 0;
      det.itbis = 0;
      det.idEmpresa = this.parametro.GetIdEmpresa();
      det.idEmpleadoComision = p.idEmpleadoComision;

      detalles.push(det);
    });

    this.factDetalleSrv.EnviarItem(detalles).subscribe(() => {
      this.parametro.LoadListaFactura();
      this.limpiarCarrito();
      this.parametro.IdFacturaHeader = 0;
    });
  }

  // ============================
  // CARRITO UI
  // ============================
  aumentarCantidad(index: number) {
    this.parametro.ListadoProductosCate[index]._cantidad++;
    this.calcularTotales();
  }

  disminuirCantidad(index: number) {
    if (this.parametro.ListadoProductosCate[index]._cantidad <= 1) return;
    this.parametro.ListadoProductosCate[index]._cantidad--;
    this.calcularTotales();
  }

  removerItem(index: number) {
    this.parametro.ListadoProductosCate.splice(index, 1);
    this.calcularTotales();
  }

  // ============================
  // LIMPIEZA
  // ============================
  limpiarCarrito() {
    this.parametro.Cart = 0;
    this.parametro.ListadoProductosCate = [];
    this.parametro.ListadoProductoCategoria = [];
    this.TotalBruto = 0;
    this.TotalDescuento = 0;
    this.TotalNeto = 0;
    this.parametro.Total = 0;
  this.parametro.Cart = 0;
  this.parametro.ListadoProductosCate = [];
    this.router.navigateByUrl('/Ordenes');
  }

  // ============================
  // CLIENTES
  // ============================
  async openModalClientes() {
    this.parametro.Buscar = 'Buscar Clientes';
    const modal = await this.modal.create({
      component: ClientesComponent,
    });
    await modal.present();
  }
}
