import { Component, OnInit } from '@angular/core';
import { ComisionesResultDto } from 'src/app/models/comisionesresultdto';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-comisiones',
  templateUrl: './comisiones.component.html',
  styleUrls: ['./comisiones.component.scss'],
})
export class ComisionesComponent implements OnInit {

  ListadoCimisiones: ComisionesResultDto[] = [];
  fechaFin: string = new Date().toISOString();
  fechaInicio: string = new Date().toISOString();
  TotalGenetal: number = 0;

  constructor(
    private _Fact: FacturaHeaderService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,private parametro:ParametrosService
  ) { }

  ngOnInit() {
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.fechaFin = new Date().toISOString().split('T')[0];
    this.CargarCierre();
  }

  ionViewWillEnter() {
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.fechaFin = new Date().toISOString().split('T')[0];
    this.CargarCierre();
  }

  async CargarCierre() {
    const loading = await this.loadingCtrl.create({
      message: 'Calculando...',
      spinner: 'crescent'
    });

    await loading.present();

    const soloFechaInicio = this.fechaInicio ? this.fechaInicio.split('T')[0] : '';
    const soloFechaFin = this.fechaFin ? this.fechaFin.split('T')[0] : '';

    this._Fact.GetComisiones(soloFechaInicio, soloFechaFin,this.parametro.GetIdEmpresa())
      .pipe(
        timeout(30000), // ⏱ espera máxima de 10 segundos
        catchError(err => {
          console.error('Timeout o error en backend', err);
          this.mostrarError('El servidor no respondió. Intenta más tarde.');
          return of([]); // devolvemos lista vacía para no romper el flujo
        })
      )
      .subscribe({
        next: (c) => {
          this.ListadoCimisiones = c || [];
          this.GetTotal();
        },
        error: (err) => {
          console.error('Error cargando comisiones', err);
          this.mostrarError('Error cargando comisiones');
        },
        complete: async () => {
          await loading.dismiss();
        }
      });
  }

  GetTotal() {
    this.TotalGenetal = 0;
    this.ListadoCimisiones.forEach(c => {
      this.TotalGenetal += c.totalComisiones;
    });
  }

  private async mostrarError(msg: string) {
    (await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: 'danger'
    })).present();
    this.loadingCtrl.dismiss(); // aseguro que se cierre el loading
  }

}
