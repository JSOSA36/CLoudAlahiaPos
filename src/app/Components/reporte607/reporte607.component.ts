import { Component, OnInit } from '@angular/core';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-reporte607',
  templateUrl: './reporte607.component.html',
  styleUrls: ['./reporte607.component.scss'],
})
export class Reporte607Component implements OnInit {

  // ======================================================
  // 🔥 LISTADO
  // ======================================================

  listado607: any[] = [];

  // ======================================================
  // 🔥 TOTALES
  // ======================================================

  totalGeneral = 0;

  totalItbis = 0;

  totalFacturas = 0;

  // ======================================================
  // 🔥 FECHAS
  // ======================================================

  // ======================================================
// 🔥 FECHAS
// ======================================================

desde: string =
  new Date()
  .toISOString()
  .split('T')[0];

hasta: string =
  new Date()
  .toISOString()
  .split('T')[0];

  // ======================================================
  // 🔥 LOADING
  // ======================================================

  cargando = false;

  constructor(

    private facturaService:
      FacturaHeaderService,

    public parametro:
      ParametrosService

  ) { }

  // ======================================================
  // 🔥 INIT
  // ======================================================

  ngOnInit() {

    this.cargarReporte();
  }

  // ======================================================
  // 🔥 CARGAR
  // ======================================================

  cargarReporte() {

    this.cargando = true;

    this.facturaService
      .GetReporte607(

        this.desde,
        this.hasta,
        this.parametro.IdEmpresa

      )
      .subscribe({

        next: (res) => {

          console.log(
            '📊 REPORTE 607',
            res
          );

          this.listado607 =
            res || [];

          this.calcularTotales();

          this.cargando = false;
        },

        error: (err) => {

          console.error(
            '❌ ERROR REPORTE 607',
            err
          );

          this.cargando = false;
        }
      });
  }

  // ======================================================
  // 🔥 TOTALES
  // ======================================================

  calcularTotales() {

    this.totalGeneral =
      this.listado607.reduce(

        (acc, item) =>

          acc + (item.total || 0),

        0
      );

    this.totalItbis =
      this.listado607.reduce(

        (acc, item) =>

          acc + (item.itbis || 0),

        0
      );

    this.totalFacturas =
      this.listado607.length;
  }

}