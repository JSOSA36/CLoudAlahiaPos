import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { EmpleadosService } from '../servicios/empleados.service';
import { ParametrosService } from '../servicios/parametros.service';
import { RrhhService } from '../servicios/rrhh.service';
import { Empleado } from '../models/empleado.models';

@Component({
  selector: 'app-rrhh-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './rrhh-asistencia.component.html',
  styleUrls: ['./rrhh-shared.scss']
})
export class RrhhAsistenciaComponent implements OnInit {
  empleados: Empleado[] = [];
  idEmpleados = 0;
  desde = new Date().toISOString().slice(0, 10);
  hasta = new Date().toISOString().slice(0, 10);
  filas: any[] = [];
  correcciones: any[] = [];
  loading = false;
  puedeCorregir = false;

  constructor(
    private rrhh: RrhhService,
    private empleadosSvc: EmpleadosService,
    public parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.puedeCorregir = this.parametros.tieneModulo('RRHH_CORRECCION');
    this.empleadosSvc.getByEmpresa(this.parametros.IdEmpresa).subscribe({
      next: (l) => (this.empleados = l || [])
    });
    this.cargar();
    if (this.puedeCorregir) {
      this.rrhh.correcciones(this.parametros.IdEmpresa, 'PENDIENTE').subscribe({
        next: (c) => (this.correcciones = c || [])
      });
    }
  }

  cargar(): void {
    this.rrhh.asistencia(
      this.parametros.IdEmpresa,
      this.desde,
      this.hasta,
      this.idEmpleados || undefined
    ).subscribe({ next: (r) => (this.filas = r || []) });
  }

  calcular(): void {
    this.loading = true;
    this.rrhh.calcularAsistencia({
      idEmpresa: this.parametros.IdEmpresa,
      idEmpleados: this.idEmpleados || null,
      desde: this.desde,
      hasta: this.hasta
    }).subscribe({
      next: (r) => {
        this.filas = r || [];
        this.loading = false;
        this.toast('Asistencia calculada');
      },
      error: (e) => {
        this.loading = false;
        this.toast(e?.error?.message || 'No se pudo calcular');
      }
    });
  }

  decidir(id: number, aprobar: boolean): void {
    this.rrhh.decidirCorreccion(id, aprobar).subscribe({
      next: () => {
        this.correcciones = this.correcciones.filter((c) => c.idCorreccion !== id);
        this.toast(aprobar ? 'Corrección aprobada' : 'Corrección rechazada');
        this.calcular();
      },
      error: (e) => this.toast(e?.error?.message || 'No se pudo decidir')
    });
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2200 });
    await t.present();
  }
}
