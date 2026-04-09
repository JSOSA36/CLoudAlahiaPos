import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  ToastController,
  LoadingController
} from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { EmpleadoServicioComisionService } from 'src/app/servicios/empleadoserviciocomision.services';

import { EmpleadosDto } from 'src/app/models/EmpleadosDto';
import { empleadoarearesumen } from 'src/app/models/empleadoarearesument';
import { EmpleadoAreaComision } from 'src/app/models/empleadoareacomision.model';
import { EmpleadoComisionComponent } from 'src/app/empleado-comision/empleado-comision.component';
import { Empleado } from 'src/app/models/empleado.models';

@Component({
  selector: 'app-listadoempleadoscomision',
  templateUrl: './listadoempleadosComision.component.html',
  styleUrls: ['./listadoempleadosComision.component.scss'],
})
export class ListadoempleadosComisionComponent implements OnInit {

  // 👉 DTO DE VISTA (NO entidad)
  empleados: EmpleadosDto[] = [];

  cargando = false;
  comisionGlobal: number | null = null;
  aplicarATodas = false;

  constructor(
    private empleadosService: EmpleadosService,
    private parametroService: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private comisionService: EmpleadoServicioComisionService,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.cargarEmpleados();
  }

  // =====================================================
  // 🔹 CARGAR EMPLEADOS + COMISIONES
  // =====================================================
  async cargarEmpleados(event?: any) {

    const idEmpresa = this.parametroService.IdEmpresa;
    if (!idEmpresa) return;

    let loading: HTMLIonLoadingElement | null = null;

    if (!event) {
      loading = await this.loadingCtrl.create({
        message: 'Cargando empleados...',
        spinner: 'circles',
      });
      await loading.present();
    }

    this.empleadosService.getByEmpresa(idEmpresa).subscribe({
      next: async (empleadosBase: Empleado[]) => {

        const resultado: EmpleadosDto[] = [];

        for (const emp of empleadosBase) {

          // ✅ TIPO CORRECTO
          let comisiones: empleadoarearesumen[] = [];

          try {
            const data = await lastValueFrom(
              this.comisionService.getComisionesByEmpleado(emp.idEmpleados)
            );

          comisiones = (data || []).map(
  (c: EmpleadoAreaComision): empleadoarearesumen => ({

    idArea: c.idArea,

    areaNombre: c.area?.nombre || `Área #${c.idArea}`,

    tipoComision: (c.tipoComision ?? 'PORCIENTO') as any,

    porcientoComision: c.porcientoComision ?? 0,

    montoComision: c.montoComision ?? 0

  })
);
          } catch {
            comisiones = [];
          }

          resultado.push({
            idEmpleados: emp.idEmpleados,
            nombre: emp.nombre,
            cantidadServicios: comisiones.length,
            comisiones
          });
        }

        this.empleados = resultado;

        if (loading) await loading.dismiss();
        if (event) event.target.complete();
      },
      error: async () => {
        if (loading) await loading.dismiss();
        if (event) event.target.complete();
        this.toast('Error cargando empleados');
      }
    });
  }

  // =====================================================
  // 🔹 MODAL COMISIONES POR EMPLEADO
  // =====================================================
  async abrirComisiones(idEmpleados: number | null) {
    const modal = await this.modalCtrl.create({
      component: EmpleadoComisionComponent,
      cssClass: 'modal-producto-grande',
      componentProps: { idEmpleados },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.refresh) {
      this.cargarEmpleados();
    }
  }

  // =====================================================
  // 🔹 ICONO POR ÁREA (UI)
  // =====================================================
  getIconoPorArea(areaNombre: string): string {
    if (!areaNombre) return 'briefcase-outline';

    const nombre = areaNombre.toLowerCase();

    if (nombre.includes('uñ') || nombre.includes('nail')) return 'color-palette-outline';
    if (nombre.includes('cabello') || nombre.includes('barber') || nombre.includes('pelu')) return 'cut-outline';
    if (nombre.includes('spa') || nombre.includes('masaje') || nombre.includes('relax')) return 'body-outline';
    if (nombre.includes('producto') || nombre.includes('crema')) return 'flask-outline';
    if (nombre.includes('ceja') || nombre.includes('maquillaje')) return 'brush-outline';
    if (nombre.includes('facial')) return 'sparkles-outline';

    return 'hand-left-outline';
  }

  // =====================================================
  // 🔹 NUEVA COMISIÓN
  // =====================================================
  async abrirNuevaComision() {
    const modal = await this.modalCtrl.create({
      component: EmpleadoComisionComponent,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.refresh) {
      this.cargarEmpleados();
    }
  }

  // =====================================================
  // 🔹 TOAST
  // =====================================================
  private async toast(message: string) {
    const t = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await t.present();
  }
}
