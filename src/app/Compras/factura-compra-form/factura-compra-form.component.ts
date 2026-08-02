import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import {
  FacturaCompraDetalle,
  GuardarFacturaCompraRequest
} from 'src/app/models/compras.models';
import { Proveedor } from 'src/app/models/proveedores';
import { ProductoBusquedaCompra } from 'src/app/models/producto-busqueda.model';
import { Almacen } from 'src/app/models/almacenes.model';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ProveedoresService } from 'src/app/servicios/proveedores.service';
import { AlmacenesService } from 'src/app/servicios/almacenes.service';
import { MetodoPagoCuentaService } from 'src/app/servicios/metodo-pago-cuenta.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { MetodoPagoCuenta } from 'src/app/models/MetodoPagoCuenta.models';
import {
  COMPRAS_DOC_UI,
  ESTADOS_DOCUMENTO_COMPRA,
  ESTADOS_ORDEN_COMPRA,
  MONEDAS_COMPRA,
  TIPOS_DOCUMENTO_COMPRA
} from '../shared/compras-documento.config';
import {
  DESTINOS_ITBIS_ANEXO_A,
  FORMAS_PAGO_606,
  TIPOS_BIENES_SERVICIOS_606,
  TIPOS_RETENCION_ISR_606,
  etiquetaFormaPagoDgii,
  sugerirFormaPagoDgii
} from '../shared/dgii-606.catalog';
import { ProductoLineaBusquedaComponent } from '../shared/producto-linea-busqueda/producto-linea-busqueda.component';
import {
  desglosarMontoConItbis,
  itbisLineaDesdeUnitario,
  TASA_ITBIS_RD
} from '../shared/compra-itbis.util';
import {
  TIPO_COMPORTAMIENTO,
  claseBadgeTipoComportamiento,
  etiquetaTipoComportamiento,
  normalizarTipoComportamiento,
  resolverComportamientoCompra,
  requiereAlmacen,
} from 'src/app/shared/tipo-comportamiento';

@Component({
  selector: 'app-factura-compra-form',
  templateUrl: './factura-compra-form.component.html',
  styleUrls: ['./factura-compra-form.component.scss'],
})
export class FacturaCompraFormComponent implements OnInit {
  /** Configuración UI compartida del documento de compras */
  readonly ui = COMPRAS_DOC_UI;
  readonly tiposDocumento = TIPOS_DOCUMENTO_COMPRA;
  readonly monedas = MONEDAS_COMPRA;
  readonly tiposBienesServicios606 = TIPOS_BIENES_SERVICIOS_606;
  readonly formasPago606 = FORMAS_PAGO_606;
  readonly tiposRetencionIsr606 = TIPOS_RETENCION_ISR_606;
  readonly destinosItbisAnexoA = DESTINOS_ITBIS_ANEXO_A;
  estadosDocumento = ESTADOS_DOCUMENTO_COMPRA;

  idOrdenCompraHeader = 0;
  idTipoDocumento = 11;
  /** true cuando la ruta es /compras/ordenes… */
  esOrdenCompra = false;
  numeroDocumentoInterno = '';
  numeroDocumentoOrigen = '';
  moneda = 'DOP';
  idProveedor = 0;
  numeroComprobante = '';
  ncfModificado = '';
  fechaDocumento = new Date().toISOString().substring(0, 10);
  condicionFactura: 'Contado' | 'Credito' = 'Contado';
  fechaVencimiento = '';
  idAlmacen?: number;
  comentario = '';
  formaPago = 'EFECTIVO';
  idTipoBienesServicios: number | null = null;
  formaPagoDgii: number | null = 1;
  /** Si true, formaPagoDgii se recalcula desde condición + método operativo. */
  formaPagoDgiiAuto = true;
  montoFacturadoServicios = 0;
  montoFacturadoBienes = 0;
  /** Si true, al cambiar líneas se recalculan montos bienes/servicios. */
  autoMontosDgii = true;
  /**
   * Retenciones OFF por defecto. Solo si el contador/empresa decide practicar
   * retención se habilitan campos y validaciones.
   */
  aplicaRetencion = false;
  itbisRetenido = 0;
  itbisProporcionalidad = 0;
  itbisLlevadoAlCosto = 0;
  tipoRetencionIsr: number | null = null;
  montoRetencionRenta = 0;
  fechaPagoFiscal = '';
  /** Destino ITBIS Anexo A (1–7). Solo con GenerarIt1. */
  destinoItbis: number | null = 5;
  clasificacionConfirmada = false;
  itbisComprasLocales = 0;
  itbisServicios = 0;
  itbisImportaciones = 0;
  estado = 'BORRADOR';
  estadoRecepcion = 'NO_APLICA';
  pagado = 0;
  pendiente = 0;

