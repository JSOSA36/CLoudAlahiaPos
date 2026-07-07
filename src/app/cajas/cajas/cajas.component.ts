import { Component, OnInit } from '@angular/core';
import { cierrecaja } from 'src/app/models/cierrecaja';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { IngresosService } from 'src/app/servicios/ingresos.service';
import { ingresosLinea } from 'src/app/models/ingresosLinea.models';
@Component({
  selector: 'app-cajas',
  templateUrl: './cajas.component.html',
  styleUrls: ['./cajas.component.scss'],
})
export class CajasComponent implements OnInit {

  ListadoCierre: cierrecaja[] = [];
  fechaFin: string = new Date().toISOString();
  fechaInicio: string = new Date().toISOString();
  TotalGenetal: number = 0;
ingresosLinea: ingresosLinea[] = [];
ingresosAgrupados: any[] = [];
totalLinea: number = 0;
  constructor(
    private _Fact: FacturaHeaderService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private parametro:ParametrosService,
    private _Ingresos: IngresosService
  ) { }

  ngOnInit() {
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.fechaFin = new Date().toISOString().split('T')[0];
     this.CargarIngresosPorLinea(); // 🔥 NUEVO
  }
CargarIngresosPorLinea() {

  const soloFechaInicio =
    this.fechaInicio.split('T')[0];

  const soloFechaFin =
    this.fechaFin.split('T')[0];

  this._Ingresos
    .getIngresosPorLinea(

      this.parametro.GetIdEmpresa(),

      soloFechaInicio,

      soloFechaFin

    )
    .subscribe({

      next: (res: any) => {

        console.log(
          'RAW BACKEND:',
          res
        );

        const data =
          res?.data || [];

        this.ingresosAgrupados =
          this.agruparPorLinea(
            data
          );

        this.totalLinea =
          this.ingresosAgrupados
          .reduce(

            (acc, x) =>
              acc + x.total,

            0
          );

        console.log(
          'AGRUPADO FINAL:',
          this.ingresosAgrupados
        );
      },

      error: (err) => {

        console.error(
          '❌ Error cargando ingresos',
          err
        );
      }
    });
}
agruparPorLinea(data: any[]) {

  const resultado: any = {};

  data.forEach(item => {

    const area = item.areaNegocio;
    const metodo = item.metodoPago;

    if (!resultado[area]) {
      resultado[area] = {
        areaNegocio: area,
        metodos: [],
        total: 0
      };
    }

    // 🔥 buscar si ya existe ese método
    let metodoExistente = resultado[area].metodos.find((m: any) => m.metodo === metodo);

    if (metodoExistente) {
      metodoExistente.total += item.total;
    } else {
      resultado[area].metodos.push({
        metodo: metodo,
        total: item.total
      });
    }

    resultado[area].total += item.total;

  });

  return Object.values(resultado);
}
  ionViewWillEnter() {
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.fechaFin = new Date().toISOString().split('T')[0];
    this.CargarIngresosPorLinea(); // 🔥 NUEVO
  }

  

  GetTotal() {
    this.TotalGenetal = 0;
    this.ListadoCierre.forEach(c => {
      this.TotalGenetal += c.total;
    });
  }

  private async mostrarError(msg: string) {
    (await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: 'danger'
    })).present();
    this.loadingCtrl.dismiss(); // cierro loading en caso de error
  }

}
