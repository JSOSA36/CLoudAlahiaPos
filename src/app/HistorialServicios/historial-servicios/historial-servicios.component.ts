import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { HistorialServiciosService } from 'src/app/servicios/historial-servicios.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { HistorialServicioCliente } from 'src/app/models/historial-servicio.models';
import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';
import { clientes } from 'src/app/models/clientes';

@Component({
  selector: 'app-historial-servicios',
  templateUrl: './historial-servicios.component.html',
  styleUrls: ['./historial-servicios.component.scss'],
})
export class HistorialServiciosComponent implements OnInit {

  servicios: HistorialServicioCliente[] = [];
  clienteSeleccionado: clientes | null = null;

  fechaDesde = '';
  fechaHasta = '';
  cargando = false;

  constructor(
    private historialSrv: HistorialServiciosService,
    private parametro: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.inicializarFechas();
  }

  ionViewWillEnter() {
    if (this.clienteSeleccionado?.idCliente) {
      this.buscar();
    }
  }

  private inicializarFechas() {
    const hoy = new Date();
    const haceUnAnio = new Date();
    haceUnAnio.setFullYear(hoy.getFullYear() - 1);

    this.fechaHasta = hoy.toISOString().split('T')[0];
    this.fechaDesde = haceUnAnio.toISOString().split('T')[0];
  }

  async seleccionarCliente() {
    const modal = await this.modalCtrl.create({
      component: ClientesComponent,
      componentProps: { isModalSeleccion: true }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.cliente) {
      this.clienteSeleccionado = data.cliente;
    }
  }

  async buscar() {
    if (!this.clienteSeleccionado?.idCliente) {
      (
        await this.toastCtrl.create({
          message: 'Seleccione un paciente.',
          duration: 2000,
          color: 'warning'
        })
      ).present();
      return;
    }

    this.cargando = true;

    this.historialSrv
      .getHistorial(
        this.parametro.GetIdEmpresa(),
        this.clienteSeleccionado.idCliente,
        this.fechaDesde,
        this.fechaHasta
      )
      .subscribe({
        next: (data) => {
          this.servicios = data || [];
          this.cargando = false;
        },
        error: async () => {
          this.servicios = [];
          this.cargando = false;
          (
            await this.toastCtrl.create({
              message: 'Error cargando historial de servicios.',
              duration: 2500,
              color: 'danger'
            })
          ).present();
        }
      });
  }

  limpiarFiltros() {
    this.inicializarFechas();
    this.servicios = [];
  }

  getEstadoColor(estado: string): string {
    switch ((estado || '').toLowerCase()) {
      case 'pagada':
        return 'success';
      case 'pendiente':
        return 'warning';
      default:
        return 'medium';
    }
  }

  trackById(_index: number, item: HistorialServicioCliente) {
    return item.idFacturaDetalle;
  }
}
