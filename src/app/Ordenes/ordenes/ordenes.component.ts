// =========================================
// LISTADO DE ÓRDENES / COTIZACIONES
// =========================================

import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { IonModal, ModalController,AlertController,ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { facturaheader, idClienteDeFactura, normalizarIdClienteFactura } from 'src/app/models/facturaheader';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PosOfflineService, NOTA_TICKET_LOCAL } from 'src/app/servicios/pos-offline.service';
import { crearGuidCobro, esErrorRedCobro } from 'src/app/servicios/cobro-idempotencia';
import { Input } from '@angular/core';
import { FactDetalleService } from 'src/app/servicios/fact-detalle.service';
import { CuentaxPagarComponent } from 'src/app/CuentaxPagar/cuentax-pagar/cuentaxpagar.component';
import { ClienteVozComponent } from 'src/app/modals/cliente-voz/cliente-voz.component';
import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';
import { Empleado } from 'src/app/models/empleado.models';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { PrintService } from 'src/app/servicios/print.services';
import { PrinterComponent } from 'src/app/printer/printer.component';
import { ParametroConfigService } from 'src/app/servicios/parametrosconfig.service';
import { ProduccionService } from 'src/app/servicios/produccion.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ordenes',
  templateUrl: './ordenes.component.html',
  styleUrls: ['./ordenes.component.scss'],
})

export class OrdenesComponent implements OnInit {

  @ViewChild(IonModal) _modal!: IonModal;
  @Input() modo: 'editar' | 'seleccionar' = 'editar';
procesandoPago = false;
  NombreCliente: string = "";
  empleados: Empleado[] = [];
  CodigoEmpleado: string = "";
  accordionActivo: string | number | null = null;
  @Input() tipoDocumento: 'Orden' | 'Cotizacion' = 'Orden';
  @Input() esModal: boolean = false;
  puedeEliminarOrden: boolean = false;
  cargando = false;
  filtroCliente = '';
  idSucursalFiltro = 0;

  /** Parámetro ESTATUS_ORDENES: muestra estado del Centro de Producción (HTTP, sin SignalR). */
  mostrarEstatusOrdenes = false;
  printTicketLavador = false;
  private estatusPorOrigen = new Map<number, { codigo: string; nombre: string }>();

  get ordenesFiltradas(): facturaheader[] {
    const q = (this.filtroCliente || '').trim().toLowerCase();
    const list = this._Parametro.ListadoOrdenes || [];
    if (!q) return list;
    return list.filter(o => {
      const nombre = (
        o.clientes?.nombreComercial ||
        (o as any).nombreCuenta ||
        ''
      ).toLowerCase();
      const numero = String(o.numeroDocumento || o.idFacturaHeader || '');
      return nombre.includes(q) || numero.toLowerCase().includes(q);
    });
  }

  get totalOrdenes(): number {
    return this.ordenesFiltradas
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  }

  get mostrarSucursalEnFila(): boolean {
    return this.idSucursalFiltro === 0
      && (this._Parametro.sucursales || []).filter(s => s?.activa !== false).length > 1;
  }

  onFiltroSucursal(id: number): void {
    const next = Number(id) || 0;
    if (next === this.idSucursalFiltro) return;
    this.idSucursalFiltro = next;
    this.RefreshOrdenes();
  }

