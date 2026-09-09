import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { IngresosService } from 'src/app/servicios/ingresos.service';
import { Ingresos } from 'src/app/models/ingresos.models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { IngresosAddComponent } from '../ingresos-add/ingresos-add.component';

@Component({
  selector: 'app-ingresos-list',
  templateUrl: './ingresos-list.component.html',
  styleUrls: ['./ingresos-list.component.scss'],
})
export class IngresosListComponent implements OnInit {
  ingresos: Ingresos[] = [];
  ingresosFiltrados: Ingresos[] = [];
  cargando = false;
  totalGeneral = 0;
  filtro = '';

  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = new Date().toISOString().split('T')[0];
  idSucursalFiltro = 0;

  constructor(
    private ingresoSrv: IngresosService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit(): void {
    this.resetHoy();
    this.cargarIngresos();
  }

  ionViewWillEnter(): void {
    this.resetHoy();
    this.cargarIngresos();
  }

  private resetHoy(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
  }

  aplicarFiltroFechas(): void {
    const desde = this.fechaInicio ? this.fechaInicio.split('T')[0] : '';
    const hasta = this.fechaFin ? this.fechaFin.split('T')[0] : '';

    if (desde && hasta && hasta < desde) {
      this.toast('La fecha hasta no puede ser menor que desde', 'warning');
      return;
    }

    this.cargarIngresos();
  }

  onFiltroSucursal(id: number): void {
    const next = Number(id) || 0;
    if (next === this.idSucursalFiltro) return;
    this.idSucursalFiltro = next;
    this.cargarIngresos();
  }

  cargarIngresos(): void {
    const desde = this.fechaInicio ? this.fechaInicio.split('T')[0] : '';
    const hasta = this.fechaFin ? this.fechaFin.split('T')[0] : '';

    if (!desde || !hasta) {
      this.toast('Seleccione el rango de fechas', 'warning');
      return;
    }

    if (hasta < desde) {
      this.toast('La fecha hasta no puede ser menor que desde', 'warning');
      return;
    }

    this.cargando = true;
    this.ingresoSrv
      .getIngresosByFecha(this.parametro.GetIdEmpresa(), desde, hasta, this.idSucursalFiltro)
      .subscribe({
        next: (data) => {
          this.ingresos = data || [];
          this.filtro = '';
          this.ingresosFiltrados = [...this.ingresos];
          this.calcularTotal();
          this.cargando = false;
          this.toast(
            `Se encontraron ${this.ingresosFiltrados.length} ingresos en el rango`,
            this.ingresosFiltrados.length > 0 ? 'medium' : 'warning'
          );
        },
        error: () => {
          this.cargando = false;
          this.ingresos = [];
          this.ingresosFiltrados = [];
          this.calcularTotal();
          this.toast('Error al cargar los ingresos', 'danger');
        },
      });
  }

  aplicarFiltroTexto(): void {
    const term = (this.filtro || '').toLowerCase().trim();
    if (!term) {
      this.ingresosFiltrados = [...this.ingresos];
      this.calcularTotal();
      return;
    }

    this.ingresosFiltrados = this.ingresos.filter((i) => {
      return (
        (i.categoria && i.categoria.toLowerCase().includes(term)) ||
        (i.formaPago && i.formaPago.toLowerCase().includes(term)) ||
        (i.origen && i.origen.toLowerCase().includes(term)) ||
        (i.referencia && i.referencia.toLowerCase().includes(term)) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(term)) ||
        (i.nota && i.nota.toLowerCase().includes(term)) ||
        (i.monto != null && i.monto.toString().includes(term))
      );
    });
    this.calcularTotal();
  }

  calcularTotal(): void {
    this.totalGeneral = this.ingresosFiltrados.reduce(
      (acc, i) => acc + (Number(i.monto) || 0),
      0
    );
  }

  trackById(_: number, item: Ingresos): number {
    return item.idIngreso;
  }

  async openModalAddIngreso(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: IngresosAddComponent,
      cssClass: 'modal-gasto',
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.recargar) {
      this.cargarIngresos();
    }
  }

  private async toast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'medium'
  ): Promise<void> {
    (
      await this.toastCtrl.create({
        message,
        color,
        duration: 1500,
        position: 'bottom',
      })
    ).present();
  }
}
