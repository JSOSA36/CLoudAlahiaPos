// =========================================
// CUENTA POR COBRAR AJUSTADO (DESCUENTO REAL)
// =========================================

import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal, ModalController,AlertController,ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
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
@Component({
  selector: 'app-cuenta-por-cobrar',
  templateUrl: './cuentaxcobrar.component.html',
  styleUrls: ['./cuentaxcobrar.component.scss'],
})
export class CuentaPorCobrarComponent implements OnInit {

  @ViewChild(IonModal) _modal!: IonModal;
procesandoPago = false;
  NombreCliente: string = "";
  empleados: Empleado[] = [];
  CodigoEmpleado: string = "";
  accordionActivo: string | number | null = null;
puedeEliminarOrden: boolean = false;
  constructor(
    private modal: ModalController,
    public _Parametro: ParametrosService,
    private _Router: Router,
    private _FactDetalle: FactDetalleService,
    private _FacturaHeader: FacturaHeaderService,
      private alertController: AlertController,
      private empleadosService: EmpleadosService,
      private toastCtrl: ToastController,
      private printService: PrintService
      
  ) {}
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


RefreshOrdenes() {
  this.accordionActivo = null;

  this._FacturaHeader.GetListadoOrdenes(this._Parametro.GetIdEmpresa()).subscribe(c => {
    this._Parametro.ListadoOrdenes = [...c];
     console.log("📦 Ordenes cargadas:", this._Parametro.ListadoOrdenes);
    // recalcular totales para que salga el descuento general
    this._Parametro.ListadoOrdenes.forEach((_, i) => this.GetTotal(i));
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
    this._FacturaHeader.DeleteIten(IdFactura).subscribe(() => {
      this._Parametro.LoadListaFactura();
    });
  }
getPendiente(iten: any): number {
  const total = Number(iten?.total ?? 0);
  const pagado = Number(iten?.pagado ?? 0);
  return Math.max(0, total - pagado);
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

  // 🔥 CALCULAR PENDIENTE
  const total = Number(factura.total ?? 0);
  const pagado = Number(factura.pagado ?? 0);
  const pendiente = Math.max(0, total - pagado);

  const modal = await this.modal.create({
    component: CuentaxPagarComponent,
    cssClass: 'modal-factura-full',
    componentProps: {
      IdFactPay: factura.idFacturaHeader,
      TotalFactura: pendiente
    }
  });

  await modal.present();

  const { data, role } = await modal.onDidDismiss();

  if (role === 'ok' && data) {

    // ================= VALIDACIÓN =================
    if (!data.pagos || data.pagos.length === 0) {
      console.warn("⚠️ No hay pagos");
      this.procesandoPago = false;
      return;
    }

    // ================= DTO =================
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
      dto.detalleAbono = data.pagos;
    }

    console.log("📦 DTO enviado:", dto);

    // ================= API =================
    this._FacturaHeader.GenerateFacts(dto)
      .subscribe({
        next: async () => {

          console.log("✅ Factura procesada");

          // ================= IMPRESIÓN 🔥 =================
          try {

            // 🔥 siempre lavador
            this.printService.printLavador(dto.idFactura)
              .subscribe({
                next: () => console.log("🧾 Lavador impreso"),
                error: err => console.error("❌ Error lavador", err)
              });

            // 🔥 solo si cliente quiere factura
            if (dto.imprimirFactura) {
              this.printService.printFactura(dto.idFactura)
                .subscribe({
                  next: () => console.log("🧾 Factura cliente impresa"),
                  error: err => console.error("❌ Error factura", err)
                });
            }

          } catch (error) {
            console.error("❌ Error impresión:", error);
          }

          // ================= LIMPIAR LISTA =================
          const index = this._Parametro.ListadoOrdenes
            .findIndex(c => c.idFacturaHeader == IdFact);

          if (index !== -1) {
            this._Parametro.ListadoOrdenes.splice(index, 1);
          }

          // ================= UI =================
          const toast = await this.toastCtrl.create({
            message: 'Factura procesada correctamente',
            duration: 1500,
            color: 'success'
          });

          toast.present();

          this.procesandoPago = false;
        },

        error: async (err) => {

          console.error("❌ Error:", err);

          const toast = await this.toastCtrl.create({
            message: 'Error procesando la factura',
            duration: 1500,
            color: 'danger'
          });

          toast.present();

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

  factura.facturaDetalles.forEach(det => {
    const precioBase = det.cantidad * (det.productos.precioVenta || 0);
    
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

  AddNewItem(Id: number) {
    this._Parametro.IdFacturaHeader = Id;
    this._Router.navigateByUrl('/Categoria');
  }

 

  LoadListaFactura() {
    this.accordionActivo = null;
    this._Parametro.LoadListaFactura();
  }
}