  /** Reservado: tipo de cambio (multi-moneda) */
  tipoCambio = 1;
  /** Reservado: usuario que confirmó */
  usuarioConfirmacion = '';
  /** Reservado: fecha confirmación */
  fechaConfirmacion = '';

  proveedores: Proveedor[] = [];
  almacenes: Almacen[] = [];
  metodosPago: MetodoPagoCuenta[] = [];
  detalles: FacturaCompraDetalle[] = [];

  productoSeleccionado?: ProductoBusquedaCompra;
  cantidad = 1;
  /** Valor que edita el usuario en el input Precio / Costo. */
  precioIngresado = 0;
  /** Precio neto unitario (sin ITBIS) que se guarda en la línea. */
  precioCompra = 0;
  descuento = 0;
  itbis = 0;
  /** Producto.Itbis: el costo del catálogo / ingresado incluye ITBIS. */
  productoCostoIncluyeItbis = false;
  /** ITBIS unitario tras el desglose (para recalcular al cambiar cantidad). */
  itbisUnitarioDesglose = 0;
  readonly tasaItbisCompra = TASA_ITBIS_RD;

  procesando = false;

  @ViewChild(ProductoLineaBusquedaComponent) busquedaProducto?: ProductoLineaBusquedaComponent;
  @ViewChild('inputCantidad') inputCantidad?: ElementRef<HTMLIonInputElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comprasService: ComprasService,
    private proveedoresService: ProveedoresService,
    private almacenesService: AlmacenesService,
    private metodoPagoService: MetodoPagoCuentaService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.esOrdenCompra = this.router.url.includes('/compras/ordenes');
    this.idTipoDocumento = this.esOrdenCompra ? 5 : 11;
    this.estadosDocumento = this.esOrdenCompra
      ? ESTADOS_ORDEN_COMPRA
      : ESTADOS_DOCUMENTO_COMPRA;

    const idEmpresa = this.parametro.GetIdEmpresa();
    this.proveedoresService.listar(idEmpresa).subscribe(d => this.proveedores = d || []);
    this.almacenesService.getAlmacenes(idEmpresa).subscribe(d => this.almacenes = d || []);
    this.metodoPagoService.getByEmpresa(idEmpresa).subscribe(d => {
      this.metodosPago = d || [];
      if (this.metodosPago.length) {
        this.formaPago = this.metodosPago[0].metodoPago;
        this.sincronizarFormaPagoDgii();
      }
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id > 0) {
      this.idOrdenCompraHeader = id;
      this.cargarFactura(id);
    }
  }

