import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { PrinterComponent } from 'src/app/printer/printer.component';
import { IonModal, ModalController,AlertController,IonSearchbar } from '@ionic/angular';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { ProductosService } from 'src/app/servicios/productos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { Router } from '@angular/router';
import { DescuentoHeaderService } from 'src/app/servicios/descuento-header.service';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { ParametroConfigService } from 'src/app/servicios/parametrosconfig.service';
import { categorias } from 'src/app/models/categorias';
import { productos } from 'src/app/models/productos';
import { CuentaxPagarComponent } from 'src/app/CuentaxPagar/cuentax-pagar/cuentaxpagar.component';
import { Empleado } from 'src/app/models/empleado.models';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { PrintService } from 'src/app/servicios/print.services';
import { ClienteVozComponent } from 'src/app/modals/cliente-voz/cliente-voz.component';
import { RncCLienteDGIIService }
from '../../servicios/RncCLienteDGII.services';
import { CajaAperturaService }
from 'src/app/servicios/caja-apertura.service';
import { CuentaPorCobrarComponent } from 'src/app/CuentaPorCobrar/cuenta-por-cobrar/cuentaxcobrar.component';
import { AperturaCajaComponent } from 'src/app/Components/apertura-caja/apertura-caja.component';
import { facturaheader } from 'src/app/models/facturaheader';
import { facturadetalles } from 'src/app/models/facturadetalles';
type ItemCarrito = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;

  precioBase?: number;
  itbisProducto?: number;
  
  idEmpleadoComision?: number;
};

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent implements OnInit {

  @ViewChild('cartIcon', { static: false }) cartIcon!: ElementRef;
  @ViewChild('cartItems') cartItems!: ElementRef;
  @ViewChild('catsScroller', { static: false }) catsScroller!: ElementRef;
  @ViewChild('posSearch') posSearch!: IonSearchbar;

  
  categorias: categorias[] = [];
  productos: productos[] = [];
  productosFiltrados: productos[] = [];
facturarITBIS: boolean = false;
precioIncluyeITBIS: boolean = false;
descuentoTipo: 'PORCENTAJE' | 'MONTO' = 'MONTO';

descuentoValor = 0;

montoDescuento = 0;
tasaITBIS: number = 0.18;
aplicarITBIS: boolean = true;
  public ListadoEmpleados: Empleado[] = [];

  busqueda = '';
  codigoBusqueda: string = '';
  categoriaSeleccionada: string = '';
  indiceSeleccionado = 0;

  tipoOrden: 'Llevar' | 'ComerAqui' | 'Delivery' | 'DeliveryExterno' = 'Llevar';
  tipoDocumento: 'Factura' | 'Orden' | 'Cotizacion' = 'Factura';
 tipoComprobante:
  "FACT"
  | "Crédito Fiscal"
  | "Consumidor Final"
= "FACT";
  comisionEmpleado: boolean = false;
  carrito: ItemCarrito[] = [];


tipoPago: 'CONTADO' | 'CREDITO' = 'CONTADO';

tipoServicio: 'LOCAL' | 'DELIVERY' | 'LLEVAR' = 'LOCAL';
  searchOpen = false;
  mostrarSearch = true;
  catsOpen = true;
  isCartOpen = false;
  mostrarPanel = false;
carritoModal = false;
estadoRnc = '';

mensajeRnc = '';

rncFiscal = '';

nombreFiscal = '';
  // Totales
  subtotalProductos: number = 0;
  montoItbis: number = 0;
  montoPropina: number = 0;
  imprimirOrden: boolean = false;
cantidadCopiasOrden: number = 1;
  total: number = 0;
clienteSeleccionado: any = null;
/* =====================================
🔥 CONFIG POS
===================================== */

usaCotizaciones: boolean = false;

usaOrdenes: boolean = false;

facturacionElectronica: boolean = false;
  // Toggles header carrito
 
  aplicarPropina: boolean = false;

  constructor(
    private _categoriaService: CategoriasService,
    private _productoService: ProductosService,
    public parametro: ParametrosService,
    private descuentoSrv: DescuentoHeaderService,
    private empleadosService: EmpleadosService,
    private alertCtrl: AlertController,
    private parametroConfigService: ParametroConfigService,
     private modal: ModalController,
     private router: Router,
     private _printService: PrintService,
     private _FacturaHeader: FacturaHeaderService,
      private rncService: RncCLienteDGIIService,
      private _CajaApertura:
  CajaAperturaService,
  ) {

    
    this.cargarEmpleados();
    this.cargarParametrosPOS();
    //this.iirAImpresion();
  }
  abrirPanel() {
  this.mostrarPanel = true;
}
cerrarPanel() {
  this.mostrarPanel = false;
}
  async abrirClientes() {

  const modal = await this.modal.create({
    component: ClienteVozComponent,
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  console.log("🔍 DATA RECIBIDA:", data);

  // soporta ambos formatos
  const cliente = data?.cliente ?? data;

  if (!cliente) {
    console.warn("⚠️ No se recibió cliente.");
    return;
  }

  console.log("✅ Cliente seleccionado:", cliente);

  // 🔥 AQUÍ ES LO IMPORTANTE
  this.clienteSeleccionado = {
    id: cliente.idCliente,
    nombre: cliente.nombreComercial
  };

}
  abrirCarrito(){
  this.carritoModal = true;
}
setITBIS(valor: boolean) {
  this.aplicarITBIS = valor;
  this.recalcularTotales();
}
cerrarCarrito(){
  this.carritoModal = false;
}
iirAImpresion() {
  this.router.navigate(['/printer']);
}
getTextoBoton(): string {

  switch (this.tipoDocumento) {

    case 'Orden':
      return 'Guardar';

    case 'Cotizacion':
      return 'Imprimir';

    case 'Factura':
      return 'Cobrar';

    default:
      return 'Continuar';
  }
}
consultarRnc() {

  if (!this.rncFiscal)
    return;

  // 🔥 LOADING
  this.estadoRnc = 'loading';

  this.mensajeRnc =
    '🔍 Consultando DGII...';

  this.rncService
    .consultarRnc(this.rncFiscal)
    .subscribe({

      next: (resp) => {

        console.log(
          'Cliente DGII:',
          resp
        );

        // 🔥 SETEAR
        this.nombreFiscal =
          resp.nombre;

        // 🔥 SUCCESS
        this.estadoRnc =
          'success';

        this.mensajeRnc =
          '✔ RNC encontrado correctamente';
      },

      error: (err) => {

        console.error(
          'RNC no encontrado',
          err
        );

        // 🔥 LIMPIAR
        this.nombreFiscal = '';

        // 🔥 ERROR
        this.estadoRnc =
          'error';

        this.mensajeRnc =
          '✖ RNC no encontrado en DGII';
      }
    });
}
cargarParametrosPOS() {

  const idEmpresa =
    this.parametro.GetIdEmpresa();

  this.parametroConfigService
    .getParametrosEmpresa(idEmpresa)

    .subscribe((params: any[]) => {

      // =====================================
      // 🔥 ITBIS
      // =====================================

      const facturar = params.find(
        x => x.clave === 'FACTURAR_CON_ITBIS'
      );

      const incluye = params.find(
        x => x.clave === 'PRECIO_INCLUYE_ITBIS'
      );

      // =====================================
      // 🔥 COMISIONES
      // =====================================

      const comision = params.find(
        x => x.clave === 'COMISION_EMPLEADO'
      );

      // =====================================
      // 🔥 POS
      // =====================================

      const usaCotizaciones = params.find(
        x => x.clave === 'USA_COTIZACIONES'
      );

      const usaOrdenes = params.find(
        x => x.clave === 'USAS_ORDENES'
      );

      const facturaElectronica = params.find(
        x => x.clave === 'FACTURACION_ELECTRONICA'
      );

      // =====================================
      // 🔥 IMPRESIÓN DE ÓRDENES
      // =====================================

      const imprimirOrden = params.find(
        x => x.clave === 'IMPRIMIR_ORDEN'
      );

      const cantidadCopiasOrden = params.find(
        x => x.clave === 'CANTIDAD_COPIAS_ORDEN'
      );

      // =====================================
      // 🔥 ASIGNAR
      // =====================================

      this.facturarITBIS =
        facturar?.valor === 'true';

      this.precioIncluyeITBIS =
        incluye?.valor === 'true';

      this.comisionEmpleado =
        comision?.valor === 'true';

      this.usaCotizaciones =
        usaCotizaciones?.valor === 'true';

      this.usaOrdenes =
        usaOrdenes?.valor === 'true';

      this.facturacionElectronica =
        facturaElectronica?.valor === 'true';

      // =====================================
      // 🔥 IMPRESIÓN
      // =====================================

      this.imprimirOrden =
        imprimirOrden?.valor === 'true';

      this.cantidadCopiasOrden =
        Number(cantidadCopiasOrden?.valor ?? 1);

      // =====================================
      // 🔥 LOG
      // =====================================

      console.log('ITBIS activo:', this.facturarITBIS);

      console.log('Precio incluye ITBIS:', this.precioIncluyeITBIS);

      console.log('Comisión empleado:', this.comisionEmpleado);

      console.log('Usa Cotizaciones:', this.usaCotizaciones);

      console.log('Usa Ordenes:', this.usaOrdenes);

      console.log('Facturación Electrónica:', this.facturacionElectronica);

      console.log('Imprimir Orden:', this.imprimirOrden);

      console.log('Cantidad Copias Orden:', this.cantidadCopiasOrden);

    });
}
  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductos();
  
    this.recalcularTotales();
    this.validarCajaAbierta();
  }

 
async validarCajaAbierta(){

  this._CajaApertura
  .getCajaAbierta(

    this.parametro
    .GetIdEmpresa(),

    this.parametro
    .IdUsuario

  )
  .subscribe({

    next: async (caja:any)=>{

      console.log(
        'CAJA ABIERTA:',
        caja
      );

      /* =====================================
      🔥 YA EXISTE
      ====================================== */

      if(caja){

        localStorage.setItem(
          'CAJA_ABIERTA',
          'true'
        );

        localStorage.setItem(

          'ID_CAJA_APERTURA',

          String(
            caja.idCajaApertura
          )
        );

        console.log(
          'Caja ya abierta'
        );

        return;
      }

      /* =====================================
      🔥 NO EXISTE
      ====================================== */

      const modal =
        await this.modal.create({

          component:
            AperturaCajaComponent,

          backdropDismiss:false,

          cssClass:
            'modal-apertura-caja'
        });

      await modal.present();

      const { data } =
        await modal.onDidDismiss();

      if(data){

        console.log(
          'APERTURA:',
          data
        );
      }
    },

    error:(err)=>{

      console.error(
        'ERROR VALIDANDO CAJA:',
        err
      );
    }
  });
}
  toggleSearch() {
    this.mostrarSearch = !this.mostrarSearch;
  }

  cargarEmpleados() {
    this.empleadosService
      .getByEmpresa(this.parametro.GetIdEmpresa())
      .subscribe({
        next: (res) => {
          this.ListadoEmpleados = res || [];
          console.log('Empleados cargados:', this.ListadoEmpleados);
        }
      });
  }
async openModalCobro() {


  
  if (!this.carrito.length) return;

  // =====================================
  // 🔥 ORDEN → GUARDAR DIRECTO
  // =====================================

  if (this.tipoDocumento === 'Orden') {

    const header = new facturaheader();
header.idFacturaHeader =
  this.parametro.IdFacturaHeader;
    header.iDCliente =
      this.clienteSeleccionado?.id || 0;

    header.moneda =
      this.parametro.Moneda;

    header.idEmpresa =
      this.parametro.IdEmpresa;

    header.idMesa = 1;

    header.idMoso =
      this.parametro.IdUsuario;

    header.nombreCuenta =
      this.clienteSeleccionado?.nombre || 'Al Portador';

    header.nota =
      this.clienteSeleccionado?.nombre || '';

    header.idTipoDocumentos = 10;

    header.total = this.total;

    this.carrito.forEach(item => {

      const det = new facturadetalles();

      det.idProducto =
        item.idProducto;

      det.cantidad =
        item.cantidad;
      det.idEmpleadoComision= item.idEmpleadoComision || 0,
      det.subTotal =
        item.subtotal;

      det.precioOferta =
        item.precioBase ?? item.precio;

      det.descuento = 0;

      det.itbis =
        item.itbisProducto || 0;

      det.idEmpresa =
        this.parametro.IdEmpresa;

      det.idEmpleadoComision =
        item.idEmpleadoComision || 0;

      header.facturaDetalles.push(det);

    });

    console.log(
      '📦 ORDEN:',
      header
    );

    this._FacturaHeader
      .Enviarorden(header)
      .subscribe({

       next: (resp: any) => {

  console.log(
    '✅ Orden guardada:',
    resp
  );
this.resetPOS();
  // =====================================
  // 🔥 OBTENER ID DE LA ORDEN
  // =====================================

  const idOrden =
    resp?.idFacturaHeader ??
    resp?.idFactura ??
    resp?.id ??
    resp;

  // =====================================
  // 🔥 IMPRIMIR SEGÚN PARÁMETROS
  // =====================================
console.log("IMPRIMIR_ORDEN:", this.imprimirOrden);
console.log("COPIAS:", this.cantidadCopiasOrden);
console.log("ID ORDEN:", idOrden);
  if (
    this.imprimirOrden &&
    idOrden
  ) {
if (this.imprimirOrden && idOrden) {

  console.log("🔥 ENTRÓ A IMPRIMIR");

  
}
    for (
      let i = 0;
      i < this.cantidadCopiasOrden;
      i++
    ) {

      this._printService
        .printTicket(
          idOrden,
          this.parametro.IdEmpresa
        )
        .subscribe({

          next: () => {


          
            console.log(
              `🖨️ Copia ${i + 1} enviada`
            );

          },

          error: (err) => {

            console.error(
              '❌ Error imprimiendo orden:',
              err
            );

          }

        });

    }

  }

  // =====================================
  // 🔥 LIMPIAR POS
  // =====================================

 

},

        error: (err) => {

          console.error(
            '❌ Error guardando orden:',
            err
          );
        }
      });

    return;
  }

  // =====================================
  // 🔥 SOLO FACTURA LLEGA AQUÍ
  // =====================================

  const modal = await this.modal.create({
    component: CuentaxPagarComponent,
    cssClass: 'modal-factura-full',
    componentProps: {
      Items: this.carrito,
      Subtotal: this.subtotalProductos,
      Itbis: this.montoItbis,
      TotalFactura: this.total
    }
  });

  await modal.present();

  const { data, role } = await modal.onDidDismiss();

  if (role === 'ok') {

    console.log("💰 Data modal:", data);

    if (!data?.pagos || data.pagos.length === 0) {
      console.warn("⚠️ No hay pagos");
      return;
    }

    const facturaDTO = this.armarFacturaDTO(data);

    console.log("📦 DTO listo:", facturaDTO);

    this._FacturaHeader
      .createFacturaDirecta(facturaDTO)

      .subscribe({

        next: (resp: any) => {

          console.log(
            "✅ Factura creada:",
            resp
          );
this.resetPOS();
          // =====================================
          // 🔥 IMPRIMIR
          // =====================================

          const idFactura =

            resp?.idFactura ||
            resp?.id ||
            resp;

          if (idFactura) {

            this._printService
              .printTicket(

                idFactura,

                this.parametro.IdEmpresa
              )

              .subscribe({

                next: () => {

                  console.log(
                    "🖨️ Ticket enviado"
                  );
                },

                error: (err) => {

                  console.error(
                    "❌ Error imprimiendo",
                    err
                  );
                }
              });
          }

          // =====================================
          // 🔥 LIMPIAR
          // =====================================

         

this.parametro.IdFacturaHeader = 0;
        },

        error: (err) => {

          console.error(
            "❌ Error creando factura:",
            err
          );
        }
      });
  }
    
}
private resetPOS() {

  // Carrito
  this.carrito = [];
  this.recalcularTotales();

  // Cliente
  this.clienteSeleccionado = null;

  // Documento
  this.tipoDocumento = 'Factura';
  this.tipoPago = 'CONTADO';
  this.tipoComprobante = 'FACT';
  this.tipoOrden = 'Llevar';

  // Fiscal
  this.rncFiscal = '';
  this.nombreFiscal = '';
  this.estadoRnc = '';
  this.mensajeRnc = '';

  // Descuentos
  this.descuentoValor = 0;
  this.montoDescuento = 0;
  this.descuentoTipo = 'MONTO';

  // Parámetros temporales
  this.parametro.IdFacturaHeader = 0;

  // Recargar
  
}
cargarOrdenEnPOS(orden: any) {

  console.log("🧾 Orden recibida:", orden);

  // 🔥 HEADER
  this.tipoDocumento = orden.tipoDocumento || 'Orden';
  this.tipoOrden = orden.tipoOrden || 'Llevar';
  this.tipoPago = orden.tipoFactura || 'CONTADO';
this.parametro.IdFacturaHeader =
  orden.idFacturaHeader;
  // 🔥 CLIENTE
  this.clienteSeleccionado = {
    id: orden.idCliente,
    nombre: orden.clientes?.nombreComercial || 'Al Portador'
  };

  // 🔥 LIMPIAR CARRITO
  this.carrito = [];

  // 🔥 MAPEAR ITEMS
  (orden.facturaDetalles || []).forEach((d: any) => {

    this.carrito.push({
      idProducto: d.idProducto,
      nombre: d.productos?.nombre,
      cantidad: d.cantidad,
      precio: d.precioOferta || d.precio,
      precioBase: d.precioOferta || d.precio,
      itbisProducto: d.itbis,
      idEmpleadoComision: d.idEmpleadoComision || 0,
      subtotal: d.subTotal
    });

  });

  this.recalcularTotales();
}
async abrirOrdenesModal() {

  const modal = await this.modal.create({
    component: CuentaPorCobrarComponent,
    cssClass: 'modal-fullscreen',
    componentProps: {
      modo: 'seleccionar' ,// 🔥 CLAVE
        esModal: true
    }
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  if (data?.ordenSeleccionada) {
    this.cargarOrdenEnPOS(data.ordenSeleccionada);
  }
}
private armarFacturaDTO(dataModal: any) {

  const idTipoDocumento =
    this.tipoDocumento === 'Factura'
      ? 1
      : this.tipoDocumento === 'Orden'
      ? 10
      : 14;

  return {
    header: {
      idEmpresa: this.parametro.IdEmpresa,
      idUsuario: this.parametro.IdUsuario,

      idCliente: this.clienteSeleccionado?.id || null,

      rnc: this.rncFiscal || null,
      nombreEmpresa: this.nombreFiscal || null,
 idFacturaHeader:
    this.parametro.IdFacturaHeader,
      idMoso: 1,

      // 🔥 AGREGAR ESTO
      idTipoDocumentos: idTipoDocumento,

      tipoDocumento: this.tipoDocumento,
      tipoComprobante: this.tipoComprobante,
      tipoOrden: this.tipoOrden,
      tipoPago: dataModal.tipoFactura,

      subTotal: this.subtotalProductos,
      totalDescuento: this.montoDescuento,   // 👈 AGREGAR ESTA LÍNEA
      totalItbis: this.montoItbis,
      montoPropina: this.montoPropina,
      total: this.total,

      printPending: dataModal.imprimir,

      facturaDetalles: this.carrito.map(item => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        idEmpleadoComision: item.idEmpleadoComision || 0,
        precioOferta: item.precioBase ?? item.precio,
        itbis: item.itbisProducto ?? 0
      }))
    },

    pagos: dataModal.pagos.map((p: any) => ({
      metodo: p.metodo,
      monto: p.monto
    }))
  };
}
onTipoComprobanteChange() {

  // 🔥 FACT
  if (
    this.tipoComprobante ===
    'FACT'
  ) {

    this.aplicarITBIS =
      false;
  }

  // 🔥 FISCAL
  else {

    this.aplicarITBIS =
      true;
  }

  // 🔥 RECALCULAR
  this.recalcularTotales();
}
recalcularTotales() {

  const usarITBIS =
    this.facturarITBIS &&
    this.aplicarITBIS;

  // =====================================
  // 🔥 RECALCULAR CADA ITEM
  // =====================================

  this.carrito.forEach(item => {

    const precioBase =
      item.precioBase ?? item.precio;

    if (usarITBIS) {

      item.itbisProducto =
        +(precioBase * this.tasaITBIS).toFixed(2);

      const precioFinal =
        +(precioBase + item.itbisProducto).toFixed(2);

      item.subtotal =
        +(precioFinal * item.cantidad).toFixed(2);

    }
    else {

      item.itbisProducto = 0;

      item.subtotal =
        +(precioBase * item.cantidad).toFixed(2);

    }

  });

  // =====================================
  // 🔥 SUBTOTAL
  // =====================================

  this.subtotalProductos =
    +this.carrito.reduce((sum, item) => {

      return sum +
        ((item.precioBase ?? item.precio) * item.cantidad);

    }, 0).toFixed(2);

  // =====================================
  // 🔥 DESCUENTO
  // =====================================

  if (this.descuentoTipo === 'PORCENTAJE') {

    this.montoDescuento =
      +(
        this.subtotalProductos *
        (this.descuentoValor / 100)
      ).toFixed(2);

  }
  else {

    this.montoDescuento =
      +this.descuentoValor.toFixed(2);

  }

  // Nunca permitir un descuento mayor al subtotal
  if (
    this.montoDescuento >
    this.subtotalProductos
  ) {

    this.montoDescuento =
      this.subtotalProductos;

  }

  // =====================================
  // 🔥 ITBIS
  // =====================================

  this.montoItbis =
    usarITBIS
      ? +this.carrito.reduce((sum, item) => {

          return sum +
            ((item.itbisProducto ?? 0) * item.cantidad);

        }, 0).toFixed(2)
      : 0;

  // =====================================
  // 🔥 PROPINA
  // =====================================

  this.montoPropina =
    this.aplicarPropina
      ? +(this.subtotalProductos * 0.10).toFixed(2)
      : 0;

  // =====================================
  // 🔥 TOTAL
  // =====================================

  this.total =
    usarITBIS
      ? +(
          this.subtotalProductos +
          this.montoItbis +
          this.montoPropina -
          this.montoDescuento
        ).toFixed(2)
      : +(
          this.subtotalProductos +
          this.montoPropina -
          this.montoDescuento
        ).toFixed(2);

}

  onToggleItbis() {
    this.recalcularTotales();
  }

  onTogglePropina() {
    this.recalcularTotales();
  }

  @HostListener('window:keydown', ['$event'])
  manejarTeclas(ev: KeyboardEvent) {
    if (!this.productosFiltrados?.length) return;

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        if (this.indiceSeleccionado < this.productosFiltrados.length - 1) {
          this.indiceSeleccionado++;
        }
        break;

      case 'ArrowUp':
        ev.preventDefault();
        if (this.indiceSeleccionado > 0) {
          this.indiceSeleccionado--;
        }
        break;

      case 'Enter':
        if (this.busqueda?.trim()) {
          ev.preventDefault();
          this.procesarEnter();
        }
        break;
    }
  }

  procesarEnter() {
    const producto = this.productos.find(p => p.codigoBarra === this.busqueda);

    if (producto) {
      this.addToCart(producto);
      this.busqueda = '';
      this.productosFiltrados = [];
      return;
    }

    if (this.productosFiltrados.length > 0) {
      const prod = this.productosFiltrados[this.indiceSeleccionado];
      this.addToCart(prod);
      this.busqueda = '';
      this.productosFiltrados = [];
    }
  }

  cargarCategorias() {
    this._categoriaService
      .GetCategoriaVenta(this.parametro.GetIdEmpresa())
      .subscribe((res: categorias[]) => {
        this.categorias = (res || []).filter(c => c.isActiva);

        if (this.categorias.length > 0) {
          this.categoriaSeleccionada = this.categorias[0].nombre;
          this.filtrarPorCategoria();
        }
      });
  }

  limpiarBusqueda() {
    this.busqueda = '';
    this.productosFiltrados = [...this.productos];
    this.indiceSeleccionado = 0;
  }

 cargarProductos() {

  this._productoService
    .GetListadoProductosVenta(

      this.parametro.IdEmpresa
    )
    .subscribe({

      next: (res: productos[]) => {

        const lista: productos[] =
          res ?? [];

        /* =====================================
        🔥 DESCUENTOS
        ====================================== */

        lista.forEach(p => {

          this.aplicarDescuentoProducto(p);
        });

        /* =====================================
        🔥 ASIGNAR LISTA
        ====================================== */

        this.productos =
          lista;

        /* =====================================
        🔥 FILTRAR POR CATEGORÍA
        ====================================== */

        if(
          this.categoriaSeleccionada
        )
        {
          this.filtrarPorCategoria();
        }
        else
        {
          this.productosFiltrados =
            [...lista];
        }

        /* =====================================
        🔥 RESET ÍNDICE
        ====================================== */

        this.indiceSeleccionado =
          0;

        console.log(

          'Productos cargados:',

          this.productos.length
        );
      },

      error: (err) => {

        console.error(

          'Error cargando productos',

          err
        );

        this.productos = [];

        this.productosFiltrados = [];
      }
    });
}

  aplicarDescuentoProducto(prod: productos) {
    const idArea = prod.idArea || 0;

    this.descuentoSrv.getAplicado(
      this.parametro.IdEmpresa,
      prod.idProducto,
      idArea
    )
    .subscribe(resp => {
      if (!resp || !resp.aplica) return;

      if ((prod as any)._precioOriginal == null) {
        (prod as any)._precioOriginal = prod.precioVenta;
      }

      const original = (prod as any)._precioOriginal;
      let nuevoPrecio = original;

      if (resp.tipo === 'PORCENTAJE') {
        nuevoPrecio = original - (original * resp.valor / 100);
      }

      if (resp.tipo === 'MONTO') {
        nuevoPrecio = original - resp.valor;
      }

      if (nuevoPrecio < 0) {
        nuevoPrecio = 0;
      }

      (prod as any)._descuentoTipo = resp.tipo;
      (prod as any)._descuentoValor = resp.valor;

      prod.precioVenta = nuevoPrecio;
    });
  }

  seleccionarProductoMouse(producto: productos) {
    this.addToCart(producto);
    this.busqueda = '';
    this.productosFiltrados = [];
  }

  selectCategoria(cat: categorias) {
    this.categoriaSeleccionada = cat.nombre;
    this.busqueda = '';
    this.filtrarPorCategoria();
  }

  private filtrarPorCategoria() {
    const categoria = this.categorias.find(c => c.nombre === this.categoriaSeleccionada);
    if (!categoria) return;

    this.productosFiltrados = this.productos.filter(
      p => p.idCategoria === categoria.idCategoria
    );

    this.indiceSeleccionado = 0;
  }

  private normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  buscarGlobal() {
    const texto = (this.busqueda || '').trim();

    if (!texto) {
      this.productosFiltrados = [...this.productos];
      this.indiceSeleccionado = 0;
      return;
    }

    const q = this.normalize(texto);

    this.productosFiltrados = this.productos.filter(p => {
      const nombre = this.normalize(p.nombre || '');
      const codigo = this.normalize(p.codigoBarra || '');
      return nombre.includes(q) || codigo.includes(q);
    });

    this.indiceSeleccionado = 0;
  }

addToCart(
  prod: productos,
  event?: MouseEvent
) {

  // =====================================
  // 🔥 VALIDAR EXISTENCIA
  // =====================================

 // =====================================
// 🔥 VALIDAR EXISTENCIA
// =====================================

if (
    prod.controlarStock &&
    !prod.esServicio &&
    prod.cantidad <= 0
) {

  this.alertCtrl.create({

    header: 'Producto agotado',

    message:
      `El producto ${prod.nombre} no tiene existencia disponible.`,

    buttons: ['Aceptar']

  }).then(a => a.present());

  return;
}

  // =====================================
  // 🔥 ANIMACIÓN
  // =====================================

  if (event) {
    const card = event.currentTarget as HTMLElement;
    this.animarAlCarrito(card);
  }

  // =====================================
  // 🔥 PRECIO VENTA
  // =====================================

  const precioVenta = prod.precioVenta;

  // =====================================
  // 🔥 PRODUCTO TIENE ITBIS
  // =====================================

  const productoTieneITBIS = prod.itbis === true;

  // =====================================
  // 🔥 USAR ITBIS
  // =====================================

  const usarITBIS =
    productoTieneITBIS &&
    this.facturarITBIS &&
    this.aplicarITBIS;

  // =====================================
  // 🔥 PRECIO BASE
  // =====================================

  let precioBase = usarITBIS
    ? +(precioVenta / (1 + this.tasaITBIS)).toFixed(2)
    : precioVenta;

  // =====================================
  // 🔥 ITBIS PRODUCTO
  // =====================================

  let itbisProducto = usarITBIS
    ? +(precioVenta - precioBase).toFixed(2)
    : 0;

  // =====================================
  // 🔥 PRECIO FINAL
  // =====================================

  let precioFinal = precioVenta;

  // =====================================
  // 🔥 BUSCAR ITEM
  // =====================================

  const item = this.carrito.find(
    i => i.idProducto === prod.idProducto
  );

  // =====================================
  // 🔥 YA EXISTE EN CARRITO
  // =====================================

  if (item) {

    // VALIDAR EXISTENCIA
    if (item.cantidad >= prod.cantidad) {

      this.alertCtrl.create({
        header: 'Existencia insuficiente',
        message: `Solo hay ${prod.cantidad} unidad(es) disponibles de ${prod.nombre}.`,
        buttons: ['Aceptar']
      }).then(a => a.present());

      return;
    }

    item.cantidad++;

    item.subtotal = +(
      item.cantidad * precioFinal
    ).toFixed(2);

    this.recalcularTotales();

    return;
  }

  // =====================================
  // 🔥 NUEVO ITEM
  // =====================================

  this.carrito.push({

    idProducto: prod.idProducto,

    idEmpleadoComision:
      prod.idEmpleadoComision || 0,

    nombre: prod.nombre,

    // 🔥 PRECIO BASE
    precio: precioBase,

    cantidad: 1,

    // 🔥 SUBTOTAL
    subtotal: +precioFinal.toFixed(2),

    precioBase: precioBase,

    itbisProducto: itbisProducto
  });

  this.recalcularTotales();
}
  animarAlCarrito(card: HTMLElement) {
    const carrito = this.cartItems?.nativeElement as HTMLElement;
    if (!carrito) return;

    const start = card.getBoundingClientRect();
    const end = carrito.getBoundingClientRect();

    const clone = card.cloneNode(true) as HTMLElement;

    clone.style.position = 'fixed';
    clone.style.left = start.left + 'px';
    clone.style.top = start.top + 'px';
    clone.style.width = start.width + 'px';
    clone.style.height = start.height + 'px';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.transition = 'transform .6s cubic-bezier(.4,-0.3,.6,1.5), opacity .6s';

    document.body.appendChild(clone);

    const deltaX = end.left - start.left;
    const deltaY = end.top - start.top;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(.25)`;
      clone.style.opacity = '0.2';
    });

    setTimeout(() => clone.remove(), 600);
  }

 async inc(item: ItemCarrito) {

  // Buscar el producto original
  const producto = this.productos.find(
    p => p.idProducto === item.idProducto
  );

  // Si no existe en memoria
  if (!producto) {

    item.cantidad++;

    item.subtotal =
      +(item.cantidad * item.precio).toFixed(2);

    this.recalcularTotales();

    return;
  }

  // =====================================
  // 🔥 VALIDAR STOCK
  // =====================================

  if (
      producto.controlarStock &&
      !producto.esServicio &&
      item.cantidad >= producto.cantidad
  ) {

    const alert = await this.alertCtrl.create({

      header: 'Existencia insuficiente',

      message:
        `Solo hay ${producto.cantidad} unidad(es) disponibles de ${producto.nombre}.`,

      buttons: ['Aceptar']
    });

    await alert.present();

    return;
  }

  // =====================================
  // 🔥 AUMENTAR
  // =====================================

  item.cantidad++;

  item.subtotal =
    +(item.cantidad * item.precio).toFixed(2);

  this.recalcularTotales();
}

  dec(item: ItemCarrito) {
    item.cantidad--;

    if (item.cantidad <= 0) {
      this.remove(item);
      return;
    }

    item.subtotal = +(item.cantidad * item.precio).toFixed(2);
    this.recalcularTotales();
  }

  remove(item: ItemCarrito) {
    this.carrito = this.carrito.filter(x => x.idProducto !== item.idProducto);
    this.recalcularTotales();
  }

  vaciarCarrito() {
    this.carrito = [];
    this.recalcularTotales();
  }

  getQty(idProducto: number) {
    const item = this.carrito.find(x => x.idProducto === idProducto);
    return item?.cantidad ?? 0;
  }

  // Métodos de apoyo para la vista
  getSubtotal() {
    return this.subtotalProductos;
  }

  getItbis() {
    return this.montoItbis;
  }

  getPropina() {
    return this.montoPropina;
  }

  getTotal() {
    return this.total;
  }

  scrollCats(direction: 'left' | 'right') {
    const el = this.catsScroller?.nativeElement;
    if (!el) return;

    const scrollAmount = 200;

    if (direction === 'left') {
      el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }

  onCatsAccordionChange(ev: any) {
    this.catsOpen = ev?.detail?.value === 'cats';
  }
facturar() {

  if (!this.carrito.length) return;

  // 🔥 FACTURA → COBRAR
  if (this.tipoDocumento === 'Factura') {
    this.openModalCobro();
    return;
  }

  // 🔥 ORDEN / COTIZACIÓN → GUARDAR DIRECTO
  this.openModalCobro(); // 👈 reutilizas el mismo método

  console.log('Procesando...', {
    tipoDocumento: this.tipoDocumento
  });
}
  getSubtotalBase(){

  return this.carrito.reduce((sum, item)=>{

    const base = item.precioBase ?? item.precio;

    return sum + (base * item.cantidad);

  },0);

}

}