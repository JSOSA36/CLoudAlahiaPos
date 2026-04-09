import { Component, OnInit, Input } from '@angular/core';

import { ModalController, ToastController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { clientes } from 'src/app/models/clientes';
import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';
import { AlertController } from '@ionic/angular';
import { PrintService } from 'src/app/servicios/print.services';



@Component({
  selector: 'app-cuentax-pagar',
  templateUrl: './cuentaxpagar.component.html',
  styleUrls: ['./cuentaxpagar.component.scss'],
})


export class CuentaxPagarComponent implements OnInit {
procesandoFactura = false;
 
 @Input() IdFactPay!: number;
@Input() TotalFactura!: number;
@Input() Subtotal!: number;
@Input() Itbis!: number;
@Input() TipoOrden!: string;
_TipoComprobante: string = 'Consumo';
_PropinaLegal: boolean = false;
_MontoPropina: number = 0;
TotalConPropina: number = 0;
EfectivoRecibido:number = 0;
Cambio:number = 0;
_TipoDocumento: 'Orden' | 'Factura' = 'Factura';

_TipoOrden: 'ComerAqui' | 'Llevar' | 'Delivery' = 'Llevar';
  // 🔹 Estado general
  _TipoFactura: 'Contado' | 'Credito' = 'Contado';
  _FormaPago: string = 'Efectivo';
  _MostrarQR: boolean = false;
  qrData: string = '';
  _PagoMixto: boolean = false;
_ConAbonoCredito: boolean = false;
_MontoAbonoCredito: number = 0;
_FormaPagoAbonoCredito: string = '';
_MetodoPago1: string = '';

_AbonoMixtoCredito: boolean = false;


modalEfectivo = false;
_MetodoAbono1: string = '';
_MontoAbono1: number = 0;

_MetodoAbono2: string = '';
_MontoAbono2: number = 0;
_MontoPago1: number = 0;
_PagosMixtos: any[] = [];
ImprimirFacturaCliente: boolean = true;
_MetodoPago2: string = '';
_MontoPago2: number = 0;

  // 🔹 Cliente seleccionado
  _ClienteSeleccionado: clientes | null = null;

  constructor(
    private modalCtrl: ModalController,
    private _Parametro: ParametrosService,
    private _Fact: FacturaHeaderService,
    private toastCtrl: ToastController,
    private _ClientesService: ClienteService,
    private alertCtrl: AlertController,
    private printService: PrintService
    
  ) {}

  ngOnInit() {}
  
  calcularCambio() {

  const total = Number(this.TotalFactura) || 0;
  const recibido = Number(this.EfectivoRecibido) || 0;

  this.Cambio = recibido - total;

  if (this.Cambio < 0) {
    this.Cambio = 0;
  }

}
sumarEfectivo(monto:number){

  this.EfectivoRecibido = monto;

  this.calcularCambio();

}
abrirModalEfectivo(){
this.modalEfectivo = true;
}

cerrarModalEfectivo(){
this.modalEfectivo = false;
}
pagoExacto(){
this.EfectivoRecibido = this.TotalFactura;
this.calcularCambio();
this.cerrarModalEfectivo();
}
setEfectivo(monto:number){
this.EfectivoRecibido = monto;
this.calcularCambio();
this.cerrarModalEfectivo();
}

get restanteCredito(): number {

  if (!this._ConAbonoCredito) return this.TotalFactura;

  if (!this._AbonoMixtoCredito) {
    return this.TotalFactura - Number(this._MontoAbonoCredito || 0);
  }

  const abono =
    Number(this._MontoAbono1 || 0) +
    Number(this._MontoAbono2 || 0);

  return this.TotalFactura - abono;
}
  // 🔹 Abrir modal para seleccionar cliente (solo crédito)
  async abrirModalClientes() {

  const modal = await this.modalCtrl.create({
    component: ClientesComponent,
    cssClass: 'modal-clientes-full',
    componentProps: { isModalSeleccion: true },

    presentingElement: await this.modalCtrl.getTop(), // 🔥 ESTA ES LA CLAVE
    breakpoints: [0, 1],
    initialBreakpoint: 1
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  if (data?.cliente) {
    this._ClienteSeleccionado = data.cliente;
    console.log('✅ Cliente seleccionado:', this._ClienteSeleccionado);
  }
}

  // 🔹 Procesar factura (contado o crédito)
 // 🔹 Procesar factura (contado o crédito)
 private construirPagosContado(): any[] {

  let pagos: any[] = [];

  if (!this._PagoMixto) {

    pagos.push({
      metodo: this._FormaPago,
      monto: this.TotalFactura
    });

  } else {

    if (this._MontoPago1 > 0) {
      pagos.push({
        metodo: this._MetodoPago1,
        monto: Number(this._MontoPago1)
      });
    }

    if (this._MontoPago2 > 0) {
      pagos.push({
        metodo: this._MetodoPago2,
        monto: Number(this._MontoPago2)
      });
    }

  }

  return pagos;
}
private construirPagosAbono(): any[] {

  let pagos: any[] = [];

  if (!this._AbonoMixtoCredito) {

    pagos.push({
      metodo: this._FormaPagoAbonoCredito,
      monto: Number(this._MontoAbonoCredito)
    });

  } else {

    if (this._MontoAbono1 > 0) {
      pagos.push({
        metodo: this._MetodoAbono1,
        monto: Number(this._MontoAbono1)
      });
    }

    if (this._MontoAbono2 > 0) {
      pagos.push({
        metodo: this._MetodoAbono2,
        monto: Number(this._MontoAbono2)
      });
    }

  }

  return pagos;
}

async CloseModal() {

  // ================= VALIDACIÓN CRÉDITO =================
  if (this._TipoFactura === 'Credito' && !this._ClienteSeleccionado) {
    (await this.toastCtrl.create({
      message: 'Debe seleccionar un cliente para crédito',
      duration: 1500,
      color: 'warning'
    })).present();
    return;
  }

  // ================= VALIDACIÓN CONTADO =================
  if (this._TipoFactura === 'Contado') {

    if (!this._PagoMixto && !this._FormaPago) {
      (await this.toastCtrl.create({
        message: 'Seleccione una forma de pago',
        duration: 1500,
        color: 'warning'
      })).present();
      return;
    }

    if (this._PagoMixto) {

      if (!this._MetodoPago1 || !this._MetodoPago2) {
        (await this.toastCtrl.create({
          message: 'Debe seleccionar ambos métodos de pago',
          duration: 1500,
          color: 'warning'
        })).present();
        return;
      }

      if (!this._MontoPago1 || !this._MontoPago2) {
        (await this.toastCtrl.create({
          message: 'Debe colocar ambos montos',
          duration: 1500,
          color: 'warning'
        })).present();
        return;
      }

      const totalPagos =
        Number(this._MontoPago1) +
        Number(this._MontoPago2);

      if (totalPagos !== this.TotalFactura) {
        (await this.toastCtrl.create({
          message: 'Los montos no coinciden con el total de la factura',
          duration: 1500,
          color: 'danger'
        })).present();
        return;
      }
    }
  }

  // ================= DTO =================
  let dto: any = {

    idFactura: this.IdFactPay,
    tipoFactura: this._TipoFactura,
    idCliente: this._ClienteSeleccionado?.idCliente ?? 0,
    imprimirFactura: this.ImprimirFacturaCliente,
    formaPago: null,
    detallePagos: [],
    detalleAbono: []

  };

  // ================= CONTADO =================
  if (this._TipoFactura === 'Contado') {

    dto.detallePagos = this.construirPagosContado();

    dto.formaPago =
      dto.detallePagos.length > 1
        ? 'Mixto'
        : dto.detallePagos[0].metodo;
  }

  // ================= CRÉDITO CON ABONO =================
  if (
    this._TipoFactura === 'Credito' &&
    this._ConAbonoCredito
  ) {

    dto.detalleAbono = this.construirPagosAbono();

    const totalAbono = dto.detalleAbono
      .reduce((sum: number, p: any) => sum + Number(p.monto), 0);

    if (totalAbono >= this.TotalFactura) {
      (await this.toastCtrl.create({
        message: 'El abono no puede ser igual o mayor al total',
        duration: 1500,
        color: 'danger'
      })).present();
      return;
    }
  }

  console.log('🧾 DTO Enviado:', dto);

  // ================= GENERAR FACTURA =================
  this._Fact.GenerateFacts(dto)
  .subscribe({
    next: async () => {

      this.procesandoFactura = false;

      this._MostrarQR = true;
      this._Parametro.IdFactPay = dto.idFactura;

      (await this.toastCtrl.create({
        message: 'Factura procesada correctamente',
        duration: 1500,
        color: 'success'
      })).present();

      // ================= IMPRESIÓN =================
      try {

        // 🔥 SIEMPRE imprime ticket lavador
        this.printService.printLavador(dto.idFactura)
          .subscribe({
            next: () => console.log("Lavador impreso 🔥"),
            error: err => console.error("Error imprimiendo lavador", err)
          });

        // 🔥 SOLO imprime factura cliente si aplica
        if (dto.imprimirFactura) {
          this.printService.printFactura(dto.idFactura)
            .subscribe({
              next: () => console.log("Factura cliente impresa 🔥"),
              error: err => console.error("Error imprimiendo factura", err)
            });
        }

      } catch (error) {
        console.error("Error en impresión:", error);
      }

    },

    error: async (err) => {

      this.procesandoFactura = false;

      console.error('❌ Error generando factura:', err);

      (await this.toastCtrl.create({
        message: 'Error al procesar la factura',
        duration: 1500,
        color: 'danger'
      })).present();
    }
  });
}


  // 🔹 Cerrar modal manualmente
 CerrarModal() {
  this.limpiarEstado();
  this.modalCtrl.dismiss(null, 'cancel');
}

async ConfirmarCierre() {
  this.limpiarEstado();
  this.modalCtrl.dismiss(true, 'ok');
}

  // 🔹 Limpiar datos internos
  limpiarEstado() {
    this._ClienteSeleccionado = null;
    this._TipoFactura = 'Contado';
    this._FormaPago = 'Efectivo';
    this._MostrarQR = false;
    this.qrData = '';
  }
  async abrirModalFormaPago() {
  const alert = await this.alertCtrl.create({
    header: 'Forma de Pago',
    inputs: [
      {
        type: 'radio',
        label: '💵 Efectivo',
        value: 'Efectivo',
        checked: this._FormaPago === 'Efectivo'
      },
      {
        type: 'radio',
        label: '💳 Tarjeta',
        value: 'Tarjeta',
        checked: this._FormaPago === 'Tarjeta'
      },
      {
        type: 'radio',
        label: '🏦 Transferencia BHD',
        value: 'Transferencia BHD',
        checked: this._FormaPago === 'Transferencia BHD'
      },
      {
        type: 'radio',
        label: '🏦 Transferencia Popular',
        value: 'Transferencia Popular',
        checked: this._FormaPago === 'Transferencia Popular'
      },
      {
        type: 'radio',
        label: '🏦 Transferencia BanReservas',
        value: 'Transferencia Reserva',
        checked: this._FormaPago === 'Transferencia Reserva'
      }
    ],
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'OK',
        handler: (data) => {
          this._FormaPago = data;
        }
      }
    ]
  });

  await alert.present();
}


seleccionarPago(pago: string) {
  this._FormaPago = pago;
  this.modalCtrl.dismiss();
}

getIconoFormaPago(pago: string): string {
  switch (pago) {
    case 'Efectivo': return 'assets/bancos/efectivo.png';
    case 'Tarjeta': return 'assets/bancos/tarjeta.png';
    case 'Transferencia BHD': return 'assets/bancos/bhd.png';
    case 'Transferencia Popular': return 'assets/bancos/popular.png';
    case 'Transferencia Reserva': return 'assets/bancos/reserva.png';
    default: return '';
  }
}

}
