import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { PrinterComponent } from 'src/app/printer/printer.component';
import { EcfPreviewLauncherService } from 'src/app/servicios/ecf-preview-launcher.service';
import { EmisionEcfRequest, EmisionEcfResultadoCompleto } from 'src/app/models/facturacion-electronica.models';
import { IonModal, ModalController,AlertController,IonSearchbar, ToastController } from '@ionic/angular';
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
import { OrdenesComponent } from 'src/app/Ordenes/ordenes/ordenes.component';
import { AperturaCajaComponent } from 'src/app/Components/apertura-caja/apertura-caja.component';
import { facturaheader } from 'src/app/models/facturaheader';
import { facturadetalles } from 'src/app/models/facturadetalles';
import {
  PLAZOS_CREDITO,
  calcularFechaVencimiento,
  etiquetaPlazo,
  resolverDiasPlazo,
} from 'src/app/shared/plazo-credito.util';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { TipoComprobanteOption } from 'src/app/models/facturacion-electronica.models';
type ItemCarrito = {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;

  precioBase?: number;
  itbisProducto?: number;
  precioVentaOriginal?: number;
  descuentoUnitario?: number;
  
  idEmpleadoComision?: number;
};

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent implements OnInit, OnDestroy {

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
montoDescuentoPromo = 0;
/** Panel desplegable de descuento en el footer del carrito */
descuentoPanelAbierto = false;
/** Config del header del carrito (cliente, pago, comprobante) colapsable */
headerCarritoExpandido = false;
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
  | "Gubernamental"
= "FACT";
  comisionEmpleado: boolean = false;
  carrito: ItemCarrito[] = [];


tipoPago: 'CONTADO' | 'CREDITO' = 'CONTADO';
  /** Código de plazo de crédito (0,15,30… o custom). */
  plazoCreditoCodigo = '30';
  /** Días cuando el plazo es personalizado. */
  plazoCreditoDiasCustom: number | null = 30;
  readonly plazosCredito = PLAZOS_CREDITO;

tipoServicio: 'LOCAL' | 'DELIVERY' | 'LLEVAR' = 'LOCAL';
  searchOpen = false;
  mostrarSearch = true;
  catsOpen = true;
  isCartOpen = false;
  /** Hasta 1100px: catálogo full + carrito sheet/FAB (tablet/móvil). */
  esModoCompacto = false;
  private compactMq?: MediaQueryList;
  private compactMqListener?: (e: MediaQueryListEvent) => void;
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

usaCxC: boolean = false;

facturacionElectronica: boolean = false;
tiposComprobante: TipoComprobanteOption[] = [];
tipoEcfDgii: number | null = null;
  // Toggles header carrito
 
  aplicarPropina: boolean = false;

  constructor(
    private _categoriaService: CategoriasService,
    private _productoService: ProductosService,
    public parametro: ParametrosService,
    private descuentoSrv: DescuentoHeaderService,
    private empleadosService: EmpleadosService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private parametroConfigService: ParametroConfigService,
     private modal: ModalController,
     private router: Router,
     private _printService: PrintService,
     private _FacturaHeader: FacturaHeaderService,
      private rncService: RncCLienteDGIIService,
      private _CajaApertura:
  CajaAperturaService,
  private feService: FacturacionElectronicaService,
  private ecfPreview: EcfPreviewLauncherService,
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
      return 'Guardar';

    case 'Factura':

      return this.tipoPago === 'CREDITO'
        ? 'Guardar'
        : 'Cobrar';

    default:
      return 'Continuar';
  }
}

get diasPlazoCredito(): number {
  return resolverDiasPlazo(this.plazoCreditoCodigo, this.plazoCreditoDiasCustom);
}

get fechaVencimientoCreditoPreview(): Date | null {
  if (this.tipoPago !== 'CREDITO') return null;
  const dias = this.diasPlazoCredito;
  if (dias < 0) return null;
  return calcularFechaVencimiento(dias);
}

