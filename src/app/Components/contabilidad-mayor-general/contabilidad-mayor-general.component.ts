import { Component, OnInit } from '@angular/core';
import { ContabilidadLibrosService } from 'src/app/servicios/contabilidad-libros.service';
import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { CuentaContable } from 'src/app/models/CuentaContable.models';
import { MayorGeneralResumen } from 'src/app/models/AsientoContable.models';

@Component({
  selector: 'app-contabilidad-mayor-general',
  templateUrl: './contabilidad-mayor-general.component.html',
  styleUrls: ['./contabilidad-mayor-general.component.scss'],
})
export class ContabilidadMayorGeneralComponent implements OnInit {
  cargando = false;
  cuentas: CuentaContable[] = [];
  idCuentaSeleccionada: number | null = null;
  resumen: MayorGeneralResumen | null = null;
  fechaInicio = '';
  fechaFin = '';

  constructor(
    private librosService: ContabilidadLibrosService,
    private cuentaService: CuentaContableService,
    private parametros: ParametrosService
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = inicioMes.toISOString();
    this.fechaFin = hoy.toISOString();

    this.cuentaService.getByEmpresa(this.parametros.GetIdEmpresa()).subscribe({
      next: (cuentas) => {
        this.cuentas = cuentas.filter(c => c.activa);
        const primeraMovimiento = this.cuentas.find(c => c.permiteMovimiento);
        if (primeraMovimiento) {
          this.idCuentaSeleccionada = primeraMovimiento.idCuentaContable;
          this.cargar();
        }
      }
    });
  }

  cargar(): void {
    if (!this.idCuentaSeleccionada) return;

    this.cargando = true;
    this.librosService.getMayorGeneral(
      this.parametros.GetIdEmpresa(),
      this.idCuentaSeleccionada,
      this.fechaInicio,
      this.fechaFin
    ).subscribe({
      next: (resp) => {
        this.resumen = resp;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }
}
