import { Component, OnInit } from '@angular/core';
import { ContabilidadReportesService } from 'src/app/servicios/contabilidad-reportes.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EstadoResultados } from 'src/app/models/ContabilidadReportes.models';

@Component({
  selector: 'app-contabilidad-estado-resultados',
  templateUrl: './contabilidad-estado-resultados.component.html',
  styleUrls: ['./contabilidad-estado-resultados.component.scss'],
})
export class ContabilidadEstadoResultadosComponent implements OnInit {
  cargando = false;
  resultado: EstadoResultados | null = null;
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
    this.reportesService.getEstadoResultados(
      this.parametros.GetIdEmpresa(),
      this.fechaInicio,
      this.fechaFin
    ).subscribe({
      next: (resp) => {
        this.resultado = resp;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }
}