onPlazoCreditoChange(): void {
  if (this.plazoCreditoCodigo === 'custom' && (this.plazoCreditoDiasCustom == null || this.plazoCreditoDiasCustom < 0)) {
    this.plazoCreditoDiasCustom = 30;
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

      this.usaCxC = this.parametro.tieneModulo('CUENTAS_COBRAR');

      if (this.facturacionElectronica) {
        this.cargarTiposComprobante();
      }

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
    this.initModoCompacto();
    this.cargarCategorias();
    this.cargarProductos();
  
    this.recalcularTotales();
    this.validarCajaAbierta();
  }

  ngOnDestroy() {
    this.teardownModoCompacto();
    this.setBodyScrollLocked(false);
  }

  private initModoCompacto() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    this.compactMq = window.matchMedia('(max-width: 1100px)');
    this.esModoCompacto = this.compactMq.matches;
    this.compactMqListener = (e: MediaQueryListEvent) => {
      this.esModoCompacto = e.matches;
      if (!e.matches) {
        this.isCartOpen = false;
        this.setBodyScrollLocked(false);
      }
    };
    if (this.compactMq.addEventListener) {
      this.compactMq.addEventListener('change', this.compactMqListener);
    } else {
      // Safari viejo
      (this.compactMq as any).addListener(this.compactMqListener);
    }
  }

  private teardownModoCompacto() {
    if (!this.compactMq || !this.compactMqListener) return;
    if (this.compactMq.removeEventListener) {
      this.compactMq.removeEventListener('change', this.compactMqListener);
    } else {
      (this.compactMq as any).removeListener(this.compactMqListener);
    }
  }

  private setBodyScrollLocked(locked: boolean) {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = locked ? 'hidden' : '';
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
async openModalCobro(imprimirCotizacion = false) {

  if (!this.carrito.length) return;

  // =====================================
  // 🔥 ORDEN → GUARDAR DIRECT
  // =====================================

  if (this.tipoDocumento === 'Orden' || this.tipoDocumento === 'Cotizacion') {

    const header = new facturaheader();

    header.idFacturaHeader = this.parametro.IdFacturaHeader;
    header.iDCliente = this.clienteSeleccionado?.id || 0;
    header.moneda = this.parametro.Moneda;
    header.idEmpresa = this.parametro.IdEmpresa;
    header.idMesa = 1;
    header.idMoso = this.parametro.IdUsuario;
    header.nombreCuenta = this.clienteSeleccionado?.nombre || 'Al Portador';
    header.nota = this.clienteSeleccionado?.nombre || '';
    header.idTipoDocumentos =
      this.tipoDocumento === 'Cotizacion' ? 2 : 10;
    header.total = this.total;
    header.subTotal = this.subtotalProductos;
    header.totalItbis = this.montoItbis;
    header.totalDescuento = this.montoDescuento;
    header.tipoOrden = this.tipoOrden;

    this.carrito.forEach(item => {

      const det = new facturadetalles();

      det.idProducto = item.idProducto;
      det.cantidad = item.cantidad;
      det.subTotal = item.subtotal;
      det.precioOferta = item.precioBase ?? item.precio;
      det.descuento = item.descuentoUnitario ?? 0;
      det.itbis = item.itbisProducto || 0;
      det.idEmpresa = this.parametro.IdEmpresa;
      det.idEmpleadoComision = item.idEmpleadoComision || 0;
      // Solo IdProducto: no enviar Productos anidado (API validaba Almacen.Nombre).
      delete det.productos;

      header.facturaDetalles.push(det);

    });

    this._FacturaHeader.Enviarorden(header)
      .subscribe({

        next: async (resp: any) => {

          const idOrden =
            resp?.idFacturaHeader ??
            resp?.idFactura ??
            resp?.id ??
            resp;

          const numeroDocumento =
            resp?.numeroDocumento ?? '';

          if (this.tipoDocumento === 'Cotizacion' && idOrden) {
            // Al guardar siempre abrir el recibo (igual que desde el listado).
            await this._printService.openCotizacionCarta(
              this.armarCotizacionParaImprimir(
                header,
                idOrden,
                numeroDocumento
              )
            );
          } else if (this.imprimirOrden && idOrden) {
            void this.imprimirTicketDocumento(
              idOrden,
              this.cantidadCopiasOrden,
              this.armarTicketDesdeCarrito(idOrden, {
                numeroDocumento: numeroDocumento,
                tipoFactura: 'Orden'
              })
            );
          }

          this.resetPOS();

        },

        error: (err) => {
          console.error(err);
        }

      });

    return;
  }

  // =====================================
  // 🔥 FACTURA A CRÉDITO
  // =====================================

  if (
      this.tipoDocumento === 'Factura' &&
      this.tipoPago === 'CREDITO'
  ) {

    if (!this.usaCxC) {
      this.tipoPago = 'CONTADO';
      (
        await this.toastCtrl.create({
          message: 'Módulo Cuentas por Cobrar no disponible',
          duration: 2000,
          color: 'danger',
          position: 'top',
        })
      ).present();
      return;
    }

    if (!this.clienteSeleccionado?.id) {
      (
        await this.toastCtrl.create({
          message: 'Debe seleccionar un cliente para venta a crédito',
          duration: 2000,
          color: 'warning',
          position: 'top',
        })
      ).present();
      return;
    }

    const dias = this.diasPlazoCredito;
    if (dias < 0) {
      (
        await this.toastCtrl.create({
          message: 'Indique un plazo de crédito válido',
          duration: 2000,
          color: 'warning',
          position: 'top',
        })
      ).present();
      return;
    }

    const facturaDTO = this.armarFacturaDTO({
      tipoFactura: 'Credito',
      imprimir: false,
      pagos: [],
      plazoDias: dias,
    });

    this._FacturaHeader
      .createFacturaDirecta(facturaDTO)

      .subscribe({

        next: async (resp: any) => {

          const carritoSnap = [...this.carrito];
          const itbisSnap = this.montoItbis;
          const totalSnap = this.total;
          const clienteSnap = this.clienteSeleccionado ? { ...this.clienteSeleccionado } : null;
          const rncSnap = this.rncFiscal;
          const nombreFiscalSnap = this.nombreFiscal;
          const ecfTipoSnap = this.tipoEcfDgii;

          this.resetPOS();

          const idFactura =
            resp?.idFactura ??
            resp?.id ??
            resp;

          if (idFactura) {
            if (ecfTipoSnap) {
              this.carrito = carritoSnap;
              this.montoItbis = itbisSnap;
              this.total = totalSnap;
              this.clienteSeleccionado = clienteSnap;
              this.rncFiscal = rncSnap;
              this.nombreFiscal = nombreFiscalSnap;
              this.tipoEcfDgii = ecfTipoSnap;

              await this.procesarEcfYPreview(idFactura);

              this.resetPOS();
            }
            // Crédito: sin modal de impresión → no envía a printer automáticamente
          }

          this.parametro.IdFacturaHeader = 0;

        },

        error: (err) => {

          console.error(
            '❌ Error creando factura crédito',
            err
          );

        }

      });

    return;
  }

  // =====================================
  // 🔥 FACTURA CONTADO
  // =====================================

  const modal = await this.modal.create({

    component: CuentaxPagarComponent,

    cssClass: 'modal-factura-full',

    componentProps: {

      Items: this.carrito,

      Subtotal: this.subtotalProductos,

      Itbis: this.montoItbis,

      TotalFactura: this.total,

      IdCliente: this.clienteSeleccionado?.id || this.clienteSeleccionado?.idCliente || null,

      NombreCliente: this.clienteSeleccionado?.nombreComercial
        || this.clienteSeleccionado?.nombre
        || this.nombreFiscal
        || null

    }

  });

  await modal.present();

  const { data, role } = await modal.onDidDismiss();

  if (role !== 'ok') return;

  if (!data?.pagos || data.pagos.length === 0) {

    console.warn("⚠️ No hay pagos");

    return;

  }

  const facturaDTO = this.armarFacturaDTO(data);

  this._FacturaHeader
    .createFacturaDirecta(facturaDTO)

    .subscribe({

      next: async (resp: any) => {

        const carritoSnap = [...this.carrito];
        const itbisSnap = this.montoItbis;
        const totalSnap = this.total;
        const clienteSnap = this.clienteSeleccionado ? { ...this.clienteSeleccionado } : null;
        const rncSnap = this.rncFiscal;
        const nombreFiscalSnap = this.nombreFiscal;
        const ecfTipoSnap = this.tipoEcfDgii;
        const ticketSnap = this.armarTicketDesdeCarrito(0, {
          carrito: carritoSnap,
          total: totalSnap,
          itbis: itbisSnap,
          cliente: clienteSnap,
          tipoFactura: 'Contado'
        });

        this.resetPOS();

        const idFactura =
          resp?.idFactura ??
          resp?.id ??
          resp;

        if (idFactura) {
          if (ecfTipoSnap) {
            this.carrito = carritoSnap;
            this.montoItbis = itbisSnap;
            this.total = totalSnap;
            this.clienteSeleccionado = clienteSnap;
            this.rncFiscal = rncSnap;
            this.nombreFiscal = nombreFiscalSnap;
            this.tipoEcfDgii = ecfTipoSnap;

            await this.procesarEcfYPreview(idFactura);

            this.resetPOS();
            } else {
              if (data?.imprimir) {
                ticketSnap.idFacturaHeader = idFactura;
                ticketSnap.numeroDocumento =
                  resp?.numeroDocumento || idFactura;
                void this.imprimirTicketDocumento(
                  idFactura,
                  1,
                  ticketSnap
                );
              }
            }
          }

          this.parametro.IdFacturaHeader = 0;

        },

        error: (err) => {

          console.error(
            '❌ Error creando factura',
            err
          );

        }

      });

}

  /**
   * Tablet: preview térmico + window del navegador.
   * Desktop: ApiPrint remoto (cantidadCopias solo aplica ahí).
   */
  private async imprimirTicketDocumento(
    idDocumento: number,
    cantidadCopias = 1,
    facturaLocal?: any
  ): Promise<void> {
    if (this.esModoCompacto) {
      try {
        await this._printService.openTicketPosPreview(
          idDocumento,
          facturaLocal
        );
      } catch (err) {
        console.error('❌ Error abriendo vista previa del ticket', err);
        (
          await this.toastCtrl.create({
            message: 'No se pudo abrir la vista previa del ticket',
            duration: 2500,
            color: 'danger',
            position: 'top'
          })
        ).present();
      }
      return;
    }

    const copias = Math.max(1, cantidadCopias || 1);
    for (let i = 0; i < copias; i++) {
      this._printService
        .printTicket(idDocumento, this.parametro.IdEmpresa)
        .subscribe({
          error: (err) => console.error('❌ Error ApiPrint ticket', err)
        });
    }
  }


  /** Snapshot local del carrito para ticket térmico (evita GetFactura en tablet). */
  private armarTicketDesdeCarrito(
    idDocumento: number,
    opts?: {
      carrito?: any[];
      total?: number;
      itbis?: number;
      cliente?: any;
      numeroDocumento?: string | number;
      tipoFactura?: string;
    }
  ): any {
    const items = opts?.carrito ?? this.carrito;
    const cliente = opts?.cliente ?? this.clienteSeleccionado;

    return {
      idFacturaHeader: idDocumento,
      numeroDocumento: opts?.numeroDocumento || idDocumento,
      fechaInseccion: new Date(),
      tipoFactura: opts?.tipoFactura || this.tipoPago || 'Contado',
      total: opts?.total ?? this.total,
      totalItbis: opts?.itbis ?? this.montoItbis,
      clientes: {
        nombreComercial:
          cliente?.nombre ||
          cliente?.nombreComercial ||
          'Al Portador'
      },
      facturaDetalles: (items || []).map((item: any) => ({
        cantidad: item.cantidad,
        precioOferta: item.precioBase ?? item.precio,
        precio: item.precioBase ?? item.precio,
        subTotal: item.subtotal,
        itbis: item.itbisProducto || 0,
        productos: {
          nombre: item.nombre,
          descripcion: item.nombre
        }
      }))
    };
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
  this.plazoCreditoCodigo = '30';
  this.plazoCreditoDiasCustom = 30;
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
  this.montoDescuentoPromo = 0;
  this.descuentoTipo = 'MONTO';
  this.descuentoPanelAbierto = false;

  // Parámetros temporales
  this.parametro.IdFacturaHeader = 0;

  // Recargar
  
}
cargarOrdenEnPOS(orden: any) {

  console.log("🧾 Documento recibido:", orden);

  if (orden.idTipoDocumentos === 2) {
    this.tipoDocumento = 'Cotizacion';
  } else if (orden.idTipoDocumentos === 10) {
    this.tipoDocumento = 'Orden';
  } else {
    this.tipoDocumento = orden.tipoDocumento || 'Orden';
  }
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
      subtotal: d.subTotal,
      descuentoUnitario: d.descuento > 0 ? d.descuento : undefined,
      precioVentaOriginal:
        d.descuento > 0
          ? +(
              (d.precioOferta || d.precio) +
              d.itbis +
              d.descuento
            ).toFixed(2)
          : undefined
    });

  });

  this.recalcularTotales();

  // En tablet/móvil el carrito está minimizado: abrirlo al editar orden/cotización
  this.isCartOpen = true;
  if (this.esModoCompacto) {
    this.setBodyScrollLocked(true);
  }
}

