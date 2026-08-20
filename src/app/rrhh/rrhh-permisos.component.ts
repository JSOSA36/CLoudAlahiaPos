import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { EmpleadosService } from '../servicios/empleados.service';
import { ParametrosService } from '../servicios/parametros.service';
import { RrhhService } from '../servicios/rrhh.service';
import { Empleado } from '../models/empleado.models';

@Component({
  selector: 'app-rrhh-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './rrhh-permisos.component.html',
  styleUrls: ['./rrhh-shared.scss']
})
export class RrhhPermisosComponent implements OnInit {
  empleados: Empleado[] = [];
  tipos: any[] = [];
  filas: any[] = [];
  puedeAprobar = false;
  form: any = this.empty();

  constructor(
    private rrhh: RrhhService,
    private empleadosSvc: EmpleadosService,
    public parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.puedeAprobar = this.parametros.tieneModulo('RRHH_PERMISOS_APROBAR');
    this.empleadosSvc.getByEmpresa(this.parametros.IdEmpresa).subscribe({
      next: (l) => (this.empleados = l || [])
    });
    this.rrhh.tiposAusencia(this.parametros.IdEmpresa).subscribe({
      next: (t) => (this.tipos = t || [])
    });
    this.cargar();
  }

  empty() {
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      idEmpresa: this.parametros.IdEmpresa,
      idEmpleados: this.parametros.IdEmpleados || 0,
      idTipoAusencia: 0,
      fechaInicio: hoy,
      fechaFin: hoy,
      horaInicio: '',
      horaFin: '',
      motivo: ''
    };
  }

  cargar(): void {
    this.rrhh.ausencias(this.parametros.IdEmpresa).subscribe({
      next: (r) => (this.filas = r || [])
    });
  }

  solicitar(): void {
    if (!this.form.idEmpleados || !this.form.idTipoAusencia) {
      this.toast('Seleccione empleado y tipo');
      return;
    }
    const tipo = this.tipos.find((t) => t.idTipoAusencia === this.form.idTipoAusencia);
    const body = {
      ...this.form,
      idEmpresa: this.parametros.IdEmpresa,
      unidad: tipo?.unidadDefault || 'DIAS',
      horaInicio: this.form.horaInicio ? this.form.horaInicio + ':00' : null,
      horaFin: this.form.horaFin ? this.form.horaFin + ':00' : null
    };
    this.rrhh.solicitarAusencia(body).subscribe({
      next: () => {
        this.toast('Solicitud registrada');
        this.form = this.empty();
        this.cargar();
      },
      error: (e) => this.toast(e?.error?.message || 'No se pudo solicitar')
    });
  }

  decidir(id: number, aprobar: boolean): void {
    this.rrhh.decidirAusencia(id, aprobar).subscribe({
      next: () => {
        this.toast(aprobar ? 'Aprobado' : 'Rechazado');
        this.cargar();
      },
      error: (e) => this.toast(e?.error?.message || 'No se pudo decidir')
    });
  }

  nombreTipo(id: number): string {
    return this.tipos.find((t) => t.idTipoAusencia === id)?.nombre || String(id);
  }
  nombreEmp(id: number): string {
    return this.empleados.find((e) => e.idEmpleados === id)?.nombre || String(id);
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2200 });
    await t.present();
  }
}
