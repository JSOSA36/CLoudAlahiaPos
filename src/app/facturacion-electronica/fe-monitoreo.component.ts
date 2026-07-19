import { Component, OnInit } from '@angular/core';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

export interface DashboardFE {
  totalDocumentos: number;
  aceptados: number;
  rechazados: number;
  pendientes: number;
  errores: number;
  condicionales: number;
}

@Component({
  selector: 'app-fe-monitoreo',
  templateUrl: './fe-monitoreo.component.html',
  styleUrls: ['./fe-monitoreo.component.scss'],
})
export class FeMonitoreoComponent implements OnInit {

  dashboard: DashboardFE = {
    totalDocumentos: 0, aceptados: 0, rechazados: 0,
    pendientes: 0, errores: 0, condicionales: 0
  };
  loading = false;

  constructor(
    private feService: FacturacionElectronicaService,
    private parametro: ParametrosService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.feService.getDashboard(this.parametro.IdEmpresa).subscribe({
      next: (data) => { this.dashboard = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  porcentaje(valor: number): number {
    return this.dashboard.totalDocumentos > 0
      ? Math.round((valor / this.dashboard.totalDocumentos) * 100)
      : 0;
  }
}
