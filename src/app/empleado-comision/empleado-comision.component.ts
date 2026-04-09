import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

import { EmpleadoAreaComision } from '../models/empleadoareacomision.model';
import { EmpleadoServicioComisionService } from '../servicios/empleadoserviciocomision.services';
import { ParametrosService } from '../servicios/parametros.service';
import { AreasService } from '../servicios/area.services';
import { EmpleadosService } from '../servicios/empleados.service';

import { Area } from '../models/area.model';
import { Empleado } from '../models/empleado.models';

@Component({
  selector: 'app-empleado-comision',
  templateUrl: './empleado-comision.component.html',
  styleUrls: ['./empleado-comision.component.scss'],
})
export class EmpleadoComisionComponent implements OnInit {

  @Input() idEmpleados!: number;

  empleado!: Empleado;
  empleadoNombre = '';

  areas: Area[] = [];
  comisiones: EmpleadoAreaComision[] = [];
tipoGlobal: 'PORCIENTO' | 'MONTO' = 'PORCIENTO';
valorGlobal: number | null = null;

porcientos: Record<number, number> = {};
montos: Record<number, number> = {};

  areasSeleccionadas = new Set<number>();

  porcientoGlobal: number | null = null;

  // 🔥 NUEVO → tipo comisión
  

  constructor(
    private comisionService: EmpleadoServicioComisionService,
    private areasService: AreasService,
    private empleadosService: EmpleadosService,
    private parametroService: ParametrosService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    if (!this.idEmpleados) {
      this.toast('Empleado inválido');
      this.cerrar();
      return;
    }

    this.cargarEmpleado();
    this.cargarAreas();
    this.cargarComisionesEmpleado();
  }

  cargarEmpleado() {
    this.empleadosService.getById(this.idEmpleados).subscribe({
      next: (emp) => {
        this.empleado = emp;
        this.empleadoNombre = emp.nombre;
      },
      error: () => this.toast('Error cargando empleado'),
    });
  }

  cargarAreas() {
    const idEmpresa = this.parametroService.IdEmpresa;
    this.areasService.getAreas(idEmpresa).subscribe({
      next: res => this.areas = res || [],
      error: () => this.toast('Error cargando áreas'),
    });
  }

  cargarComisionesEmpleado() {
    this.comisionService.getComisionesByEmpleado(this.idEmpleados).subscribe({
      next: res => {
        this.comisiones = res || [];
        this.porcientos = {};
        this.areasSeleccionadas.clear();

        for (const c of this.comisiones) {
          this.areasSeleccionadas.add(c.idArea);

          if (c.tipoComision === 'MONTO') {
            this.tipoGlobal = 'MONTO';
            this.porcientos[c.idArea] = c.montoComision ?? 0;
          } else {
            this.tipoGlobal = 'PORCIENTO';
            this.porcientos[c.idArea] = c.porcientoComision ?? 0;
          }
        }
      },
      error: () => this.toast('Error cargando comisiones'),
    });
  }

  onToggleSeleccionarTodas(event: any) {
    const checked = event?.detail?.checked === true;

    if (checked) {
      this.areas.forEach(a => {
        this.areasSeleccionadas.add(a.idArea);
        this.porcientos[a.idArea] ??= 0;
      });
    } else {
      this.areasSeleccionadas.clear();
      this.porcientos = {};
    }
  }

  onToggleArea(idArea: number, event: any) {
    const checked = event?.detail?.checked === true;

    if (checked) {
      this.areasSeleccionadas.add(idArea);
      this.porcientos[idArea] ??= 0;
    } else {
      this.areasSeleccionadas.delete(idArea);
      delete this.porcientos[idArea];
    }
  }

 aplicarValorGlobal() {


  debugger;
  if (this.valorGlobal == null || this.valorGlobal < 0) return;

  const valor = this.valorGlobal;   // 🔥 ya TS entiende que aquí NO es null

  this.areasSeleccionadas.forEach(idArea => {

    if (this.tipoGlobal === 'PORCIENTO') {

      this.porcientos[idArea] = valor;
      this.montos[idArea] = 0;

    } else {

      this.montos[idArea] = valor;
      this.porcientos[idArea] = 0;

    }

  });
  this.porcientos = { ...this.porcientos };
this.montos = { ...this.montos };

}

 guardarCambios() {

  const idEmpresa = this.parametroService.IdEmpresa;
  const payload: EmpleadoAreaComision[] = [];

  this.areasSeleccionadas.forEach(idArea => {

    let valor = 0;

    if (this.tipoGlobal === 'PORCIENTO') {
      valor = Number(this.porcientos[idArea]) || 0;
    } else {
      valor = Number(this.montos[idArea]) || 0;
    }

    if (valor > 0) {

      payload.push({
        idEmpleado: this.idEmpleados,
        idArea,
        porcientoComision: this.tipoGlobal === 'PORCIENTO' ? valor : 0,
        montoComision: this.tipoGlobal === 'MONTO' ? valor : 0,
        tipoComision: this.tipoGlobal,
        idEmpresa
      });

    }

  });

  if (payload.length === 0) {
    this.toast('Debe asignar al menos una comisión válida');
    return;
  }

  this.comisionService.createComisiones(payload).subscribe({
    next: () => {
      this.toast('Comisiones guardadas correctamente ✅');
      this.cerrar(true);
    },
    error: () => this.toast('Error al guardar comisiones'),
  });

}

  cerrar(refresh = false) {
    this.modalCtrl.dismiss({ refresh });
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await t.present();
  }

}