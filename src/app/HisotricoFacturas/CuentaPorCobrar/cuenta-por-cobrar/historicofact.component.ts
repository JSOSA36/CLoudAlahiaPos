// =========================================
// CUENTA POR COBRAR AJUSTADO (DESCUENTO REAL)
// =========================================

import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal, ModalController,AlertController,ToastController ,LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { facturaheader } from 'src/app/models/facturaheader';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { FactDetalleService } from 'src/app/servicios/fact-detalle.service';
import { CuentaxPagarComponent } from 'src/app/CuentaxPagar/cuentax-pagar/cuentaxpagar.component';
import { ClienteVozComponent } from 'src/app/modals/cliente-voz/cliente-voz.component';
import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';
import { Empleado } from 'src/app/models/empleado.models';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { PrintService } from 'src/app/servicios/print.services';
import { DevolucionFacturaComponent } from 'src/app/Modales/devolucion-factura/devolucion-factura.component';
import { AnularFacturaComponent } from 'src/app/Modales/anular-factura/anular-factura.component';
@Component({
  selector: 'app-historicofact',
  templateUrl: './historicofact.component.html',
  styleUrls: ['./historicofact.component.scss'],
})
export class HistoricofactComponent implements OnInit {

  @ViewChild(IonModal) _modal!: IonModal;

  NombreCliente: string = "";
  empleados: Empleado[] = [];
  // 🔥 SEARCH

searchText = '';

// 🔥 BACKUP

facturasOriginal:
  facturaheader[] = [];
  CodigoEmpleado: string = "";
  accordionActivo: string | number | null = null;
puedeEliminarOrden: boolean = false;
cargando: boolean = false;
// 🔥 FILTRO FECHA

desde: string =
  new Date()
  .toISOString()
  .split('T')[0];

hasta: string =
  new Date()
  .toISOString()
  .split('T')[0];

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
      private loadingCtrl: LoadingController
      
  ) {}
 loading?: HTMLIonLoadingElement;
 async mostrarLoading(mensaje = 'Procesando...') {
  this.loading = await this.loadingCtrl.create({
    message: mensaje,
    spinner: 'crescent',
    backdropDismiss: false
  });

  await this.loading.present();
}

