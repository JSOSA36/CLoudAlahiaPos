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
tasaITBIS: number = 0.18;
aplicarITBIS: boolean = true;
  public ListadoEmpleados: Empleado[] = [];

  busqueda = '';
  codigoBusqueda: string = '';
  categoriaSeleccionada: string = '';
  indiceSeleccionado = 0;

  tipoOrden: 'Llevar' | 'ComerAqui' | 'Delivery' | 'DeliveryExterno' = 'Llevar';
  tipoDocumento: 'Factura' | 'Orden' = 'Factura';
  tipoFactura: 'Contado' | 'Crédito' = 'Contado';
  comisionEmpleado: boolean = false;
  carrito: ItemCarrito[] = [];

  searchOpen = false;
  mostrarSearch = true;
  catsOpen = true;
  isCartOpen = false;
carritoModal = false;
  // Totales
  subtotalProductos: number = 0;
  montoItbis: number = 0;
  montoPropina: number = 0;
  total: number = 0;

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
     private _FacturaHeader: FacturaHeaderService
  ) {

    
    this.cargarEmpleados();
    this.cargarParametrosPOS();
    //this.iirAImpresion();
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

cargarParametrosPOS(){

  const idEmpresa = this.parametro.GetIdEmpresa();

  this.parametroConfigService.getParametrosEmpresa(idEmpresa)
  .subscribe((params:any[])=>{

    const facturar = params.find(x => x.clave === 'FACTURAR_CON_ITBIS');
    const incluye = params.find(x => x.clave === 'PRECIO_INCLUYE_ITBIS');
    const comision = params.find(x => x.clave === 'COMISION_EMPLEADO');
   
    this.facturarITBIS = facturar?.valor === 'true';
    this.precioIncluyeITBIS = incluye?.valor === 'true';
    this.comisionEmpleado = comision?.valor === 'true';
    console.log("ITBIS activo:", this.facturarITBIS);
    console.log("Precio incluye ITBIS:", this.precioIncluyeITBIS);
    console.log("Comisión por empleado:", this.comisionEmpleado);

  });

}
  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductos();
    this.checkMobile();
    this.recalcularTotales();
  }

  async checkMobile() {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      const alert = await this.alertCtrl.create({
        header: 'Dispositivo no compatible',
        message: 'El módulo POS no puede ser utilizado desde dispositivos móviles. Por favor utilice una computadora o tablet.',
        buttons: ['Entendido']
      });

      await alert.present();
    }
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
        }
      });
  }