  indiceOrden(item: facturaheader): number {
    return (this._Parametro.ListadoOrdenes || [])
      .findIndex(o => o.idFacturaHeader === item.idFacturaHeader);
  }
  constructor(
    private modal: ModalController,
    public _Parametro: ParametrosService,
    private _Router: Router,
    private _FactDetalle: FactDetalleService,
    private _FacturaHeader: FacturaHeaderService,
      private alertController: AlertController,
      private empleadosService: EmpleadosService,
      private toastCtrl: ToastController,
      private printService: PrintService,
      private parametroConfig: ParametroConfigService,
      private produccion: ProduccionService,
      private cdr: ChangeDetectorRef,
      private offline: PosOfflineService
      
  ) {}
  seleccionarOrden(orden: any) {
  if (this.modo === 'seleccionar') {
    this.modal.dismiss({ ordenSeleccionada: orden });
    return;
  }

  // modo editar (móvil) se queda como ya lo tienes
}
cargarEmpleadosEmpresa() {

  const idEmpresa = this._Parametro.IdEmpresa;

  this.empleadosService.getByEmpresa(idEmpresa).subscribe({
    next: res => {
      this.empleados = res || [];
    },
    error: () => {
      this.toast('Error cargando empleados');
    }
  });

}
actualizarPrecio(idDetalle:number, precio:number){

  this._FactDetalle
      .actualizarPrecioDetalle(idDetalle, precio)
      .subscribe({

        next: () => {
          this.LoadListaFactura(); // 🔥 refresca orden
        },

        error: err => {
          console.log(err);
          alert("Error actualizando precio");
        }

      });

}
  ngOnInit() {
    this.RefreshOrdenes();
    this.cargarEmpleadosEmpresa();
     this.puedeEliminarOrden =
    this._Parametro.puedeEliminarOrden;
    this.cargarFlagPrintTicketLavador();
    if (this.tipoDocumento === 'Orden') {
      this.cargarFlagEstatusOrdenes();
    }
  }

  private cargarFlagPrintTicketLavador(): void {
    const idEmpresa = this._Parametro.IdEmpresa || this._Parametro.GetIdEmpresa();
    this.parametroConfig.getParametrosEmpresa(idEmpresa).subscribe({
      next: (params) => {
        const p = (params || []).find(x => x.clave === 'PrintTicketLavador');
        const valor = String(p?.valor ?? '').toLowerCase();
        this.printTicketLavador = valor === 'true' || valor === '1';
        this._Parametro.PrintTicketLavador = this.printTicketLavador;
      },
      error: () => {
        this.printTicketLavador = false;
      }
    });
  }

  private cargarFlagEstatusOrdenes(): void {
    const idEmpresa = this._Parametro.IdEmpresa || this._Parametro.GetIdEmpresa();
    this.parametroConfig.getParametrosEmpresa(idEmpresa).subscribe({
      next: (params) => {
        const p = (params || []).find(x => x.clave === 'ESTATUS_ORDENES');
        const valor = String(p?.valor ?? '').toLowerCase();
        this.mostrarEstatusOrdenes = valor === 'true' || valor === '1';
        if (this.mostrarEstatusOrdenes) {
          void this.cargarEstatusProduccion();
        }
      },
      error: () => {
        this.mostrarEstatusOrdenes = false;
      }
    });
  }

  private async cargarEstatusProduccion(): Promise<void> {
    if (!this.mostrarEstatusOrdenes) return;
    const idEmpresa = this._Parametro.IdEmpresa || this._Parametro.GetIdEmpresa();
    const origenIds = (this._Parametro.ListadoOrdenes || [])
      .map(o => o.idFacturaHeader)
      .filter(id => id > 0);
    if (!origenIds.length) {
      this.estatusPorOrigen.clear();
      this.cdr.detectChanges();
      return;
    }
    try {
      const list = await firstValueFrom(this.produccion.estadosPorOrigen(idEmpresa, origenIds));
      this.estatusPorOrigen.clear();
      (list || []).forEach(e => {
        this.estatusPorOrigen.set(e.origenId, {
          codigo: e.codigoEstado || '',
          nombre: e.nombreEstado || e.codigoEstado || ''
        });
      });
      this.cdr.detectChanges();
    } catch {
      /* sin motor / sin permiso: no romper listado */
    }
  }

