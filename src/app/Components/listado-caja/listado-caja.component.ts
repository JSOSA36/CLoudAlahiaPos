import {

  Component,

  OnInit

} from '@angular/core';

import { CajaCierreService }
from 'src/app/servicios/caja-cierre.service';


import { ParametrosService }
from 'src/app/servicios/parametros.service';
import { PrintService }
from 'src/app/servicios/print.services';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
@Component({

  selector: 'app-listado-caja',

  templateUrl:
    './listado-caja.component.html',

  styleUrls:
    ['./listado-caja.component.scss'],
})
export class ListadoCajaComponent
implements OnInit {

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  listadoCaja:any[] = [];

  cargando = false;

  totalVentas = 0;

  totalDiferencia = 0;

  cajasAbiertas = 0;

  cajasCerradas = 0;

  fechaDesde:string = '';

  fechaHasta:string = '';

  idSucursalFiltro = 0;

  reimprimiendoId = 0;

  constructor(

    private cajaCierreService:
      CajaCierreService,
    private _parametroService:
      ParametrosService,
    private printService: PrintService,
    private toastCtrl: ToastController

  ) { }

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit() {

    const hoy = new Date();

    const fecha =

      hoy
      .toISOString()
      .split('T')[0];

    this.fechaDesde = fecha;

    this.fechaHasta = fecha;

    this.CargarListadoCaja();
  }

  idCierreDeFila(caja: any): number {
    return Number(caja?.idCajaCierre ?? caja?.IdCajaCierre ?? 0) || 0;
  }

  async reimprimirCierre(caja: any): Promise<void> {
    const id = this.idCierreDeFila(caja);
    if (!id || this.reimprimiendoId) {
      return;
    }

    this.reimprimiendoId = id;

    try {
      await firstValueFrom(this.printService.printCierre(id));
      const toast = await this.toastCtrl.create({
        message: 'Cierre enviado a la impresora.',
        duration: 2500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch {
      const toast = await this.toastCtrl.create({
        message: 'No se pudo imprimir. Verifica el agente de impresión.',
        duration: 4000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.reimprimiendoId = 0;
    }
  }

  /* =====================================
  🔥 CARGAR LISTADO
  ====================================== */

  CargarListadoCaja(){

    this.cargando = true;

    this.cajaCierreService
    .getByFecha(
  this._parametroService.IdEmpresa,
      this.fechaDesde,

      this.fechaHasta,
      this.idSucursalFiltro
    

    )
    .subscribe({

      next:(data:any[])=>{

        console.log(
          'LISTADO:',
          data
        );

        this.listadoCaja = data;

        this.CalcularTotales();

        this.cargando = false;
      },

      error:(err)=>{

        console.error(err);

        this.cargando = false;
      }
    });
  }

  onFiltroSucursal(id: number): void {
    const next = Number(id) || 0;
    if (next === this.idSucursalFiltro) return;
    this.idSucursalFiltro = next;
    this.CargarListadoCaja();
  }

  /* =====================================
  🔥 CALCULAR TOTALES
  ====================================== */

CalcularTotales(): void {

  this.totalVentas = 0;

  this.totalDiferencia = 0;

  this.cajasAbiertas = 0;

  this.cajasCerradas = 0;

  this.listadoCaja.forEach(caja => {

    // =====================================
    // 🔥 TOTAL INGRESOS NETOS
    // =====================================

    this.totalVentas += Number(

      caja.totalIngresosNetos ?? 0

    );

    // =====================================
    // 🔥 DIFERENCIAS
    // =====================================

    this.totalDiferencia += Number(

      caja.diferencia ?? 0

    );

    // =====================================
    // 🔥 ESTADO
    // =====================================

    if (caja.estado === 'ABIERTA') {

      this.cajasAbiertas++;

    } else {

      this.cajasCerradas++;
    }
  });
}
  /* =====================================
  🔥 COLOR ESTADO
  ====================================== */

  GetEstadoColor(
    estado:string
  ){

    switch(estado){

      case 'ABIERTA':

        return 'warning';

      case 'CERRADA':

        return 'success';

      default:

        return 'medium';
    }
  }

  /* =====================================
  🔥 DIFERENCIA COLOR
  ====================================== */

  GetDiferenciaClass(
    valor:number
  ){

    if(valor > 0){

      return 'verde';
    }

    if(valor < 0){

      return 'rojo';
    }

    return 'azul';
  }
}