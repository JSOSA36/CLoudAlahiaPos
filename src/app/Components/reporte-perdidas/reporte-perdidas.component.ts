import {
  Component,
  OnInit
} from '@angular/core';

import {
  MovimientosInventario
} from 'src/app/models/MovimientosInventario.models';

import {
  MovimientosInventarioService
} from 'src/app/servicios/MovimientosInventarioService.models';

import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

export interface LineaPerdida {

  fecha: Date;

  idMovimiento: number;

  producto: string;

  cantidad: number;

  costo: number;

  valorPerdida: number;

  almacen: string;

  observacion: string;
}

@Component({
  selector: 'app-reporte-perdidas',
  templateUrl: './reporte-perdidas.component.html',
  styleUrls: ['./reporte-perdidas.component.scss'],
})
export class ReportePerdidasComponent
implements OnInit {

  lineas: LineaPerdida[] = [];

  desde: string = this.inicioMes();

  hasta: string =
    new Date()
      .toISOString()
      .split('T')[0];

  cargando = false;

  totalPerdida = 0;

  totalUnidades = 0;

  constructor(

    private movimientosService:
      MovimientosInventarioService,

    public parametros:
      ParametrosService
  ) {}

  ngOnInit(): void {

    this.cargarReporte();
  }

  private inicioMes(): string {

    const hoy = new Date();

    return new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    )
      .toISOString()
      .split('T')[0];
  }

  cargarReporte(): void {

    this.cargando = true;

    this.movimientosService
      .FiltrarHistorial(

        this.parametros.GetIdEmpresa(),

        this.desde,

        this.hasta,

        'SALIDA',

        'PERDIDA'
      )
      .subscribe({

        next: (res) => {

          this.lineas =
            this.aplanarPerdidas(res || []);

          this.calcularTotales();

          this.cargando = false;
        },

        error: () => {

          this.lineas = [];

          this.calcularTotales();

          this.cargando = false;
        }
      });
  }

  private aplanarPerdidas(
    movimientos: MovimientosInventario[]
  ): LineaPerdida[] {

    const lineas: LineaPerdida[] = [];

    for (const mov of movimientos) {

      const detalles =
        mov.detalles
        || (mov as any).Detalles
        || [];

      for (const det of detalles) {

        const cantidad =
          Math.abs(
            Number(det.cantidad || 0)
          );

        const costo =
          Number(
            det.precio
            || (det as any).Precio
            || 0
          );

        const valorPerdida =
          Number(
            det.subTotal
            || (det as any).SubTotal
            || 0
          )
          || cantidad * costo;

        const nombreProducto =
          typeof det.producto === 'string'
            ? det.producto
            : det.producto?.nombre
            || (det as any).Producto
            || '';

        lineas.push({

          fecha: new Date(mov.fecha),

          idMovimiento: mov.id,

          producto: nombreProducto,

          cantidad,

          costo,

          valorPerdida,

          almacen:
            mov.nombreAlmacen
            || (mov as any).NombreAlmacen
            || '',

          observacion:
            mov.observacion || ''
        });
      }
    }

    return lineas.sort((a, b) =>

      new Date(b.fecha).getTime()
        - new Date(a.fecha).getTime()
    );
  }

  private calcularTotales(): void {

    this.totalPerdida =
      this.lineas.reduce(

        (acc, item) =>
          acc + item.valorPerdida,

        0
      );

    this.totalUnidades =
      this.lineas.reduce(

        (acc, item) =>
          acc + item.cantidad,

        0
      );
  }

  imprimir(): void {

    window.print();
  }

  limpiarFiltros(): void {

    this.desde = this.inicioMes();

    this.hasta =
      new Date()
        .toISOString()
        .split('T')[0];

    this.cargarReporte();
  }

  formatearFecha(
    fecha: string
  ): string {

    if (!fecha) {
      return '';
    }

    const partes =
      fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
}
