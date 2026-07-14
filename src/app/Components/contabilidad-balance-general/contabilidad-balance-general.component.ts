import { Component, OnInit } from '@angular/core';
import { ContabilidadReportesService } from 'src/app/servicios/contabilidad-reportes.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { BalanceGeneral } from 'src/app/models/ContabilidadReportes.models';

@Component({
  selector: 'app-contabilidad-balance-general',
  templateUrl: './contabilidad-balance-general.component.html',
  styleUrls: ['./contabilidad-balance-general.component.scss'],
})
export class ContabilidadBalanceGeneralComponent implements OnInit {
  cargando = false;
  balance: BalanceGeneral | null = null;
  fechaCorte = '';

  constructor(
    private reportesService: ContabilidadReportesService,
    private parametros: ParametrosService
  ) {}

  ngOnInit(): void {
    this.fechaCorte = new Date().toISOString();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.reportesService.getBalanceGeneral(
      this.parametros.GetIdEmpresa(),
      this.fechaCorte
    ).subscribe({
      next: (resp) => {
        this.balance = resp;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }
}