  etiquetaEstatus(idFacturaHeader: number): string {
    const e = this.estatusPorOrigen.get(idFacturaHeader);
    if (!e) return 'Sin estatus';
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_PREPARACION: 'Preparación',
      LISTA: 'Lista',
      ENTREGADA: 'Entregada',
      CANCELADA: 'Cancelada'
    };
    return map[e.codigo] || e.nombre || e.codigo;
  }

  iconoEstatus(idFacturaHeader: number): string {
    const e = this.estatusPorOrigen.get(idFacturaHeader);
    if (!e) return 'help-circle-outline';
    switch (e.codigo) {
      case 'PENDIENTE': return 'time-outline';
      case 'EN_PREPARACION': return 'flame-outline';
      case 'LISTA': return 'checkmark-circle';
      case 'ENTREGADA': return 'bicycle-outline';
      case 'CANCELADA': return 'close-circle';
      default: return 'ellipse-outline';
    }
  }

  claseEstatus(idFacturaHeader: number): string {
    const e = this.estatusPorOrigen.get(idFacturaHeader);
    if (!e) return 'est-sin';
    switch (e.codigo) {
      case 'PENDIENTE': return 'est-pendiente';
      case 'EN_PREPARACION': return 'est-preparacion';
      case 'LISTA': return 'est-lista';
      case 'ENTREGADA': return 'est-entregada';
      case 'CANCELADA': return 'est-cancelada';
      default: return 'est-pendiente';
    }
  }
  private async toast(message: string) {

  const t = await this.toastCtrl.create({
    message,
    duration: 2000,
    position: 'bottom',
    color: 'dark'
  });

  await t.present();

}
async seleccionarTipoDocumento() {
  // Nueva orden: nunca reutilizar una IdFacturaHeader de una edición previa
  // (si no, el carrito agrega ítems a la orden vieja).
  this._Parametro.IdFacturaHeader = 0;
  this._Parametro.ListadoProductosCate = [];
  this._Parametro.Cart = 0;
  this._Parametro.Total = 0;
  this._Parametro.TipoDocumento = 'ORDEN';
  this.openModalVoz();
}
  // ==============================
  // MODAL CLIENTE POR VOZ
  // ==============================
 async cambiarLavador(itemDetalle: any) {

  const alert = await this.alertController.create({
    header: 'Cambiar Lavador',

    inputs: this.empleados.map(e => ({
      type: 'radio',
      label: e.nombre,
      value: e.idEmpleados,
      checked: e.idEmpleados === itemDetalle.idEmpleadoComision
    })),

    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Aplicar',
        handler: (idEmpleadoSeleccionado) => {

          if (!idEmpleadoSeleccionado) return;

          const emp = this.empleados.find(x => x.idEmpleados === idEmpleadoSeleccionado);

          itemDetalle.idEmpleadoComision = idEmpleadoSeleccionado;
          itemDetalle.nombreEmpleadoComision = emp?.nombre;

          // 🔥 guardar en backend
          this._FactDetalle
            .cambiarEmpleadoDetalle(
              itemDetalle.idFacturaDetalle,
              idEmpleadoSeleccionado
            )
            .subscribe(() => {
              this.toast('Lavador actualizado ✅');
            });

        }
      }
    ]
  });

  await alert.present();
}

