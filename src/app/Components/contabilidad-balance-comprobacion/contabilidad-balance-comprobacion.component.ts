import { Component, OnInit } from '@angular/core';
import { ContabilidadReportesService } from 'src/app/servicios/contabilidad-reportes.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { BalanceComprobacionResumen } from 'src/app/models/ContabilidadReportes.models';

@Component({
  selector: 'app-contabilidad-balance-comprobacion',
  templateUrl: './contabilidad-balance-comprobacion.component.html',
  styleUrls: ['./contabilidad-balance-comprobacion.component.scss'],
})
export class ContabilidadBalanceComprobacionComponent implements OnInit {
  cargando = false;
  resumen: BalanceComprobacionResumen | null = null;
  fechaInicio = '';
  fechaFin = '';

  constructor(
    private reportesService: ContabilidadReportesService,
    private parametros: ParametrosService
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = inicioMes.toISOString();
    this.fechaFin = hoy.toISOString();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.reportesService.getBalanceComprobacion(
      this.parametros.GetIdEmpresa(),
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
