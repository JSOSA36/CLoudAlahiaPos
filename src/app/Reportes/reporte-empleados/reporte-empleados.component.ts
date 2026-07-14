import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Empleado } from 'src/app/models/empleado.models';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

type FiltroEstado = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

@Component({
  selector: 'app-reporte-empleados',
  templateUrl: './reporte-empleados.component.html',
  styleUrls: ['./reporte-empleados.component.scss'],
})
export class ReporteEmpleadosComponent implements OnInit {
  lista: Empleado[] = [];
  filtro = '';
  filtroEstado: FiltroEstado = 'TODOS';
  cargando = false;

  readonly chips: { codigo: FiltroEstado; etiqueta: string }[] = [
    { codigo: 'TODOS', etiqueta: 'Todos' },
    { codigo: 'ACTIVOS', etiqueta: 'Activos' },
    { codigo: 'INACTIVOS', etiqueta: 'Inactivos' },
  ];

  constructor(
    private service: EmpleadosService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(event?: any): void {
    this.cargando = !event;
    this.service.getByEmpresa(this.parametro.GetIdEmpresa()).subscribe({
      next: (data) => {
        this.lista = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: async () => {
        this.cargando = false;
        event?.target?.complete?.();
        const t = await this.toastCtrl.create({
          message: 'No se pudo cargar el reporte de empleados',
          color: 'danger',
          duration: 2500
        });
        t.present();
      }
    });
  }

  get filtrados(): Empleado[] {
    const q = this.filtro.trim().toLowerCase();
    return this.lista.filter(e => {
      if (this.filtroEstado === 'ACTIVOS' && !e.estado) return false;
      if (this.filtroEstado === 'INACTIVOS' && e.estado) return false;
      if (!q) return true;
      return [e.nombre, e.ocupacion, e.celular, e.direccion]
        .some(v => (v || '').toLowerCase().includes(q));
    });
  }

  get resumen() {
    return {
      total: this.filtrados.length,
      activos: this.filtrados.filter(e => e.estado).length,
      inactivos: this.filtrados.filter(e => !e.estado).length
    };
  }
}