async openModalVoz() {
  const modal = await this.modal.create({
    component: ClienteVozComponent,
  });

  await modal.present();

  modal.onDidDismiss().then(r => {

    console.log("🔍 DATA RECIBIDA:", r.data);

    // 👈 Soporta ambos casos:
    // 1) { cliente: {...} }
    // 2) {...} directamente
    const cliente = r.data?.cliente ?? r.data;

    if (!cliente) {
      console.warn("⚠️ No se recibió cliente desde el modal.");
      return;
    }

    console.log("✅ Cliente recibido desde modal de voz:", cliente);

    this.NombreCliente = cliente.nombreComercial;
    this._Parametro.NombreCliente = cliente.nombreComercial;
    this._Parametro.IdCliente = cliente.idCliente;

    if (this.modo === 'editar') {
  this._Router.navigateByUrl('/Categoria');
}
  });

}
async editarPrecio(detalle:any){

  const alert = await this.alertController.create({
    header: 'Editar precio',
    inputs: [
      {
        name: 'precio',
        type: 'number',
        value: detalle.subTotal,
        placeholder: 'Nuevo precio'
      }
    ],
    buttons: [
      { text:'Cancelar', role:'cancel' },
      {
        text:'Guardar',
        handler: (data)=>{
          this.actualizarPrecio(detalle.idFacturaDetalle, data.precio);
        }
      }
    ]
  });

  await alert.present();
}
CargarListaFactura() {
  this.accordionActivo = null;

  this._Parametro.LoadListaFactura();

  // Recalcular totales después de cargar la lista
 
    this._Parametro.ListadoOrdenes.forEach((_, index) => {
      this.GetTotal(index);
    });
  
}

imprimirOrden(idFactura: number, event?: Event) {

  event?.stopPropagation();

  if (this.tipoDocumento === 'Cotizacion') {
    const cotizacion =
      this._Parametro.ListadoOrdenes
        .find(x => x.idFacturaHeader === idFactura);

    if (!cotizacion) {
      this.toast('No se encontró la cotización');
      return;
    }

    this.printService.openCotizacionCarta(cotizacion, true);
    return;
  }

  const apiPrint = (this._Parametro.ApiPrint || '').trim();
  const ordenLocal = this._Parametro.ListadoOrdenes
    .find(x => x.idFacturaHeader === idFactura);

  if (this.esLocal(ordenLocal)) {
    void this.printService.openTicketPosPreview(idFactura, {
      ...ordenLocal,
      notaLocal: NOTA_TICKET_LOCAL
    });
    return;
  }

  if (!apiPrint) {
    this.toast('No hay impresora configurada (ApiPrint). Configure el agente de impresión.');
    return;
  }

  this.printService
    .printTicket(
      idFactura,
      this._Parametro.IdEmpresa
    )
    .subscribe({
      next: (resp: any) => {
        if (resp && resp.success === false) {
          this.toast(resp.message || 'No se pudo imprimir la orden');
          return;
        }
        this.toast('Orden enviada a imprimir');
      },
      error: (err) => {
        console.error('❌ Error imprimiendo orden:', err);
        const detalle =
          err?.error?.message ||
          err?.message ||
          'Revise el agente de impresión y el nombre de la impresora.';
        this.toast(`Error imprimiendo orden: ${detalle}`);
      }
    });
}
  RefreshOrdenes() {
  this.accordionActivo = null;
  this.cargando = true;
  this._Parametro.ListadoOrdenes = [];

  const aplicar = async (servidor: facturaheader[]) => {
    const idPrincipal = (this._Parametro.sucursales || []).find(s => s.esPrincipal)?.idSucursal
      || this._Parametro.IdSucursal;
    const idsPermitidos = new Set(
      (this._Parametro.sucursales || [])
        .filter(s => s?.activa !== false)
        .map(s => s.idSucursal)
    );
    let locales: facturaheader[] = [];
    try {
      locales = (await this.offline.listarOrdenesLocales(this._Parametro.IdEmpresa))
        .filter(x => this.tipoDocumento === 'Cotizacion'
          ? Number(x.idTipoDocumentos) === 2
          : Number(x.idTipoDocumentos) !== 2)
        .filter(x => {
          const id = Number((x as any).idSucursal) > 0
            ? Number((x as any).idSucursal)
            : Number(idPrincipal) || 0;
          if (this.idSucursalFiltro > 0) return id === this.idSucursalFiltro;
          return idsPermitidos.size === 0 || idsPermitidos.has(id);
        });
    } catch {
      locales = [];
    }
    this._Parametro.ListadoOrdenes = [...locales, ...(servidor || [])]
      .map(normalizarIdClienteFactura)
      .map(o => {
        if (!Array.isArray(o.facturaDetalles)) {
          o.facturaDetalles = [];
        }
        return o;
      });

    if (this.tipoDocumento !== 'Cotizacion') {
      this._Parametro.ListadoOrdenes.forEach((_, i) => this.GetTotal(i));
      if (this.mostrarEstatusOrdenes) {
        this.cargarEstatusProduccion();
      }
    }
    this.cargando = false;
    this.cdr.markForCheck();
  };

  const peticion =
    this.tipoDocumento === 'Cotizacion'
      ? this._FacturaHeader.GetListadoCotizaciones(this._Parametro.IdEmpresa, this.idSucursalFiltro)
      : this._FacturaHeader.GetListadoOrdenes(this._Parametro.IdEmpresa, this.idSucursalFiltro);

  peticion.subscribe({
      next: c => {
        void aplicar(c || []);
      },
      error: (err) => {
        if (esErrorRedCobro(err)) {
          void aplicar([]);
          return;
        }
        const tipo = this.tipoDocumento === 'Cotizacion' ? 'cotizaciones' : 'órdenes';
        console.error(`❌ Error cargando ${tipo}`, err);
        this.cargando = false;
        this.cdr.markForCheck();
        this.toast(
          `Error cargando ${tipo}` +
          (err?.status ? ` (${err.status} ${err.statusText || ''})`.trim() : '')
        );
      }
    });
}


