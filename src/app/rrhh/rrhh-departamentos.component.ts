import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { EmpleadosService } from '../servicios/empleados.service';
import { ParametrosService } from '../servicios/parametros.service';
import { RrhhService } from '../servicios/rrhh.service';
import { Empleado } from '../models/empleado.models';

@Component({
  selector: 'app-rrhh-departamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './rrhh-departamentos.component.html',
  styleUrls: ['./rrhh-shared.scss']
})
export class RrhhDepartamentosComponent implements OnInit {
  listado: any[] = [];
  empleados: Empleado[] = [];
  form: any = this.empty();
  guardando = false;

  constructor(
    private rrhh: RrhhService,
    private empleadosSvc: EmpleadosService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.empleadosSvc.getByEmpresa(this.parametros.IdEmpresa).subscribe({
      next: (r) => (this.empleados = r || [])
    });
    this.cargar();
  }

  empty() {
    return {
      idDepartamento: 0,
      idEmpresa: this.parametros.IdEmpresa,
      codigo: '',
      nombre: '',
      descripcion: '',
      idResponsable: null as number | null,
      ubicacion: '',
      telefono: '',
      email: '',
      activo: true
    };
  }

  cargar(): void {
    this.rrhh.departamentos(this.parametros.IdEmpresa).subscribe({
      next: (r) => (this.listado = r || [])
    });
  }

  editar(row: any): void {
    this.form = { ...this.empty(), ...row, idResponsable: row.idResponsable || null };
  }

  nuevo(): void {
    this.form = this.empty();
  }

  guardar(): void {
    if (!this.form.nombre?.trim()) {
      this.toast('El nombre es obligatorio');
      return;
    }
    this.guardando = true;
    this.form.idEmpresa = this.parametros.IdEmpresa;
    this.rrhh.saveDepartamento(this.form).subscribe({
      next: (saved) => {
        this.guardando = false;
        this.form = { ...this.empty(), ...saved };
        this.cargar();
        this.toast('Departamento guardado');
      },
      error: (e) => {
        this.guardando = false;
        this.toast(e?.error?.message || 'No se pudo guardar');
      }
    });
  }

  nombreEmp(id: number | null): string {
    if (!id) return '—';
    return this.empleados.find((e) => e.idEmpleados === id)?.nombre || '—';
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2200, color: 'dark' });
    await t.present();
  }
}
