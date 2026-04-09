import { Component, OnInit } from '@angular/core';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { facturaheader } from 'src/app/models/facturaheader';
import { clientes } from 'src/app/models/clientes';
import { ToastController, ModalController } from '@ionic/angular';
import { PagoFacturaComponent } from '../pago-factura/pago-factura.component'; // ✅ modal de pagos / historial
import { FacturaHeaderDto } from '../Modales/facturaheader.dto';

@Component({
  selector: 'app-facturasporcobrar',
  templateUrl: './facturasporcobrar.component.html',
  styleUrls: ['./facturasporcobrar.component.scss'],
})
export class FacturasporcobrarComponent implements OnInit {

  facturas: FacturaHeaderDto[] = [];
  facturasFiltradas: FacturaHeaderDto[] = [];
  clientes: clientes[] = [];
  clienteSeleccionado: number = 0;
  clienteNombre: string = 'Todos los clientes';

  cargando = false;
  totalGeneral: number = 0;

  constructor(
    private _facturaSrv: FacturaHeaderService,
    private _clientesSrv: ClienteService,
    private _parametro: ParametrosService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.cargarClientes();
  }

  // 🔹 Cargar listado de clientes
  async cargarClientes() {
    this._clientesSrv.GetListadoClientes(this._parametro.GetIdEmpresa()).subscribe({
      next: (res) => {
        this.clientes = res || [];
        this.cargarFacturas();
      },
      error: async () => {
        (await this.toastCtrl.create({
          message: 'Error cargando clientes',
          duration: 1500,
          color: 'danger'
        })).present();
      }
    });
  }

  // 🔹 Cargar facturas pendientes (según cliente)
  async cargarFacturas() {
    this.cargando = true;

    const idCliente = this.clienteSeleccionado || 0;
    const idEmpresa = this._parametro.IdEmpresa;

    this._facturaSrv.GetAllFacturaPendiente(idCliente, idEmpresa).subscribe({
      next: (res) => {
        this.facturas = res || [];
        this.facturasFiltradas = [...this.facturas];
        this.cargando = false;
        this.calcularTotalGeneral();
      },
      error: async () => {
        this.cargando = false;
        (await this.toastCtrl.create({
          message: 'Error cargando facturas pendientes',
          duration: 1500,
          color: 'danger'
        })).present();
      }
    });
  }

  // 🔹 Filtrar facturas por cliente
  filtrarPorCliente(event: any) {
    this.clienteSeleccionado = Number(event.detail.value) || 0;
    console.log('🟢 Cliente seleccionado ID:', this.clienteSeleccionado);

    if (this.clienteSeleccionado > 0) {
      const cliente = this.clientes.find(c => c.idCliente === this.clienteSeleccionado);
      this.clienteNombre = cliente ? cliente.nombreComercial : 'Cliente desconocido';
    } else {
      this.clienteNombre = 'Todos los clientes';
    }

    this.cargarFacturas();
  }

  // 🔹 Calcular total general
  calcularTotalGeneral() {
    this.totalGeneral = this.facturasFiltradas.reduce(
      (acc, f) => acc + (f.pendiente || f.total || 0),
      0
    );
  }

  // 🔹 Refrescar manualmente
  async Refrescar() {
    this.cargarFacturas();
  }

  // 💳 Abrir modal para efectuar pago
  async efectuarPago(factura: facturaheader) {
    console.log('💵 Efectuar pago de factura:', factura);

    factura.iDCliente = this.clienteSeleccionado || factura.iDCliente || 0;

    const modal = await this.modalCtrl.create({
      component: PagoFacturaComponent,
      componentProps: { 
        factura,
        modo: 'pago' // 👈 modo para mostrar formulario de pago
      },
      cssClass: 'modal-pago-factura'
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.actualizado) {
      this.cargarFacturas();
    }
  }

  // 📜 Ver historial de pagos
  async verHistorial(factura: facturaheader) {
    console.log('📜 Ver historial de pagos de factura:', factura);

    const modal = await this.modalCtrl.create({
      component: PagoFacturaComponent,
      componentProps: { 
        factura,
        modo: 'historial' // 👈 modo para mostrar lista de pagos realizados
      },
      cssClass: 'modal-historial-factura'
    });

    await modal.present();
  }
}