async ocultarLoading() {
  if (this.loading) {
    await this.loading.dismiss();
  }
}
async cargarEmpleadosEmpresa() {

  const idEmpresa = this._Parametro.IdEmpresa;

  try {

    const res = await firstValueFrom(
      this.empleadosService.getByEmpresa(idEmpresa)
    );

    this.empleados = res || [];

  } catch (error) {

    this.toast('Error cargando empleados');
    console.error(error);

  }
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
 async ngOnInit() {

  await this.mostrarLoading('Cargando datos...');

  try {

    await Promise.all([
      this.RefreshOrdenes(),
      this.cargarEmpleadosEmpresa()
    ]);

    this.puedeEliminarOrden = this._Parametro.puedeEliminarOrden;

  } catch (error) {
    console.error('Error cargando datos', error);
  } finally {
    await this.ocultarLoading();
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

    this._Router.navigateByUrl('/Categoria');
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


async RefreshOrdenes(
  mostrarLoading: boolean = false
) {

  if (mostrarLoading) {

    await this.mostrarLoading(
      'Actualizando...'
    );
  }

  try {

    this.accordionActivo = null;

    const c =
      await firstValueFrom(

        this._FacturaHeader
        .GetListadoOrdenesByFecha(

          this._Parametro.GetIdEmpresa(),

          this.desde,

          this.hasta
        )

      );

    // 🔥 ORDER

    this._Parametro.ListadoFacturas =

      [...(c || [])]
      .sort(

        (a, b) =>

          b.idFacturaHeader -
          a.idFacturaHeader
      );

    // 🔥 BACKUP

    this.facturasOriginal =

      [
        ...this._Parametro
        .ListadoFacturas
      ];

    console.log(
      "📦 Facturas cargadas:",
      this._Parametro
      .ListadoFacturas
    );

  } catch (error) {

    console.error(error);

  } finally {

    if (mostrarLoading) {

      await this.ocultarLoading();
    }
  }
}
filtrarLocal() {

  const value =

    this.searchText
    .toLowerCase()
    .trim();

  if (!value) {

    this._Parametro
    .ListadoFacturas =

      [...this.facturasOriginal];

    return;
  }

  this._Parametro
  .ListadoFacturas =

    this.facturasOriginal
    .filter(x =>

      (x.rnc || '')
      .toLowerCase()
      .includes(value)

      ||

      (x.nombreEmpresa || '')
      .toLowerCase()
      .includes(value)

      ||

      (x.ncf || '')
      .toLowerCase()
      .includes(value)

      ||

      (x.numeroDocumento || '')
      .toLowerCase()
      .includes(value)

      ||

      (x.formaPago || '')
      .toLowerCase()
      .includes(value)
    );
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

  // ==============================
  // ACCIONES SOBRE ÓRDENES
  // ==============================
  EliminarFactura(IdFactura: number) {
    this._FacturaHeader.DeleteIten(IdFactura).subscribe(() => {
      this._Parametro.LoadListaFactura();
    });
  }
getPendiente(iten: any): number {
  const total = Number(iten?.total ?? 0);
  const pagado = Number(iten?.pagado ?? 0);
  return Math.max(0, total - pagado);
}

 async openModal(IdFact: number) {

  this.NombreCliente = "";

  const factura = this._Parametro.ListadoOrdenes
    .find(c => c.idFacturaHeader == IdFact);

  if (!factura) return;

  // 🔥 CALCULAR PENDIENTE REAL
  const total = Number(factura.total ?? 0);
  const pagado = Number(factura.pagado ?? 0);
  const pendiente = Math.max(0, total - pagado);

  console.log("🔍 Factura:", factura);
  console.log("💰 Pendiente:", pendiente);

  const modal = await this.modal.create({
    component: CuentaxPagarComponent,
    cssClass: 'modal-factura-full',
    componentProps: {
      IdFactPay: factura.idFacturaHeader,
      TotalFactura: pendiente   // 👈🔥 AQUÍ VA EL MONTO REAL A COBRAR
    }
  });

  await modal.present();

  const { role } = await modal.onDidDismiss();

  if (role === 'ok') {

    const index = this._Parametro.ListadoOrdenes
      .findIndex(c => c.idFacturaHeader == IdFact);

    if (index !== -1) {
      this._Parametro.ListadoOrdenes.splice(index, 1);
    }
  }
}


  // ============================================================
  // 🔥 AJUSTADO — DESCUENTO REAL (NO PORCENTAJE)
  // ============================================================
  GetTotal(indexH: number) {
  let subtotal = 0;
  let descuentoItems = 0;

  const factura = this._Parametro.ListadoOrdenes[indexH];

  factura.facturaDetalles.forEach(det => {
    const precioBase = det.cantidad * (det.productos?.precioVenta || 0);
    
    // 👇 DESCUENTO UNITARIO x CANTIDAD
    const descUnitario = det.descuento || 0;
    const descTotalItem = descUnitario * det.cantidad;

    det.subTotal = precioBase - descTotalItem;

    subtotal += det.subTotal;
    descuentoItems += descTotalItem;
  });

  factura.subTotal = subtotal;
  factura.totalDescuento = descuentoItems;
  factura.total = subtotal;
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
  const detalle = this._Parametro.ListadoOrdenes[indexHeader].facturaDetalles[indexdetalle];
  detalle.cantidad++;
  this.GetAmount(indexHeader, indexdetalle); // ✅
  this._FactDetalle.ActualizarCantidad(IdFactDetalle, detalle.cantidad);
}

 DisminuirCantidad(indexHeader: number, indexdetalle: number, IdFactDetalle: number) {
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
    this._Parametro.ListadoOrdenes[IndexHeader].facturaDetalles.splice(IndexDetalle, 1);
    this._FactDetalle.DeleteIten(idFacturaDetalle).subscribe(() => {
      this._Parametro.LoadListaFactura();
    });
  }

  CallCategorias() {
    this._Parametro.NombreCliente = this.NombreCliente;
    this._Router.navigateByUrl('/Categoria');
    this._modal.dismiss();
    this.modal.dismiss();
  }

  async abrirAnulacion(
    factura: facturaheader
  ): Promise<void> {

    if (factura.estaCancelada) {
      return;
    }

    const modal = await this.modal.create({
      component: AnularFacturaComponent,
      cssClass: 'modal-producto-grande',
      componentProps: {
        factura
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.refresh) {
      this.LoadListaFactura();
    }
  }

  SendPrintAccount(IdFact: number) {
   this.printService
    .printTicket(IdFact,this._Parametro.IdEmpresa)
    .subscribe(() => {

        console.log("Factura enviada a impresión ✅");

    });
  }

  async abrirDevolucion(
    factura: facturaheader
  ): Promise<void> {

    if (factura.estaCancelada) {
      return;
    }

    let facturaActualizada = factura;

    try {
      const fresh = await firstValueFrom(
        this._FacturaHeader.PrintFact(
          factura.idFacturaHeader
        )
      );

      if (fresh?.length) {
        facturaActualizada = fresh[0];
      }
    } catch (error) {
      console.warn(
        'No se pudo refrescar la factura, se usa el listado en memoria.',
        error
      );
    }

    const modal = await this.modal.create({
      component: DevolucionFacturaComponent,
      cssClass: 'modal-producto-grande',
      componentProps: {
        factura: facturaActualizada
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.refresh) {
      this.LoadListaFactura();
    }
  }

 async LoadListaFactura() {
  await this.RefreshOrdenes(true);
}
}