  cargarFactura(id: number) {
    this.comprasService.obtener(id, this.parametro.GetIdEmpresa()).subscribe({
      next: (f) => {
        this.idOrdenCompraHeader = f.idOrdenCompraHeader;
        this.idProveedor = f.idProveedor;
        this.numeroComprobante = f.numeroComprobanteProveedor || '';
        this.ncfModificado = f.ncfModificado || '';
        this.fechaDocumento = (f.fechaDocumento || '').substring(0, 10);
        this.condicionFactura = (f.condicionFactura as any) || 'Contado';
        this.fechaVencimiento = f.fechaVencimiento ? f.fechaVencimiento.substring(0, 10) : '';
        this.idAlmacen = f.idAlmacen;
        this.comentario = f.comentario || '';
        this.idTipoBienesServicios = f.idTipoBienesServicios ?? null;
        if (f.formaPagoDgii != null && f.formaPagoDgii > 0) {
          this.formaPagoDgii = f.formaPagoDgii;
          const sugerido = sugerirFormaPagoDgii(this.condicionFactura, this.formaPago);
          this.formaPagoDgiiAuto = f.formaPagoDgii === sugerido;
        } else {
          this.sincronizarFormaPagoDgii();
        }
        this.montoFacturadoServicios = f.montoFacturadoServicios ?? 0;
        this.montoFacturadoBienes = f.montoFacturadoBienes ?? 0;
        this.itbisRetenido = f.itbisRetenido ?? 0;
        this.itbisProporcionalidad = f.itbisProporcionalidad ?? 0;
        this.itbisLlevadoAlCosto = f.itbisLlevadoAlCosto ?? 0;
        this.tipoRetencionIsr = f.tipoRetencionIsr ?? null;
        this.montoRetencionRenta = f.montoRetencionRenta ?? 0;
        this.fechaPagoFiscal = f.fechaPagoFiscal ? f.fechaPagoFiscal.substring(0, 10) : '';
        this.destinoItbis = f.destinoItbis ?? f.destinoItbisSugerido ?? 5;
        this.clasificacionConfirmada = !!f.clasificacionConfirmada;
        this.itbisComprasLocales = f.itbisComprasLocales ?? 0;
        this.itbisServicios = f.itbisServicios ?? 0;
        this.itbisImportaciones = f.itbisImportaciones ?? 0;
        this.aplicaRetencion =
          (this.itbisRetenido > 0)
          || (this.montoRetencionRenta > 0)
          || (this.tipoRetencionIsr != null && this.tipoRetencionIsr > 0);
        this.estado = f.estado;
        this.estadoRecepcion = f.estadoRecepcion || 'NO_APLICA';
        this.numeroDocumentoInterno = f.numeroDocumento || '';
        this.numeroDocumentoOrigen = f.numeroDocumentoOrigen || '';
        this.pagado = f.pagado ?? 0;
        this.pendiente = f.pendiente ?? 0;
        this.detalles = [...(f.detalles || [])];
        if (!((f.montoFacturadoServicios ?? 0) > 0 || (f.montoFacturadoBienes ?? 0) > 0)) {
          this.recalcularMontosDgii();
        } else {
          this.autoMontosDgii = false;
        }
        if (f.idTipoDocumentos === 5) {
          this.esOrdenCompra = true;
          this.idTipoDocumento = 5;
          this.estadosDocumento = ESTADOS_ORDEN_COMPRA;
        }
      },
      error: () => this.toast('No se pudo cargar la factura')
    });
  }

  onProductoSeleccionado(item: ProductoBusquedaCompra): void {
    this.productoSeleccionado = item;
    this.aplicarCostoProducto(item);
    this.enfocarCantidad();
  }

  onProductoAgregarRapido(item: ProductoBusquedaCompra): void {
    this.productoSeleccionado = item;
    this.aplicarCostoProducto(item);
    this.agregarLinea(true);
    this.busquedaProducto?.enfocarBusqueda();
  }

  /**
   * Si el producto tiene Itbis=true, el costo del catálogo incluye ITBIS:
   * se desglosa en precio neto + ITBIS de línea de forma transparente.
   */
  private aplicarCostoProducto(item: ProductoBusquedaCompra): void {
    const costoCatalogo = Number(item.precioCompra || 0);
    this.productoCostoIncluyeItbis = !!item.itbis;
    this.precioIngresado = costoCatalogo;
    this.recalcularDesgloseItbisEntrada();
  }

  onPrecioIngresadoChange(): void {
    this.recalcularDesgloseItbisEntrada();
  }

  onCantidadEntradaChange(): void {
    if (this.productoCostoIncluyeItbis) {
      this.itbis = itbisLineaDesdeUnitario(this.itbisUnitarioDesglose, this.cantidad);
    }
  }

  private recalcularDesgloseItbisEntrada(): void {
    const ingresado = Number(this.precioIngresado) || 0;
    const qty = Number(this.cantidad) || 0;

    if (this.productoCostoIncluyeItbis && ingresado > 0) {
      const d = desglosarMontoConItbis(ingresado, this.tasaItbisCompra);
      this.precioCompra = d.neto;
      this.itbisUnitarioDesglose = d.itbisUnitario;
      this.itbis = itbisLineaDesdeUnitario(d.itbisUnitario, qty > 0 ? qty : 1);
    } else {
      this.precioCompra = ingresado;
      this.itbisUnitarioDesglose = 0;
      // No pisa ITBIS manual si el producto no incluye ITBIS en costo
    }
  }

