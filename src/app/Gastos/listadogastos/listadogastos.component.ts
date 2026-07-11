import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { GastosService } from 'src/app/servicios/gastos.service';
import { ModalController } from '@ionic/angular';
import { GastoFormPage } from '../gastoadd/gastoadd.component';
import { ParametrosService } from 'src/app/servicios/parametros.service';
@Component({
  selector: 'app-listadogastos',
  templateUrl: './listadogastos.component.html',
  styleUrls: ['./listadogastos.component.scss'],
})
export class ListadogastosComponent implements OnInit {
  gastos: any[] = [];
  idEmpresa = 1; // 👈 cambiar por empresa del login
  fechaInicio: string = new Date().toISOString();
  fechaFin: string = new Date().toISOString();
  filtro: string = '';
  totalGastos: number = 0;

  gastosFiltrados: any[] = [];

  constructor(
    private gastosSrv: GastosService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private parametro:ParametrosService
  ) {}

  ngOnInit() {
     this.fechaInicio = new Date().toISOString().split('T')[0];
  this.fechaFin = new Date().toISOString().split('T')[0];
  this.cargarGastos();
    
  }

  ionViewWillEnter() {
  
     this.fechaInicio = new Date().toISOString().split('T')[0];
  this.fechaFin = new Date().toISOString().split('T')[0];
  this.cargarGastos();
  }

  cargarGastos() {
    this.gastosSrv.getGastos(this.parametro.GetIdEmpresa()).subscribe(data => {
      this.gastos = data;
      this.aplicarFiltroFechas(); // 👈 inicializa filtrando por fechas
    });
  }

  // 📅 Filtro por fechas (estilo Comisiones: usamos split('T')[0])
  aplicarFiltroFechas() {
    const soloFechaInicio = this.fechaInicio ? this.fechaInicio.split('T')[0] : '';
    const soloFechaFin = this.fechaFin ? this.fechaFin.split('T')[0] : '';

    this.gastosFiltrados = this.gastos.filter(g => {
      const fecha = g.fechaInseccion ? g.fechaInseccion.split('T')[0] : null;
      if (!fecha) return false;

      if (soloFechaInicio && fecha < soloFechaInicio) return false;
      if (soloFechaFin && fecha > soloFechaFin) return false;

      return true;
    });

    // 🔎 Luego aplicamos también el filtro de texto
    this.aplicarFiltroTexto();

    // Feedback
    this.toastCtrl.create({
      message: `Se encontraron ${this.gastosFiltrados.length} gastos en el rango`,
      duration: 1500,
      color: this.gastosFiltrados.length > 0 ? 'medium' : 'warning'
    }).then(t => t.present());
  }

  // 🔎 Filtro por texto (sobre los filtrados por fecha)
  aplicarFiltroTexto() {
    const term = (this.filtro || '').toLowerCase().trim();

    if (!term) {
      this.calcularTotal();
      return;
    }

    this.gastosFiltrados = this.gastosFiltrados.filter(g => {
      return (
        (g.tipoGasto && g.tipoGasto.toLowerCase().includes(term)) ||
        (g.formaPago && g.formaPago.toLowerCase().includes(term)) ||
        (g.orien && g.orien.toLowerCase().includes(term)) ||
        (g.referencia && g.referencia.toLowerCase().includes(term)) ||
        (g.detalle && g.detalle.toLowerCase().includes(term)) ||
        (g.monto && g.monto.toString().includes(term)) ||
        (g.fechaInseccion && g.fechaInseccion.split('T')[0].includes(term))
      );
    });

    this.calcularTotal();
  }

  calcularTotal() {
    this.totalGastos = this.gastosFiltrados.reduce(
      (acc, g) => acc + (g.monto || 0),
      0
    );
  }

  async editarGasto(gasto: any) {
    const modal = await this.modalCtrl.create({
      component: GastoFormPage,
      cssClass: 'modal-gasto',
      componentProps: { gasto: { ...gasto }, isEdit: true }
    });

    modal.onDidDismiss().then((res) => {
      if (res.data?.recargar) {
        this.cargarGastos();
      }
    });

    return await modal.present();
  }

  async borrarGasto(id: number) {
    this.gastosSrv.eliminarGasto(id).subscribe(async () => {
      (await this.toastCtrl.create({
        message: '🗑️ Gasto eliminado',
        duration: 1500,
        color: 'danger'
      })).present();
      this.cargarGastos();
    });
  }

  trackById(index: number, item: any) {
    return item.idGasto;
  }

  async abrirModalNuevoGasto() {
    const modal = await this.modalCtrl.create({
      component: GastoFormPage,
      cssClass: 'modal-gasto',
      componentProps: { isEdit: false }
    });

    modal.onDidDismiss().then((res) => {
      if (res.data?.recargar) {
        this.cargarGastos();
      }
    });

    return await modal.present();
  }
}