private armarCotizacionParaImprimir(
  header: facturaheader,
  idFacturaHeader: number,
  numeroDocumento = ''
) {
  return {
    ...header,
    idFacturaHeader,
    numeroDocumento: numeroDocumento || header.numeroDocumento,
    totalDescuento: header.totalDescuento,
    fechaInseccion: new Date(),
    clientes: {
      nombreComercial:
        this.clienteSeleccionado?.nombre || 'Al Portador',
      celular: this.clienteSeleccionado?.celular || '',
      rnc: this.clienteSeleccionado?.rnc || ''
    },
    facturaDetalles: this.carrito.map(item => ({
      cantidad: item.cantidad,
      precioOferta: item.precioBase ?? item.precio,
      subTotal: item.subtotal,
      itbis: item.itbisProducto || 0,
      productos: {
        nombre: item.nombre,
        descripcion: item.nombre
      }
    }))
  };
}

async abrirOrdenesModal() {

  const modal = await this.modal.create({
    component: OrdenesComponent,
    cssClass: 'modal-fullscreen',
    componentProps: {
      modo: 'seleccionar',
      esModal: true,
      tipoDocumento: 'Orden'
    }
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  if (data?.ordenSeleccionada) {
    this.cargarOrdenEnPOS(data.ordenSeleccionada);
  }
}

async abrirCotizacionesModal() {

  const modal = await this.modal.create({
    component: OrdenesComponent,
    cssClass: 'modal-fullscreen',
    componentProps: {
      modo: 'seleccionar',
      esModal: true,
      tipoDocumento: 'Cotizacion'
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
      : this.tipoDocumento === 'Cotizacion'
      ? 2
      : 14;

  const tipoRaw = (dataModal.tipoFactura || this.tipoPago || 'Contado').toString();
  const tipoFactura =
    tipoRaw.toUpperCase() === 'CREDITO' || tipoRaw === 'Credito'
      ? 'Credito'
      : 'Contado';

  let plazo = '';
  let fechaBencimiento: string | undefined;

  if (tipoFactura === 'Credito') {
    const dias =
      dataModal.plazoDias != null
        ? Number(dataModal.plazoDias)
        : this.diasPlazoCredito;
    const diasOk = Number.isFinite(dias) && dias >= 0 ? Math.floor(dias) : 0;
    plazo = etiquetaPlazo(diasOk);
    fechaBencimiento = calcularFechaVencimiento(diasOk).toISOString();
  }

  return {
    header: {
      idEmpresa: this.parametro.IdEmpresa,
      idUsuario: this.parametro.IdUsuario,

      idCliente: this.clienteSeleccionado?.id
        || this.clienteSeleccionado?.idCliente
        || dataModal.idCliente
        || null,
      iDCliente: this.clienteSeleccionado?.id
        || this.clienteSeleccionado?.idCliente
        || dataModal.idCliente
        || null,
      tipoFactura,
      plazo,
      fechaBencimiento,
      rnc: this.rncFiscal || null,
      nombreEmpresa: this.nombreFiscal || null,
      idFacturaHeader: this.parametro.IdFacturaHeader,
      idMoso: 1,

      idTipoDocumentos: idTipoDocumento,

      tipoDocumento: this.tipoDocumento,
      tipoComprobante: this.tipoComprobante,
      tipoOrden: this.tipoOrden,
      tipoPago: tipoFactura === 'Credito' ? 'CREDITO' : 'CONTADO',

      subTotal: this.subtotalProductos,
      totalDescuento: this.montoDescuento,
      totalItbis: this.montoItbis,
      montoPropina: this.montoPropina,
      total: this.total,

      printPending: dataModal.imprimir,

      facturaDetalles: this.carrito.map(item => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        idEmpleadoComision: item.idEmpleadoComision || 0,
        precioOferta: item.precioBase ?? item.precio,
        descuento: item.descuentoUnitario ?? 0,
        itbis: item.itbisProducto ?? 0
      }))
    },

    pagos: (dataModal.pagos || []).map((p: any) => ({
      metodo: p.metodo,
      monto: p.monto,
      idSaldoAFavor: p.idSaldoAFavor ?? null,
      idNotaCredito: p.idNotaCredito ?? null,
      ncfNotaCredito: p.ncfNotaCredito ?? null
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

  if (!this.requiereDatosFiscales()) {
    this.rncFiscal = '';
    this.nombreFiscal = '';
    this.mensajeRnc = '';
    this.estadoRnc = '';
  }

  // 🔥 RECALCULAR
  this.recalcularTotales();
}

cargarTiposComprobante() {
  const idEmpresa = this.parametro.IdEmpresa;
  if (!idEmpresa) return;

  this.feService.getSecuenciasDisponibles(idEmpresa).subscribe({
    next: (secuencias) => {
      this.tiposComprobante = [
        { value: null, label: 'FACT (Sin comprobante)', disabled: false, alertaBaja: false, restantes: 0 }
      ];

      for (const s of secuencias) {
        const disabled = s.agotada || s.vencida;
        const alertaBaja = !disabled && s.restantes <= s.stockMinimo;
        let label = `e${s.tipoEcfDgii} - ${s.descripcion}`;
        if (disabled) label += ' (No disponible)';
        else if (alertaBaja) label += ` (${s.restantes} restantes)`;

        this.tiposComprobante.push({
          value: s.tipoEcfDgii,
          label,
          disabled,
          alertaBaja,
          restantes: s.restantes
        });
      }
    },
    error: () => {
      this.tiposComprobante = [
        { value: null, label: 'FACT (Sin comprobante)', disabled: false, alertaBaja: false, restantes: 0 }
      ];
    }
  });
}

onTipoEcfChange() {
  if (this.tipoEcfDgii === null) {
    this.tipoComprobante = 'FACT';
    this.aplicarITBIS = false;
  } else if (this.tipoEcfDgii === 32) {
    this.tipoComprobante = 'Consumidor Final';
    this.aplicarITBIS = true;
  } else if (this.tipoEcfDgii === 45) {
    this.tipoComprobante = 'Gubernamental';
    this.aplicarITBIS = true;
  } else {
    this.tipoComprobante = 'Crédito Fiscal';
    this.aplicarITBIS = true;
  }

  if (!this.requiereDatosFiscales()) {
    this.rncFiscal = '';
    this.nombreFiscal = '';
    this.mensajeRnc = '';
    this.estadoRnc = '';
  }
  this.recalcularTotales();
}

private async procesarEcfYPreview(idFactura: number) {
  if (!this.tipoEcfDgii) return;

  const request: EmisionEcfRequest = {
    idEmpresa: this.parametro.IdEmpresa,
    tipoEcfDgii: this.tipoEcfDgii,
    origenDocumento: 1,
    idOrigen: idFactura,
    idUsuario: this.parametro.IdUsuario
  };

  try {
    const resultado = await this.feService.emitirYEnviar(request).toPromise();

    if (!resultado || !resultado.exitoso) {
      const toast = await this.toastCtrl.create({
        message: `Error e-CF: ${resultado?.mensajeError || 'Error desconocido'}`,
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
      return;
    }

    const tipoLabel = this.ecfPreview.labelTipoEcf(this.tipoEcfDgii);

    const facturaPreview = {
      empresa: resultado.razonSocialEmisor,
      fecha: new Date(),
      tipoDocumentoFiscal: tipoLabel,
      cliente: this.nombreFiscal || this.clienteSeleccionado?.nombre || 'Consumidor',
      rnc: this.rncFiscal || this.clienteSeleccionado?.cedulaRNC || null,
      items: this.carrito.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subTotal: item.subtotal
      })),
      totalItbis: this.montoItbis,
      total: this.total,
    };

    await this.ecfPreview.openFromEmision({
      resultado,
      factura: facturaPreview,
      tipo: 'factura',
      tipoEcfDgii: this.tipoEcfDgii
    });

  } catch (err: any) {
    console.error('Error emisión e-CF', err);
    const toast = await this.toastCtrl.create({
      message: `Error al emitir e-CF: ${err?.error?.mensajeError || err?.message || 'Error'}`,
      duration: 4000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }
}

requiereDatosFiscales(): boolean {
  return (
    this.tipoComprobante === 'Crédito Fiscal' ||
    this.tipoComprobante === 'Gubernamental'
  );
}

mostrarSelectorCliente(): boolean {
  if (this.tipoDocumento !== 'Factura') {
    return true;
  }

  return !this.requiereDatosFiscales();
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
  // 🔥 DESCUENTO PROMOCIONAL
  // =====================================

  this.montoDescuentoPromo =
    +this.carrito.reduce((sum, item) => {
      return sum +
        ((item.descuentoUnitario ?? 0) * item.cantidad);
    }, 0).toFixed(2);

  // =====================================
  // 🔥 DESCUENTO MANUAL
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

  tieneDescuentoProducto(prod: productos): boolean {
    return !!prod._precioOriginal && prod._precioOriginal > prod.precioVenta;
  }

  getPorcentajeDescuentoProducto(prod: productos): number {
    if (!this.tieneDescuentoProducto(prod)) {
      return 0;
    }

    return Math.round(
      ((prod._precioOriginal - prod.precioVenta) / prod._precioOriginal) * 100
    );
  }

  mostrarBadgeDescuentoProducto(prod: productos): boolean {
    return this.getPorcentajeDescuentoProducto(prod) > 0;
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
    const idCategoria = prod.idCategoria || 0;

    this.descuentoSrv.getAplicado(
      this.parametro.IdEmpresa,
      prod.idProducto,
      idArea,
      idCategoria
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
      (prod as any)._nombrePromo = resp.nombreEvento || '';

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
  // 🔥 VALIDAR EXISTENCIA (solo productos con stock)
  // =====================================

if (
    this.debeControlarExistencia(prod) &&
    (prod.cantidad ?? 0) <= 0
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
  const precioVentaOriginal =
    prod._precioOriginal && prod._precioOriginal > precioVenta
      ? prod._precioOriginal
      : precioVenta;
  const descuentoUnitario = Math.max(
    0,
    +(precioVentaOriginal - precioVenta).toFixed(2)
  );

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

    // VALIDAR EXISTENCIA (nunca para servicios)
    if (
      this.debeControlarExistencia(prod) &&
      item.cantidad >= (prod.cantidad ?? 0)
    ) {

      this.alertCtrl.create({
        header: 'Existencia insuficiente',
        message: `Solo hay ${prod.cantidad} unidad(es) disponibles de ${prod.nombre}.`,
        buttons: ['Aceptar']
      }).then(a => a.present());

      return;
    }

    item.cantidad++;

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

    itbisProducto: itbisProducto,

    precioVentaOriginal:
      descuentoUnitario > 0 ? precioVentaOriginal : undefined,

    descuentoUnitario:
      descuentoUnitario > 0 ? descuentoUnitario : undefined
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
      this.debeControlarExistencia(producto) &&
      item.cantidad >= (producto.cantidad ?? 0)
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

  getPrecioUnitarioItem(item: ItemCarrito): number {
    const base = item.precioBase ?? item.precio;
    const usarITBIS =
      this.facturarITBIS &&
      this.aplicarITBIS;

    if (usarITBIS) {
      return +(
        base + (item.itbisProducto ?? 0)
      ).toFixed(2);
    }

    return base;
  }

  getPrecioOriginalUnitarioItem(item: ItemCarrito): number {
    if (item.precioVentaOriginal != null && item.precioVentaOriginal > 0) {
      return item.precioVentaOriginal;
    }

    return this.getPrecioUnitarioItem(item);
  }

  getDescuentoUnitarioItem(item: ItemCarrito): number {
    return item.descuentoUnitario ?? 0;
  }

  getDescuentoLineaItem(item: ItemCarrito): number {
    return +(
      this.getDescuentoUnitarioItem(item) * item.cantidad
    ).toFixed(2);
  }

  getSubtotalBruto(): number {
    return +this.carrito.reduce((sum, item) => {
      return sum +
        (this.getPrecioOriginalUnitarioItem(item) * item.cantidad);
    }, 0).toFixed(2);
  }

  async editarPrecioItem(item: ItemCarrito) {

    if (!this.parametro.PuedeEditarPrecioCarrito) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Editar precio',
      message: item.nombre,
      inputs: [
        {
          name: 'precio',
          type: 'number',
          min: 0,
          value: this.getPrecioUnitarioItem(item),
          placeholder: 'Nuevo precio unitario'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoPrecio = Number(data.precio);

            if (
              data.precio === '' ||
              data.precio === null ||
              isNaN(nuevoPrecio) ||
              nuevoPrecio < 0
            ) {
              return false;
            }

            this.aplicarPrecioManual(item, nuevoPrecio);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private aplicarPrecioManual(
    item: ItemCarrito,
    nuevoPrecioUnitario: number
  ) {

    const usarITBIS =
      this.facturarITBIS &&
      this.aplicarITBIS;

    if (usarITBIS) {

      const precioBase = +(
        nuevoPrecioUnitario / (1 + this.tasaITBIS)
      ).toFixed(2);

      item.precioBase = precioBase;
      item.precio = precioBase;

    }
    else {

      const precioBase =
        +nuevoPrecioUnitario.toFixed(2);

      item.precioBase = precioBase;
      item.precio = precioBase;

    }

    item.precioVentaOriginal = undefined;
    item.descuentoUnitario = undefined;

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
    if (this.esModoCompacto) {
      this.setBodyScrollLocked(this.isCartOpen);
    }
  }

  toggleDescuentoPanel() {
    this.descuentoPanelAbierto = !this.descuentoPanelAbierto;
  }

  toggleHeaderCarrito() {
    this.headerCarritoExpandido = !this.headerCarritoExpandido;
  }

  get resumenClienteCarrito(): string {
    return this.clienteSeleccionado?.nombre || 'Al portador';
  }

  get resumenPagoCarrito(): string {
    if (this.tipoDocumento !== 'Factura') return this.tipoDocumento;
    return this.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado';
  }

  get resumenComprobanteCarrito(): string {
    if (this.tipoDocumento !== 'Factura') return '';
    if (this.facturacionElectronica) {
      const tc = this.tiposComprobante?.find(
        (t: any) => t.value === this.tipoEcfDgii
      );
      return tc?.label || 'Sin comprobante';
    }
    return this.tipoComprobante || 'FACT';
  }

  /** Servicios y productos sin control de stock no validan existencia. */
  private debeControlarExistencia(prod: any): boolean {
    if (!prod) return false;
    const esServicio = !!(prod.esServicio ?? prod.EsServicio);
    if (esServicio) return false;
    const controlar = prod.controlarStock ?? prod.ControlarStock;
    return !!controlar;
  }

  cerrarCart() {
    this.isCartOpen = false;
    this.descuentoPanelAbierto = false;
    this.setBodyScrollLocked(false);
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