  get hintDesgloseItbis(): string {
    if (!this.productoCostoIncluyeItbis || !(this.precioIngresado > 0)) {
      return '';
    }
    const pct = Math.round(this.tasaItbisCompra * 100);
    return `Costo incluye ITBIS (${pct}%). Desglose unitario: neto ${this.precioCompra.toFixed(2)} + ITBIS ${this.itbisUnitarioDesglose.toFixed(2)} = ${Number(this.precioIngresado).toFixed(2)}`;
  }

  agregarLinea(rapido = false): void {
    const idProducto = Number(this.productoSeleccionado?.idProducto || 0);
    const cantidadAgregar = rapido ? 1 : Number(this.cantidad);

    if (!idProducto || cantidadAgregar <= 0) {
      this.toast('Seleccione producto y cantidad válida');
      return;
    }

    // Asegura desglose coherente antes de persistir la línea
    if (rapido) {
      this.cantidad = 1;
    }
    this.recalcularDesgloseItbisEntrada();

    const nombre = this.productoSeleccionado?.nombre;
    const tipoLinea = normalizarTipoComportamiento(
      this.productoSeleccionado?.tipoComportamiento
        ?? resolverComportamientoCompra({
          tipoComportamiento: this.productoSeleccionado?.tipoComportamiento,
          controlarStock: this.productoSeleccionado?.controlarStock
        })
    );
    const existente = this.detalles.find(d => d.idProducto === idProducto);

    if (existente) {
      existente.cantidad = Number(existente.cantidad || 0) + cantidadAgregar;
      if (!rapido || this.productoCostoIncluyeItbis) {
        existente.precioCompra = this.precioCompra;
        existente.descuento = this.descuento;
        // ITBIS de la línea = unitario × cantidad final acumulada
        if (this.productoCostoIncluyeItbis) {
          existente.itbis = itbisLineaDesdeUnitario(
            this.itbisUnitarioDesglose,
            existente.cantidad
          );
        } else if (!rapido) {
          existente.itbis = this.itbis;
        }
      }
      existente.tipoComportamientoLinea = tipoLinea;
      existente.subTotal =
        (Number(existente.cantidad) * Number(existente.precioCompra))
        - Number(existente.descuento || 0)
        + Number(existente.itbis || 0);
      this.toast(
        this.productoCostoIncluyeItbis
          ? `Cantidad actualizada (costo c/ITBIS desglosado): ${existente.nombreProducto || nombre}`
          : `Cantidad actualizada: ${existente.nombreProducto || nombre}`
      );
    } else {
      const itbisLinea = this.productoCostoIncluyeItbis
        ? itbisLineaDesdeUnitario(this.itbisUnitarioDesglose, cantidadAgregar)
        : this.itbis;
      const subTotal = (cantidadAgregar * this.precioCompra) - this.descuento + itbisLinea;
      this.detalles.push({
        idProducto,
        cantidad: cantidadAgregar,
        precioCompra: this.precioCompra,
        descuento: this.descuento,
        itbis: itbisLinea,
        subTotal,
        nombreProducto: nombre,
        tipoComportamientoLinea: tipoLinea
      });
    }

    this.limpiarEntradaLinea();
    if (this.autoMontosDgii) {
      this.recalcularMontosDgii();
    }
    this.busquedaProducto?.enfocarBusqueda();
  }

  private limpiarEntradaLinea(): void {
    this.productoSeleccionado = undefined;
    this.cantidad = 1;
    this.descuento = 0;
    this.itbis = 0;
    this.precioCompra = 0;
    this.precioIngresado = 0;
    this.productoCostoIncluyeItbis = false;
    this.itbisUnitarioDesglose = 0;
  }

  private enfocarCantidad(): void {
    setTimeout(() => this.inputCantidad?.nativeElement?.setFocus(), 80);
  }

  quitarLinea(i: number) {
    this.detalles.splice(i, 1);
    if (this.autoMontosDgii) {
      this.recalcularMontosDgii();
    }
  }

  get totalDescuento(): number {
    return this.detalles.reduce((s, d) => s + Number(d.descuento || 0), 0);
  }

