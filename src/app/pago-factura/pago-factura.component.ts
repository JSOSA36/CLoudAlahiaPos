import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

import { facturaheader } from 'src/app/models/facturaheader';

import { PagosFacturasClientesService } from '../servicios/PagosFacturasClientesService';
import { PagosFacturasClientes } from '../Modales/PagosFacturasClientes .models';

import { ParametrosService } from 'src/app/servicios/parametros.service';

import {
  MetodoPagoCuentaService
} from 'src/app/servicios/metodo-pago-cuenta.service';

@Component({
  selector: 'app-pago-factura',
  templateUrl: './pago-factura.component.html',
  styleUrls: ['./pago-factura.component.scss'],
})
export class PagoFacturaComponent implements OnInit {

  // =====================================================
  // 🔥 FACTURA
  // =====================================================

  private _factura!: facturaheader;

  @Input()
  set factura(value: facturaheader) {

    this._factura = value;

    if (value) {

      console.log('📦 Factura recibida:', value);

    }

  }

  get factura(): facturaheader {

    return this._factura;

  }

  // =====================================================
  // 🔥 MODO
  // =====================================================

  private _modo: 'pago' | 'historial' = 'pago';

  @Input()

  set modo(value: 'pago' | 'historial') {

    this._modo = value;

    console.log('🎯 Modo:', value);

    if (value === 'historial' && this.factura) {

      this.cargarHistorialPagos();

    }

  }

  get modo() {

    return this._modo;

  }

  // =====================================================
  // 🔥 FORMULARIO
  // =====================================================

  montoAbono = 0;

  metodoPago = '';

  nota = '';

  cargando = false;

  // =====================================================
  // 🔥 METODOS DE PAGO
  // =====================================================

 metodosPago: any[] = [];



  // =====================================================
  // 🔥 HISTORIAL
  // =====================================================

  pagos: PagosFacturasClientes[] = [];

  // =====================================================
  // 🔥 CONSTRUCTOR
  // =====================================================

  constructor(

    private modalCtrl: ModalController,

    private toastCtrl: ToastController,

    private _pagosSrv: PagosFacturasClientesService,

    private _metodoPagoSrv: MetodoPagoCuentaService,

    private _parametro: ParametrosService

  ) {}

  // =====================================================
  // 🔥 INIT
  // =====================================================

  ngOnInit() {

    this.CargarMetodosPago();

  }

  // =====================================================
  // 🔥 CARGAR MÉTODOS DE PAGO
  // =====================================================

  CargarMetodosPago(): void {

    this._metodoPagoSrv
      .getByEmpresa(this._parametro.GetIdEmpresa())
      .subscribe({

        next: (resp: any[]) => {

          this.metodosPago = (resp || []).filter(x => x.activo);

          console.log('METODOS:', this.metodosPago);

        },

        error: (err) => {

          console.error(err);

        }

      });

  }

  // =====================================================
  // 🔥 HISTORIAL
  // =====================================================

  cargarHistorialPagos() {

    if (!this.factura) return;

    this.cargando = true;

    this._pagosSrv

      .getPagosByFactura(this.factura.idFacturaHeader)

      .subscribe({

        next: (res) => {

          this.pagos = res || [];

          this.cargando = false;

          console.log(this.pagos);

        },

        error: async () => {

          this.cargando = false;

          (

            await this.toastCtrl.create({

              message: 'Error cargando historial',

              duration: 1500,

              color: 'danger'

            })

          ).present();

        }

      });

  }

  // =====================================================
  // 🔥 REGISTRAR PAGO
  // =====================================================

  async procesarPago() {

    if (!this.montoAbono || this.montoAbono <= 0) {

      (

        await this.toastCtrl.create({

          message: 'Debe ingresar un monto válido',

          duration: 1500,

          color: 'warning'

        })

      ).present();

      return;

    }

    if (this.montoAbono > (this.factura.pendiente || 0)) {

      (

        await this.toastCtrl.create({

          message: 'El monto supera el pendiente',

          duration: 1500,

          color: 'danger'

        })

      ).present();

      return;

    }

    if (!this.metodoPago) {

      (

        await this.toastCtrl.create({

          message: 'Seleccione una forma de pago',

          duration: 1500,

          color: 'warning'

        })

      ).present();

      return;

    }

    this.cargando = true;

    const pago: PagosFacturasClientes = {

      id: 0,

      idFacturaHeader: this.factura.idFacturaHeader,

      numeroDocumento: '',

      idCliente: this.factura.iDCliente || 0,

      formaPago: this.metodoPago,

      monto: this.montoAbono,

      fechaInseccion: new Date().toISOString(),

      nota: this.nota

    };

    console.log(pago);

    this._pagosSrv

      .registrarPago(

        this.factura.idFacturaHeader,

        pago

      )

      .subscribe({

        next: async () => {

          this.cargando = false;

          (

            await this.toastCtrl.create({

              message: 'Pago registrado correctamente',

              duration: 1500,

              color: 'success'

            })

          ).present();

          this.modalCtrl.dismiss({

            actualizado: true

          });

        },

        error: async (err) => {

          this.cargando = false;

          console.error(err);

          (

            await this.toastCtrl.create({

              message: 'Error registrando pago',

              duration: 1500,

              color: 'danger'

            })

          ).present();

        }

      });

  }

  // =====================================================
  // 🔥 CERRAR
  // =====================================================

  cerrarModal() {

    this.modalCtrl.dismiss();

  }

}