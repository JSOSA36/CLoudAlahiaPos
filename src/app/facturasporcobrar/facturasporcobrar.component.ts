import { Component, OnInit } from '@angular/core';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { clientes } from 'src/app/models/clientes';
import {
  ToastController,
  ModalController
} from '@ionic/angular';

import { PagoFacturaComponent }
from '../pago-factura/pago-factura.component';

import { FacturaHeaderDto }
from '../Modales/facturaheader.dto';

@Component({
  selector: 'app-facturasporcobrar',
  templateUrl:
    './facturasporcobrar.component.html',

  styleUrls:
    ['./facturasporcobrar.component.scss'],
})
export class FacturasporcobrarComponent
implements OnInit {

  // =====================================================
  // 🔥 VARIABLES
  // =====================================================

  facturas: FacturaHeaderDto[] = [];

  facturasFiltradas:
    FacturaHeaderDto[] = [];

  clientes: clientes[] = [];

  clienteSeleccionado: number = 0;

  clienteNombre: string =
    'Todos los clientes';

  cargando = false;

  totalGeneral: number = 0;

  accordionActivo: any = null;

  // =====================================================
  // 🔥 CONSTRUCTOR
  // =====================================================

  constructor(

    private _facturaSrv:
      FacturaHeaderService,

    private _clientesSrv:
      ClienteService,

    private _parametro:
      ParametrosService,

    private toastCtrl:
      ToastController,

    private modalCtrl:
      ModalController

  ) {}

  // =====================================================
  // 🔥 INIT
  // =====================================================

  ngOnInit() {

    this.cargarClientes();
  }

  // =====================================================
  // 🔥 CLIENTES
  // =====================================================

  async cargarClientes() {

    this._clientesSrv
    .GetListadoClientes(
      this._parametro.GetIdEmpresa()
    )
    .subscribe({

      next: (res) => {

        this.clientes =
          res || [];

        this.cargarFacturas();
      },

      error: async () => {

        (
          await this.toastCtrl.create({

            message:
              'Error cargando clientes',

            duration: 1500,

            color: 'danger'
          })

        ).present();
      }
    });
  }

  // =====================================================
  // 🔥 FACTURAS
  // =====================================================
cargarClientesConDeuda() {

  const clientesMap = new Map<number, clientes>();

  this.facturas.forEach(f => {

    const pendiente = Number(f.pendiente || f.total || 0);

    if (pendiente <= 0) return;

    const idCliente = Number(f.iDCliente || 0);

    if (idCliente <= 0) return;

    const cliente = this.clientes.find(c => c.idCliente === idCliente);

    if (cliente) {
      clientesMap.set(cliente.idCliente, cliente);
    }
  });

  this.clientes = Array.from(clientesMap.values());
}
 async cargarFacturas() {

  this.cargando = true;

  const idCliente = this.clienteSeleccionado || 0;
  const idEmpresa = this._parametro.IdEmpresa;

  this._facturaSrv
    .GetAllFacturaPendiente(idCliente, idEmpresa)
    .subscribe({

      next: (res) => {

        this.facturas = res || [];
        this.facturasFiltradas = [...this.facturas];

        this.cargarClientesConDeuda();

        this.cargando = false;
        this.calcularTotalGeneral();
      },

      error: async () => {

        this.cargando = false;

        (
          await this.toastCtrl.create({
            message: 'Error cargando facturas pendientes',
            duration: 1500,
            color: 'danger'
          })
        ).present();
      }
    });
}

  // =====================================================
  // 🔥 FILTRAR
  // =====================================================

  filtrarPorCliente(event: any) {

    this.clienteSeleccionado =

      Number(event.detail.value) || 0;

    console.log(
      '🟢 Cliente seleccionado ID:',
      this.clienteSeleccionado
    );

    if (this.clienteSeleccionado > 0) {

      const cliente =
        this.clientes.find(

          c =>
            c.idCliente ===
            this.clienteSeleccionado
        );

      this.clienteNombre =

        cliente
          ? cliente.nombreComercial
          : 'Cliente desconocido';
    }
    else {

      this.clienteNombre =
        'Todos los clientes';
    }

    this.cargarFacturas();
  }

  // =====================================================
  // 🔥 TOTAL GENERAL
  // =====================================================

  calcularTotalGeneral() {

    this.totalGeneral =

      this.facturasFiltradas.reduce(

        (acc, f) =>

          acc +
          (f.pendiente || f.total || 0),

        0
      );
  }

  // =====================================================
  // 🔥 REFRESCAR
  // =====================================================

  async Refrescar() {

    this.cargarFacturas();
  }

  // =====================================================
  // 🔥 ACCORDION
  // =====================================================

  onAccordionChange(event: any) {

    this.accordionActivo =
      event.detail.value;
  }

  trackByFactura(
    index: number,
    item: FacturaHeaderDto
  ): number {

    return item.idFacturaHeader;
  }

  // =====================================================
  // 🔥 EFECTUAR PAGO
  // =====================================================

  async efectuarPago(
    factura: FacturaHeaderDto
  ) {

    console.log(
      '💵 Efectuar pago de factura:',
      factura
    );

    factura.iDCliente =

      this.clienteSeleccionado ||
      factura.iDCliente ||
      0;

    const modal =
      await this.modalCtrl.create({

        component:
          PagoFacturaComponent,

        componentProps: {

          factura,

          modo: 'pago'
        },

        cssClass:
          'modal-pago-factura'
      });

    await modal.present();

    const { data } =

      await modal.onDidDismiss();

    if (data?.actualizado) {

      this.cargarFacturas();
    }
  }

  // =====================================================
  // 🔥 HISTORIAL
  // =====================================================

  async verHistorial(
    factura: FacturaHeaderDto
  ) {

    console.log(
      '📜 Ver historial de pagos:',
      factura
    );

    const modal =
      await this.modalCtrl.create({

        component:
          PagoFacturaComponent,

        componentProps: {

          factura,

          modo: 'historial'
        },

        cssClass:
          'modal-historial-factura'
      });

    await modal.present();
  }
}