  get totalItbis(): number {
    return this.detalles.reduce((s, d) => s + Number(d.itbis || 0), 0);
  }

  get total(): number {
    return this.detalles.reduce((s, d) => s + Number(d.subTotal || 0), 0);
  }

  get subtotalBruto(): number {
    return this.detalles.reduce(
      (s, d) => s + Number(d.cantidad || 0) * Number(d.precioCompra || 0),
      0
    );
  }

  get proveedorNombre(): string {
    return this.proveedorSeleccionado?.nombreComercial || '—';
  }

  get proveedorSeleccionado(): Proveedor | undefined {
    return this.proveedores.find(x => x.idProveedor === Number(this.idProveedor));
  }

  get tipoDocumentoActual() {
    return this.tiposDocumento.find(t => t.id === this.idTipoDocumento)
      ?? this.tiposDocumento[0];
  }

  get estadoEtiqueta(): string {
    return this.estadosDocumento.find(e => e.codigo === this.estado)?.etiqueta
      ?? this.estado;
  }

  get estadoRecepcionEtiqueta(): string {
    const map: Record<string, string> = {
      NO_APLICA: 'No aplica',
      PENDIENTE_RECEPCION: 'Pendiente de recepción',
      PARCIALMENTE_RECIBIDA: 'Parcialmente recibida',
      RECIBIDA: 'Recibida'
    };
    return map[this.estadoRecepcion] || this.estadoRecepcion;
  }

  get numeroInternoDisplay(): string {
    if (this.numeroDocumentoInterno) {
      return this.numeroDocumentoInterno;
    }
    if (this.idOrdenCompraHeader > 0) {
      return `Borrador #${this.idOrdenCompraHeader}`;
    }
    return this.esOrdenCompra ? 'Se asignará al emitir (OC-)' : 'Se asignará al confirmar';
  }

  get monedaSimbolo(): string {
    return this.monedas.find(m => m.codigo === this.moneda)?.simbolo ?? this.moneda;
  }

  get vencimientoAplica(): boolean {
    return this.condicionFactura === 'Credito';
  }

  get almacenNombre(): string {
    const a = this.almacenes.find(x => x.idAlmacen === Number(this.idAlmacen));
    return a?.nombre || '—';
  }

  get estadoClase(): string {
    const map: Record<string, string> = {
      BORRADOR: 'estado-borrador',
      EMITIDA: 'estado-confirmada',
      ENVIADA: 'estado-parcial',
      FACTURADA: 'estado-pagada',
      CONFIRMADA: 'estado-confirmada',
      PARCIALMENTE_PAGADA: 'estado-parcial',
      PAGADA: 'estado-pagada',
      ANULADA: 'estado-anulada'
    };
    return map[this.estado] || 'estado-borrador';
  }

  get lineaPreviewTotal(): number {
    return (this.cantidad * this.precioCompra) - this.descuento + this.itbis;
  }

  get esBorrador(): boolean {
    return this.estado === 'BORRADOR';
  }

  get esOrdenEmitida(): boolean {
    return this.esOrdenCompra
      && (this.estado === 'EMITIDA' || this.estado === 'ENVIADA');
  }

  get idEmpresa(): number {
    return this.parametro.GetIdEmpresa();
  }

  etiquetaTipo = etiquetaTipoComportamiento;
  claseTipo = claseBadgeTipoComportamiento;

  get requiereAlmacenDocumento(): boolean {
    return this.detalles.some(d =>
      requiereAlmacen(d.tipoComportamientoLinea)
    );
  }

  onCondicionPagoChange(condicion: 'Contado' | 'Credito'): void {
    this.condicionFactura = condicion;
    if (condicion === 'Credito' && !this.fechaVencimiento) {
      const venc = new Date();
      venc.setDate(venc.getDate() + 15);
      this.fechaVencimiento = venc.toISOString().substring(0, 10);
    }
    this.sincronizarFormaPagoDgii(true);
  }

  onFormaPagoOperativaChange(): void {
    this.sincronizarFormaPagoDgii(true);
  }