//});

//}


  cancelm() {
    this.modal.dismiss();
  }

  esHoy(fecha: string | Date): boolean {
    const hoy = new Date();
    const fechaItem = new Date(fecha);
    return (
      fechaItem.getFullYear() === hoy.getFullYear() &&
      fechaItem.getMonth() === hoy.getMonth() &&
      fechaItem.getDate() === hoy.getDate()
    );
  }

  onAccordionChange(event: any) {
    this.accordionActivo = event.detail.value;
  }

  trackByFactura(index: number, item: facturaheader) {
    return item.idFacturaHeader;
  }

  cancel() {
    this._modal.dismiss(this.NombreCliente);
  }

  UpdateCantidad(Iddetalle:number,cantidad:number) {
    this._FactDetalle.ActualizarCantidad(Iddetalle, cantidad)
      .subscribe(() => {
        this._Parametro.LoadListaFactura();
      });
  }
async presentAlert(mensaje: string) {
  const alert = await this.alertController.create({
    header: 'Validación',
    message: mensaje,
    buttons: ['OK'],
    backdropDismiss: false // 🚫 no deja cerrar tocando fuera
  });

  await alert.present();
}
  // ==============================
  // ACCIONES SOBRE ÓRDENES
  // ==============================
  EliminarFactura(IdFactura: number) {
    const factura = this._Parametro.ListadoOrdenes
      .find(c => c.idFacturaHeader == IdFactura);
    if (this.esLocal(factura)) {
      void this.offline.eliminarLocal(this._Parametro.IdEmpresa, IdFactura).then(() => {
        this.RefreshOrdenes();
      });
      return;
    }
    this._FacturaHeader.DeleteIten(IdFactura).subscribe(() => {
      this._Parametro.LoadListaFactura();
    });
  }
getPendiente(iten: any): number {
  const total = Number(iten?.total ?? 0);
  const pagado = Number(iten?.pagado ?? 0);
  return Math.max(0, total - pagado);
}

private esLocal(f: any): boolean {
  return !!f?._offlineLocal || Number(f?.idFacturaHeader) < 0;
}

