import { Component, OnInit } from '@angular/core';
import { LavadorConsumoService } from '../servicios/lavadorconsumo.services';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { Empleado } from '../models/empleado.models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ToastController,AlertController } from '@ionic/angular';

@Component({
  selector: 'app-lavador-dashboard',
  templateUrl: './lavador-dashboard.component.html',
  styleUrls: ['./lavador-dashboard.component.scss'],
})
export class LavadorDashboardComponent implements OnInit {

  dashboard: any = {
    consumos: [],
    totalConsumido: 0,
    totalComision: 0,
    pagoNetoEstimado: 0
  };

  idLavador: number = 0;
  concepto: string = '';
  monto: number = 0;

  showModalConsumo = false;

  fechaInicio: string = '';
  fechaFin: string = '';

  empleados: Empleado[] = [];

  loading = false;

  constructor(
    private consumoService: LavadorConsumoService,
    private empleadosService: EmpleadosService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}
async eliminarConsumo(consumo: any) {

  const alert = await this.alertCtrl.create({
    header: 'Eliminar consumo',
    message: '¿Seguro que deseas eliminar este consumo?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => {
      console.log('Eliminando consumo con id:', consumo); // 👉 LOG para verificar el ID del consumo
          this.consumoService.deleteConsumo(consumo.idConsumo)
            .subscribe(() => {
              this.loadDashboard();
            });

        }
      }
    ]
  });

  await alert.present();
}
  ngOnInit() {

    const hoy = new Date();

    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    this.fechaFin = hoy.toISOString().split('T')[0];

    this.cargarEmpleadosEmpresa();
  }

  // ⭐ EMPLEADOS
  cargarEmpleadosEmpresa() {
    this.empleadosService
      .getByEmpresa(this.parametro.IdEmpresa)
      .subscribe(res => this.empleados = res || []);
  }

  // ⭐ DASHBOARD (YA FILTRA EN DB)
  loadDashboard() {

    if (!this.idLavador) return;

    this.loading = true;

    const desde = new Date(this.fechaInicio).toISOString();
    const hasta = new Date(this.fechaFin).toISOString();

    this.consumoService.getDashboardLavador(
      this.idLavador,
      this.parametro.IdEmpresa,
      desde,
      hasta
    ).subscribe({

      next: (resp: any) => {
       console.log('Respuesta del servicio:', resp); // 👉 LOG para verificar la respuesta del servicio
        this.dashboard = resp || {
          consumos: [],
          totalConsumido: 0,
          totalComision: 0,
          pagoNetoEstimado: 0
        };
     console.log('Dashboard data:', this.dashboard ); // 👉 LOG para verificar datos
        this.loading = false;

        this.toastCtrl.create({
          message: 'Dashboard actualizado',
          duration: 1000,
          color: 'success'
        }).then(t => t.present());
      },

      error: () => {

        this.dashboard = {
          consumos: [],
          totalConsumido: 0,
          totalComision: 0,
          pagoNetoEstimado: 0
        };

        this.loading = false;
      }
    });
  }

  // ⭐ MODAL
  openModalConsumo() {
    this.showModalConsumo = true;
  }

  closeModalConsumo() {
    this.showModalConsumo = false;
  }

  // ⭐ GUARDAR CONSUMO
  guardarDesdeModal() {

    if (!this.idLavador || this.monto <= 0 || !this.concepto) return;

    const dto = {
      idEmpleado: this.idLavador,
      idEmpresa: this.parametro.IdEmpresa,
      concepto: this.concepto,
      monto: this.monto
    };

    this.consumoService.registrarConsumo(dto)
      .subscribe(() => {

        this.concepto = '';
        this.monto = 0;
        this.showModalConsumo = false;

        setTimeout(() => {
          this.loadDashboard();
        }, 300);
      });
  }
}