  /** Fuerza remapear forma DGII desde el método operativo. */
  sincronizarFormaPagoDgii(forzarAuto = false): void {
    if (forzarAuto) {
      this.formaPagoDgiiAuto = true;
    }
    if (this.formaPagoDgiiAuto) {
      this.formaPagoDgii = sugerirFormaPagoDgii(this.condicionFactura, this.formaPago);
    }
  }

  onFormaPagoDgiiManualChange(): void {
    this.formaPagoDgiiAuto = false;
  }

  get etiquetaFormaPagoDgiiActual(): string {
    return etiquetaFormaPagoDgii(this.formaPagoDgii);
  }

  /** Reparte el neto (sin ITBIS) en Servicios vs Bienes según tipo de línea. */
  recalcularMontosDgii(): void {
    let servicios = 0;
    let bienes = 0;
    for (const d of this.detalles) {
      const neto = Math.max(0, (d.cantidad * d.precioCompra) - (d.descuento || 0));
      const tipo = normalizarTipoComportamiento(d.tipoComportamientoLinea);
      if (tipo === TIPO_COMPORTAMIENTO.SERVICIO) {
        servicios += neto;
      } else {
        bienes += neto;
      }
    }
    this.montoFacturadoServicios = Math.round(servicios * 100) / 100;
    this.montoFacturadoBienes = Math.round(bienes * 100) / 100;
  }

  onMontosDgiiManualChange(): void {
    this.autoMontosDgii = false;
  }

  onAplicaRetencionChange(activa: boolean): void {
    this.aplicaRetencion = !!activa;
    if (!this.aplicaRetencion) {
      this.limpiarRetenciones();
    } else if (!this.fechaPagoFiscal) {
      this.fechaPagoFiscal = this.fechaDocumento;
    }
  }

  private limpiarRetenciones(): void {
    this.itbisRetenido = 0;
    this.tipoRetencionIsr = null;
    this.montoRetencionRenta = 0;
    this.fechaPagoFiscal = '';
  }