private dtoCobroDesdeOrden(factura: any, data: any) {
  return {
    idempotencyKey: crearGuidCobro(),
    header: {
      idEmpresa: this._Parametro.IdEmpresa,
      idUsuario: this._Parametro.IdUsuario,
      idCliente: data.idCliente || idClienteDeFactura(factura) || null,
      iDCliente: data.idCliente || idClienteDeFactura(factura) || null,
      tipoFactura: data.tipoFactura || 'Contado',
      tipoComprobante: 'FACT',
      idFacturaHeader: this.esLocal(factura) ? 0 : factura.idFacturaHeader,
      idTipoDocumentos: 1,
      nombreEmpresa: data.nombreFiscal
        || factura.nombreEmpresa
        || factura.nombreCuenta
        || factura.clientes?.nombreComercial
        || 'Al Portador',
      nombreCuenta: factura.nombreCuenta
        || factura.clientes?.nombreComercial
        || 'Al Portador',
      subTotal: factura.subTotal,
      totalDescuento: factura.totalDescuento,
      totalItbis: factura.totalItbis,
      total: factura.total,
      facturaDetalles: (factura.facturaDetalles || []).map((d: any) => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        idEmpleadoComision: d.idEmpleadoComision || 0,
        precioOferta: d.precioOferta || d.precio,
        descuento: d.descuento || 0,
        itbis: d.itbis || 0
      }))
    },
    pagos: (data.pagos || []).map((p: any) => ({
      metodo: p.metodo,
      monto: p.monto,
      idSaldoAFavor: p.idSaldoAFavor ?? null,
      idNotaCredito: p.idNotaCredito ?? null,
      ncfNotaCredito: p.ncfNotaCredito ?? null
    }))
  };
}