async openModalCobro() {

  if (!this.carrito.length) return;

  const modal = await this.modal.create({
    component: CuentaxPagarComponent,
    cssClass: 'modal-factura-full',
    componentProps: {
      Items: this.carrito,
      Subtotal: this.subtotalProductos,
      Itbis: this.montoItbis,
      TotalFactura: this.total,
      TipoOrden: this.tipoOrden
    }
  });

  await modal.present();

  const { data, role } = await modal.onDidDismiss();

  if (role === 'ok') {

    console.log("💰 Data modal:", data);

    // 🔥 VALIDACIÓN
    if (!data?.pagos || data.pagos.length === 0) {
      console.warn("⚠️ No hay pagos");
      return;
    }

    const facturaDTO = this.armarFacturaDTO(data);

    console.log("📦 DTO listo:", facturaDTO);

    this._FacturaHeader.createFacturaDirecta(facturaDTO)
      .subscribe({
        next: (resp: any) => {

          console.log("✅ Factura creada:", resp);

          // 🔥 LIMPIAR
          this.carrito = [];
          this.recalcularTotales();

        },
        error: (err) => {
          console.error("❌ Error creando factura", err);
        }
      });
  }
}
private armarFacturaDTO(dataModal: any) {

  return {
    header: {
      idEmpresa: this.parametro.GetIdEmpresa(),
      idCliente: dataModal.idCliente,
      idMoso: 1,
      tipoFactura: dataModal.tipoFactura,
      printPending: dataModal.imprimir,

      facturaDetalles: this.carrito.map(item => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precioOferta: item.precioBase ?? item.precio,
        itbis: item.itbisProducto ?? 0
      }))
    },

    pagos: dataModal.pagos
  };
}
recalcularTotales() {

  const usarITBIS = this.facturarITBIS && this.aplicarITBIS;

  // 🔥 RECALCULAR CADA ITEM
  this.carrito.forEach(item => {

    const precioBase = item.precioBase ?? item.precio;

    if (usarITBIS) {

      item.itbisProducto = +(precioBase * this.tasaITBIS).toFixed(2);

      const precioFinal = +(precioBase + item.itbisProducto).toFixed(2);

      item.subtotal = +(precioFinal * item.cantidad).toFixed(2);

    } else {

      item.itbisProducto = 0;

      item.subtotal = +(precioBase * item.cantidad).toFixed(2);
    }

  });

  // 🔹 subtotal base
  this.subtotalProductos = this.carrito.reduce((sum, item) => {
    return sum + ((item.precioBase ?? item.precio) * item.cantidad);
  }, 0);

  // 🔹 ITBIS total
  this.montoItbis = usarITBIS
    ? this.carrito.reduce((sum, item) => {
        return sum + ((item.itbisProducto ?? 0) * item.cantidad);
      }, 0)
    : 0;

  // 🔹 propina
  this.montoPropina = this.aplicarPropina
    ? +(this.subtotalProductos * 0.10).toFixed(2)
    : 0;

  // 🔹 total final
  this.total = usarITBIS
    ? +(this.subtotalProductos + this.montoItbis + this.montoPropina).toFixed(2)
    : +(this.subtotalProductos + this.montoPropina).toFixed(2);
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
      .GetListadoCategorias(this.parametro.GetIdEmpresa())
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
      .GetProductos(this.parametro.IdEmpresa)
      .subscribe({
        next: (res: productos[]) => {
          const lista: productos[] = res ?? [];

          lista.forEach(p => {
            this.aplicarDescuentoProducto(p);
          });

          this.productos = lista;
          this.productosFiltrados = [...lista];
          this.indiceSeleccionado = 0;

          console.log('Productos cargados:', this.productos.length);
        },
        error: (err) => {
          console.error('Error cargando productos', err);
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

 addToCart(prod: productos, event?: MouseEvent) {

  if (event) {
    const card = event.currentTarget as HTMLElement;
    this.animarAlCarrito(card);
  }

  const precioVenta = prod.precioVenta;

  // 🔹 1. CALCULAR BASE SIEMPRE (NO DEPENDE DE FACTURA)
  let precioBase = this.precioIncluyeITBIS
    ? +(precioVenta / (1 + this.tasaITBIS)).toFixed(2)
    : precioVenta;

  // 🔹 2. DECIDIR SI LA FACTURA LLEVA ITBIS
  const usarITBIS = this.facturarITBIS && this.aplicarITBIS;

  let itbisProducto = usarITBIS
    ? +(precioBase * this.tasaITBIS).toFixed(2)
    : 0;

  // 🔹 3. PRECIO FINAL DEPENDE DE SI SE APLICA ITBIS
  let precioFinal = usarITBIS
    ? +(precioBase + itbisProducto).toFixed(2)
    : precioBase;

  const item = this.carrito.find(i => i.idProducto === prod.idProducto);

  if (item) {

    item.cantidad++;

    item.subtotal = +(item.cantidad * precioFinal).toFixed(2);

    this.recalcularTotales();

    return;
  }

  this.carrito.push({
    idProducto: prod.idProducto,
    nombre: prod.nombre,

    // 🔹 PRECIO BASE SIEMPRE LIMPIO
    precio: precioBase,

    cantidad: 1,

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

  inc(item: ItemCarrito) {
    item.cantidad++;
    item.subtotal = +(item.cantidad * item.precio).toFixed(2);
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
    this.openModalCobro();
    console.log('Facturando...', {
      tipoDocumento: this.tipoDocumento,
      tipoFactura: this.tipoFactura,
      tipoOrden: this.tipoOrden,
      aplicarITBIS: this.aplicarITBIS,
      aplicarPropina: this.aplicarPropina,
      items: this.carrito,
      subtotal: this.getSubtotal(),
      itbis: this.getItbis(),
      propina: this.getPropina(),
      total: this.getTotal()
    });

    
    
  }
  getSubtotalBase(){

  return this.carrito.reduce((sum, item)=>{

    const base = item.precioBase ?? item.precio;

    return sum + (base * item.cantidad);

  },0);

}
}