  private buildRequest(): GuardarFacturaCompraRequest {
    const fechaVencimiento =
      this.condicionFactura === 'Credito' && this.fechaVencimiento
        ? this.fechaVencimiento
        : undefined;

    if (this.autoMontosDgii) {
      this.recalcularMontosDgii();
    }

    if (!this.aplicaRetencion) {
      this.limpiarRetenciones();
    }

    return {
      idOrdenCompraHeader: this.idOrdenCompraHeader,
      idEmpresa: this.parametro.GetIdEmpresa(),
      idProveedor: Number(this.idProveedor),
      numeroComprobanteProveedor: this.numeroComprobante || undefined,
      ncfModificado: this.ncfModificado || undefined,
      fechaDocumento: this.fechaDocumento,
      condicionFactura: this.condicionFactura,
      fechaVencimiento,
      idAlmacen: this.idAlmacen,
      comentario: this.comentario || undefined,
      idTipoBienesServicios: this.idTipoBienesServicios,
      formaPagoDgii: this.formaPagoDgii,
      montoFacturadoServicios: this.montoFacturadoServicios,
      montoFacturadoBienes: this.montoFacturadoBienes,
      itbisRetenido: this.aplicaRetencion ? (this.itbisRetenido || 0) : 0,
      itbisProporcionalidad: this.itbisProporcionalidad || 0,
      itbisLlevadoAlCosto: this.itbisLlevadoAlCosto || 0,
      tipoRetencionIsr: this.aplicaRetencion ? this.tipoRetencionIsr : null,
      montoRetencionRenta: this.aplicaRetencion ? (this.montoRetencionRenta || 0) : 0,
      fechaPagoFiscal: this.aplicaRetencion && this.fechaPagoFiscal
        ? this.fechaPagoFiscal
        : undefined,
      destinoItbis: this.mostrarClasificacionItbis ? this.destinoItbis : null,
      clasificacionConfirmada: this.mostrarClasificacionItbis && this.clasificacionConfirmada,
      itbisComprasLocales: this.mostrarClasificacionItbis ? (this.itbisComprasLocales || 0) : 0,
      itbisServicios: this.mostrarClasificacionItbis ? (this.itbisServicios || 0) : 0,
      itbisImportaciones: this.mostrarClasificacionItbis ? (this.itbisImportaciones || 0) : 0,
      detalles: this.detalles.map(d => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioCompra: d.precioCompra,
        descuento: d.descuento,
        itbis: d.itbis
      }))
    };
  }

  private mensajeValidacionBase(): string | null {
    if (!this.idProveedor) {
      return 'Seleccione un proveedor';
    }
    if (!this.detalles.length) {
      return 'Agregue al menos una línea con el botón + AGREGAR';
    }
    if (this.condicionFactura === 'Credito' && !this.fechaVencimiento) {
      return 'Indique la fecha de vencimiento del crédito';
    }
    if (!this.esOrdenCompra) {
      if (!this.idTipoBienesServicios) {
        return 'Seleccione el Tipo de Bienes y Servicios (DGII 606)';
      }
      if (!this.formaPagoDgii) {
        return 'Seleccione la Forma de Pago DGII (606)';
      }
      if (this.aplicaRetencion) {
        if (!this.fechaPagoFiscal) {
          return 'Indique la Fecha de pago fiscal de la retención';
        }
        if (!(this.itbisRetenido > 0) && !(this.montoRetencionRenta > 0)) {
          return 'Indique al menos un monto de retención (ITBIS o ISR), o desactive retención';
        }
        if (this.montoRetencionRenta > 0 && !this.tipoRetencionIsr) {
          return 'Seleccione el Tipo de retención ISR';
        }
      }
    }
    return null;
  }

  private mensajeErrorHttp(e: any, fallback: string): string {
    if (e?.error?.message) {
      return String(e.error.message);
    }
    const errors = e?.error?.errors;
    if (errors && typeof errors === 'object') {
      for (const value of Object.values(errors)) {
        if (Array.isArray(value) && value.length) {
          return String(value[0]);
        }
        if (value) {
          return String(value);
        }
      }
    }
    return fallback;
  }

  guardarBorrador() {
    const error = this.mensajeValidacionBase();
    if (error) {
      this.toast(error);
      return;
    }
    this.procesando = true;
    const req$ = this.esOrdenCompra
      ? this.comprasService.guardarBorradorOrden(this.buildRequest())
      : this.comprasService.guardarBorrador(this.buildRequest());

    req$.subscribe({
      next: (res) => {
        this.procesando = false;
        this.idOrdenCompraHeader = res?.data?.idOrdenCompraHeader || this.idOrdenCompraHeader;
        this.toast('Borrador guardado');
        if (this.idOrdenCompraHeader) {
          const ruta = this.esOrdenCompra
            ? ['/compras/ordenes', this.idOrdenCompraHeader]
            : ['/compras', this.idOrdenCompraHeader];
          this.router.navigate(ruta, { replaceUrl: true });
        }
      },
      error: (e) => {
        this.procesando = false;
        this.toast(this.mensajeErrorHttp(e, 'Error guardando borrador'));
      }
    });
  }

  /** Visible solo con IT-1 activo; nunca bloquea confirmación/recepción. */
  get mostrarClasificacionItbis(): boolean {
    return this.parametro.isGenerarIt1();
  }

  async confirmar() {
    if (this.esOrdenCompra) {
      await this.emitirOrden();
      return;
    }
    if (this.estado !== 'BORRADOR') {
      this.toast('Solo se confirman borradores');
      return;
    }
    const error = this.mensajeValidacionBase();
    if (error) {
      this.toast(error);
      return;
    }
    if (this.condicionFactura === 'Contado' && !this.formaPago) {
      this.toast('Seleccione forma de pago');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar factura',
      message: 'Se asignará FACTC y se registrará CxP o el pago de contado. El inventario no aumenta; Almacén recibirá luego.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.procesando = true;
            this.comprasService.guardarBorrador(this.buildRequest()).subscribe({
              next: (res) => {
                const id = res?.data?.idOrdenCompraHeader || this.idOrdenCompraHeader;
                this.idOrdenCompraHeader = id;
                this.comprasService.confirmar(id, {
                  idEmpresa: this.parametro.GetIdEmpresa(),
                  idUsuario: this.parametro.IdUsuario || 0,
                  formaPago: this.condicionFactura === 'Contado' ? this.formaPago : undefined
                }).subscribe({
                  next: () => {
                    this.procesando = false;
                    this.toast('Factura confirmada');
                    this.router.navigate(['/compras/facturas']);
                  },
                  error: (e) => {
                    this.procesando = false;
                    this.toast(this.mensajeErrorHttp(e, 'Error al confirmar'));
                  }
                });
              },
              error: (e) => {
                this.procesando = false;
                this.toast(this.mensajeErrorHttp(e, 'Error guardando borrador'));
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async emitirOrden() {
    if (this.estado !== 'BORRADOR') {
      this.toast('Solo se emiten borradores');
      return;
    }
    const error = this.mensajeValidacionBase();
    if (error) {
      this.toast(error);
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Emitir orden de compra',
      message: 'Se asignará el número OC-xxxx. No genera CxP ni inventario. Luego podrás enviarla al proveedor.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Emitir',
          handler: () => {
            this.procesando = true;
            this.comprasService.guardarBorradorOrden(this.buildRequest()).subscribe({
              next: (res) => {
                const id = res?.data?.idOrdenCompraHeader || this.idOrdenCompraHeader;
                this.idOrdenCompraHeader = id;
                this.comprasService.emitirOrden(id, {
                  idEmpresa: this.parametro.GetIdEmpresa(),
                  idUsuario: this.parametro.IdUsuario || 0
                }).subscribe({
                  next: (r) => {
                    this.procesando = false;
                    this.estado = r?.data?.estado || 'EMITIDA';
                    this.numeroDocumentoInterno = r?.data?.numeroDocumento || '';
                    this.toast('Orden emitida');
                    this.router.navigate(['/compras/ordenes', id], { replaceUrl: true });
                    this.cargarFactura(id);
                  },
                  error: (e) => {
                    this.procesando = false;
                    this.toast(this.mensajeErrorHttp(e, 'Error al emitir'));
                  }
                });
              },
              error: (e) => {
                this.procesando = false;
                this.toast(this.mensajeErrorHttp(e, 'Error guardando borrador'));
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async enviarOrdenProveedor() {
    if (!this.esOrdenEmitida) {
      return;
    }
    const proveedor = this.proveedores.find(p => p.idProveedor === Number(this.idProveedor));
    const alert = await this.alertCtrl.create({
      header: 'Enviar orden al proveedor',
      message: 'Marca la OC como enviada. El correo SMTP automático se completará en la siguiente fase.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email proveedor',
          value: proveedor?.email || ''
        },
        {
          name: 'mensaje',
          type: 'textarea',
          placeholder: 'Mensaje opcional'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Marcar enviada',
          handler: (data) => {
            this.procesando = true;
            this.comprasService.enviarOrden(this.idOrdenCompraHeader, {
              idEmpresa: this.parametro.GetIdEmpresa(),
              idUsuario: this.parametro.IdUsuario || 0,
              emailDestino: data?.email,
              mensaje: data?.mensaje
            }).subscribe({
              next: (r) => {
                this.procesando = false;
                this.toast(r?.message || 'Orden marcada como enviada');
                this.cargarFactura(this.idOrdenCompraHeader);
              },
              error: (e) => {
                this.procesando = false;
                this.toast(this.mensajeErrorHttp(e, 'Error al enviar'));
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async generarFacturaDesdeOrden() {
    if (!this.esOrdenEmitida) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Crear factura desde OC',
      message: 'Se creará un borrador FACTC con las mismas líneas. Luego confirmas la factura (CxP) y Almacén recibe.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear factura',
          handler: () => {
            this.procesando = true;
            this.comprasService.generarFacturaDesdeOrden(
              this.idOrdenCompraHeader,
              this.parametro.GetIdEmpresa(),
              this.parametro.IdUsuario || 0
            ).subscribe({
              next: (r) => {
                this.procesando = false;
                const idFactura = r?.data?.idOrdenCompraHeader;
                this.toast('Factura borrador creada');
                if (idFactura) {
                  this.router.navigate(['/compras', idFactura]);
                }
              },
              error: (e) => {
                this.procesando = false;
                this.toast(this.mensajeErrorHttp(e, 'Error generando factura'));
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  volver() {
    this.router.navigate(this.esOrdenCompra ? ['/compras/ordenes'] : ['/compras/facturas']);
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'medium' });
    await t.present();
  }
}