private async cobrarOrdenLocal(factura: any, data: any, IdFact: number): Promise<void> {
  const dto = this.dtoCobroDesdeOrden(factura, data);
  const ticket = {
    ...factura,
    notaLocal: NOTA_TICKET_LOCAL,
    tipoFactura: data.tipoFactura || 'Contado',
    pagado: Number(data.pagado ?? factura.total),
    pendiente: Number(data.pendiente ?? 0)
  };
  if (this.esLocal(factura)) {
    await this.offline.eliminarLocal(this._Parametro.IdEmpresa, factura.idFacturaHeader);
  }
  const item = await this.offline.encolarFactura(this._Parametro.IdEmpresa, dto, ticket);
  ticket.numeroDocumento = item.ticket?.numeroDocumento || ticket.numeroDocumento;
  if (data.imprimir) {
    await this.printService.openTicketPosPreview(item.idLocal, ticket);
  }
  const index = this._Parametro.ListadoOrdenes
    .findIndex(c => c.idFacturaHeader == IdFact);
  if (index !== -1) {
    this._Parametro.ListadoOrdenes.splice(index, 1);
  }
  this.toast('Cobro local sin NCF ni e-CF. Se registrará en el ERP al reconectar.');
  this.procesandoPago = false;
}

 async PagarFact(IdFact: number) {

  if (this.procesandoPago) return;
  this.procesandoPago = true;

  this.NombreCliente = "";

  const factura = this._Parametro.ListadoOrdenes
    .find(c => c.idFacturaHeader == IdFact);

  if (!factura) {
    this.procesandoPago = false;
    return;
  }

  const total = Number(factura.total ?? 0);
  const pagado = Number(factura.pagado ?? 0);
  const pendiente = Math.max(0, total - pagado);
  const local = this.esLocal(factura);

  const modal = await this.modal.create({
    component: CuentaxPagarComponent,
    cssClass: 'modal-factura-full',
    componentProps: {
      IdFactPay: local ? 0 : factura.idFacturaHeader,
      TotalFactura: pendiente,
      IdCliente: idClienteDeFactura(factura) || null,
      NombreCliente: factura.nombreCuenta
        || factura.nombreEmpresa
        || factura.clientes?.nombreComercial
        || null,
      UsaCxC: this._Parametro.tieneModulo('CUENTAS_COBRAR'),
      FacturacionElectronica: false
    }
  });

  await modal.present();

  const { data, role } = await modal.onDidDismiss();

  if (role === 'ok' && data) {

    const tipo = (data.tipoFactura || '').trim().toLowerCase();

    if (tipo === 'contado' && (!data.pagos || data.pagos.length === 0)) {
      console.warn("⚠️ No hay pagos");
      this.procesandoPago = false;
      return;
    }

    if (local) {
      await this.cobrarOrdenLocal(factura, data, IdFact);
      return;
    }

    // 🔥 TU DTO ORIGINAL (SIN TOCAR)
    const dto: any = {
      idFactura: factura.idFacturaHeader,
      tipoFactura: data.tipoFactura,
      idCliente: data.idCliente,
      imprimirFactura: data.imprimir,
      formaPago:
        data.pagos.length > 1
          ? 'Mixto'
          : (data.pagos[0]?.metodo ?? 'Efectivo'),
      detallePagos: [],
      detalleAbono: []
    };

    if (data.tipoFactura === 'Contado') {
      dto.detallePagos = data.pagos;
    }

    if (data.tipoFactura === 'Credito') {
      dto.detalleAbono = data.pagos || [];
      dto.plazoDias = data.plazoDias ?? 30;
    }

    console.log("📦 DTO enviado:", dto);

    this._FacturaHeader.GenerateFacts(dto)
      .subscribe({
        next: async (resp) => {

          console.log("✅ Factura procesada");

          try {

            if (this.printTicketLavador) {
              this.printService.printLavador(dto.idFactura)
                .subscribe({
                  next: () => console.log("🧾 Lavador impreso"),
                  error: err => console.error("❌ Error lavador", err)
                });
            }
       
            if (dto.imprimirFactura) {

              this.printService.printTicket(dto.idFactura, this._Parametro.IdEmpresa)
              .subscribe({
                next: () => console.log("🧾 Factura impresa"),
                error: err => console.error("❌ Error factura", err)
              });
            }

          } catch (error) {
            console.error("❌ Error impresión:", error);
          }

          const index = this._Parametro.ListadoOrdenes
            .findIndex(c => c.idFacturaHeader == IdFact);

          if (index !== -1) {
            this._Parametro.ListadoOrdenes.splice(index, 1);
          }

          const toast = await this.toastCtrl.create({
            message: 'Factura procesada correctamente',
            duration: 1500,
            color: 'success'
          });

          await toast.present();

          this.procesandoPago = false;
        },

        error: async (err) => {
          console.error("❌ Error:", err);
          // Modo local apagado: no cobrar en el teléfono si el API falla.
          const toast = await this.toastCtrl.create({
            message: 'Error procesando la factura',
            duration: 1500,
            color: 'danger'
          });
          await toast.present();
          this.procesandoPago = false;
        }
      });

  } else {
    this.procesandoPago = false;
  }
}
  // ============================================================
  // 🔥 AJUSTADO — DESCUENTO REAL (NO PORCENTAJE)
  // ============================================================
  GetTotal(indexH: number) {
    let subtotal = 0;
    let descuentoItems = 0;

    const factura = this._Parametro.ListadoOrdenes[indexH];
    if (!factura?.facturaDetalles?.length) {
      return;
    }
    const descuentoHeaderOriginal =
      Number(factura.totalDescuento ?? 0);
    const totalOriginal =
      Number(factura.total ?? 0);
    const itbisOriginal =
      Number(factura.totalItbis ?? 0);

    factura.facturaDetalles?.forEach(det => {
      const precioUnit =
        det.precioOferta ||
        det.productos?.precioVenta ||
        0;
      const precioBase = det.cantidad * precioUnit;
      const descUnitario = det.descuento || 0;
      const descTotalItem = descUnitario * det.cantidad;

      det.subTotal = precioBase - descTotalItem;
      subtotal += det.subTotal;
      descuentoItems += descTotalItem;
    });

    factura.subTotal = subtotal;

    if (descuentoItems > 0) {
      factura.totalDescuento = descuentoItems;
      factura.total = subtotal;
      return;
    }

    if (descuentoHeaderOriginal > 0) {
      factura.totalDescuento = descuentoHeaderOriginal;
      factura.total = totalOriginal > 0
        ? totalOriginal
        : subtotal + itbisOriginal - descuentoHeaderOriginal;
      return;
    }

    factura.totalDescuento = 0;
    factura.total = totalOriginal > 0
      ? totalOriginal
      : subtotal;
  }

 GetAmount(indexheader: number, indexdetalle: number) {
  this.GetTotal(indexheader);
}


  ApplyDiscountItem(indexD: number, indexH: number, descuento: number) {
  const detalle = this._Parametro.ListadoOrdenes[indexH].facturaDetalles[indexD];
  detalle.descuento = descuento || 0;
  this.GetAmount(indexH, indexD); // 🔥 FIX
}


  // ==============================
  // CANTIDADES
  // ==============================
 

  AumetarCantidad(indexHeader: number, indexdetalle: number, IdFactDetalle: number) {

  if (this.modo === 'seleccionar') return; // 🔥 protección
  if (this.esLocal(this._Parametro.ListadoOrdenes[indexHeader])) {
    this.toast('Para editar una orden local, ábrala en el POS.');
    return;
  }

  const detalle = this._Parametro.ListadoOrdenes[indexHeader].facturaDetalles[indexdetalle];
  detalle.cantidad++;
  this.GetAmount(indexHeader, indexdetalle);
  this._FactDetalle.ActualizarCantidad(IdFactDetalle, detalle.cantidad);
}

 DisminuirCantidad(indexHeader: number, indexdetalle: number, IdFactDetalle: number) {
  if (this.esLocal(this._Parametro.ListadoOrdenes[indexHeader])) {
    this.toast('Para editar una orden local, ábrala en el POS.');
    return;
  }
  const detalle = this._Parametro.ListadoOrdenes[indexHeader].facturaDetalles[indexdetalle];
  if (detalle.cantidad > 1) {
    detalle.cantidad--;
     this.GetAmount(indexHeader, indexdetalle);// 🔥 FIX
    this._FactDetalle.ActualizarCantidad(IdFactDetalle, detalle.cantidad);
  }
}


  EditOrden(indexH: number) {
    this._Parametro.IdFacturaHeader = this._Parametro.ListadoOrdenes[indexH].idFacturaHeader;
  }

  RemoverItem(IndexHeader: number, IndexDetalle: number, idFacturaDetalle: number, idFacturaHeader: number) {
    const factura = this._Parametro.ListadoOrdenes[IndexHeader];
    if (this.esLocal(factura)) {
      this.toast('Para editar una orden local, ábrala en el POS.');
      return;
    }
    this._Parametro.ListadoOrdenes[IndexHeader].facturaDetalles.splice(IndexDetalle, 1);
    this._FactDetalle.DeleteIten(idFacturaDetalle).subscribe(() => {
      this._Parametro.LoadListaFactura();
    });
  }

  CallCategorias() {
    // Continuar a categorías para orden NUEVA (no editar existente).
    this._Parametro.IdFacturaHeader = 0;
    this._Parametro.NombreCliente = this.NombreCliente;
    this._Router.navigateByUrl('/Categoria');
    this._modal.dismiss();
    this.modal.dismiss();
  }

  AddNewItem(Id: number) {
    const id = Number(Id) || 0;
    if (id <= 0) {
      this.toast('Orden inválida.');
      return;
    }
    this._Parametro.IdFacturaHeader = id;
    this._Parametro.ListadoProductosCate = [];
    this._Parametro.Cart = 0;
    this._Parametro.Total = 0;
    this._Router.navigateByUrl('/Categoria');
  }

 

  LoadListaFactura() {
    this.RefreshOrdenes();
  }
}
