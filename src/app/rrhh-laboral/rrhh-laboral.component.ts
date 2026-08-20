import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { EmpleadosService } from '../servicios/empleados.service';
import { ParametrosService } from '../servicios/parametros.service';
import { EmpleadoLaboralDto, RrhhLaboralService } from '../servicios/rrhh-laboral.service';
import { RrhhService } from '../servicios/rrhh.service';
import { Empleado } from '../models/empleado.models';

@Component({
  selector: 'app-rrhh-laboral',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  templateUrl: './rrhh-laboral.component.html',
  styleUrls: ['../rrhh/rrhh-shared.scss']
})
export class RrhhLaboralComponent implements OnInit {
  empleados: Empleado[] = [];
  idEmpleados = 0;
  laboral: EmpleadoLaboralDto = this.emptyLaboral();
  departamentos: any[] = [];
  cargos: any[] = [];
  guardando = false;

  constructor(
    private empleadosSvc: EmpleadosService,
    private rrhh: RrhhLaboralService,
    private catalogos: RrhhService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.empleadosSvc.getByEmpresa(this.parametros.IdEmpresa).subscribe({
      next: (list) => (this.empleados = list || [])
    });
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    const id = this.parametros.IdEmpresa;
    this.catalogos.departamentos(id).subscribe({ next: (r) => (this.departamentos = r || []) });
    this.catalogos.cargos(id).subscribe({ next: (r) => (this.cargos = r || []) });
  }

  emptyLaboral(): EmpleadoLaboralDto {
    return {
      idEmpresa: this.parametros.IdEmpresa,
      idEmpleados: 0,
      tipoEmpleado: 'FIJO',
      idDepartamento: null,
      idCargo: null,
      estadoLaboral: 'ACTIVO'
    };
  }

  onEmpleadoChange(): void {
    if (!this.idEmpleados) {
      this.laboral = this.emptyLaboral();
      return;
    }
    this.laboral.idEmpleados = this.idEmpleados;
    this.laboral.idEmpresa = this.parametros.IdEmpresa;
    this.rrhh.getLaboral(this.parametros.IdEmpresa, this.idEmpleados).subscribe({
      next: (row) => {
        if (row) {
          this.laboral = { ...row, idEmpleados: this.idEmpleados, idEmpresa: this.parametros.IdEmpresa };
          if (this.laboral.fechaIngreso) this.laboral.fechaIngreso = String(this.laboral.fechaIngreso).slice(0, 10);
        }
        else {
          this.laboral = this.emptyLaboral();
          this.laboral.idEmpleados = this.idEmpleados;
        }
      }
    });
  }

  onCargoChange(): void {
    const cargo = this.cargos.find((c) => c.idCargo === this.laboral.idCargo);
    if (!cargo) {
      this.laboral.paqueteCargo = null;
      return;
    }
    this.laboral.paqueteCargo = {
      idCargo: cargo.idCargo,
      nombre: cargo.nombre,
      salarioBase: cargo.salarioBase,
      moneda: cargo.moneda,
      frecuenciaPago: cargo.frecuenciaPago,
      tipoEmpleado: cargo.tipoEmpleado,
      idJornada: cargo.idJornada,
      nombreJornada: cargo.nombreJornada,
      beneficios: cargo.beneficios || []
    };
    if (!this.laboral.tipoEmpleado) this.laboral.tipoEmpleado = cargo.tipoEmpleado || 'FIJO';
  }

  guardar(): void {
    if (!this.idEmpleados) {
      this.toast('Seleccione un empleado');
      return;
    }
    if (!this.laboral.idDepartamento) {
      this.toast('Asigne el departamento');
      return;
    }
    if (!this.laboral.idCargo) {
      this.toast('Asigne el cargo');
      return;
    }
    this.guardando = true;
    this.laboral.idEmpleados = this.idEmpleados;
    this.laboral.idEmpresa = this.parametros.IdEmpresa;
    this.rrhh.saveLaboral(this.laboral).subscribe({
      next: (saved) => {
        this.guardando = false;
        this.laboral = saved;
        this.toast('Expediente guardado. El empleado hereda salario, horario y beneficios del cargo.');
      },
      error: (err) => {
        this.guardando = false;
        this.toast(err?.error?.message || 'Error al guardar');
      }
    });
  }

  ir(ruta: string): void {
    this.router.navigateByUrl(ruta);
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2600, color: 'dark' });
    await t.present();
  }
}
