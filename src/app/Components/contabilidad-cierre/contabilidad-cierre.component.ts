import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ContabilidadCierreService } from 'src/app/servicios/contabilidad-cierre.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PeriodoContable } from 'src/app/models/ContabilidadReportes.models';

@Component({
  selector: 'app-contabilidad-cierre',
  templateUrl: './contabilidad-cierre.component.html',
  styleUrls: ['./contabilidad-cierre.component.scss'],
})
export class ContabilidadCierreComponent implements OnInit {
  cargando = false;
  cerrando = false;
  periodo: PeriodoContable | null = null;
  anio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  observacion = '';

  readonly meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  readonly anios: number[] = [];

  constructor(
    private cierreService: ContabilidadCierreService,
    private parametros: ParametrosService,
    private alertCtrl: AlertController
  ) {
    const actual = new Date().getFullYear();
    for (let a = actual - 5; a <= actual + 1; a++) {
      this.anios.push(a);
    }
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.cierreService.getPeriodo(
      this.parametros.GetIdEmpresa(),
      this.anio,
      this.mes
    ).subscribe({
      next: (resp) => {
        this.periodo = resp;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  async cerrarPeriodo(): Promise<void> {
    if (this.periodo?.estado === 'Cerrado') {
      const alert = await this.alertCtrl.create({
        header: 'Período cerrado',
        message: 'Este período ya está cerrado.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const confirm = await this.alertCtrl.create({
      header: 'Cerrar período',
      message: `¿Desea cerrar el período ${this.meses[this.mes - 1].nombre} ${this.anio}?`,
      inputs: [
        {
          name: 'observacion',
          type: 'textarea',
          placeholder: 'Observación (opcional)',
          value: this.observacion
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Período',
          handler: (data) => {
            this.ejecutarCierre(data.observacion);
          }
        }
      ]
    });
    await confirm.present();
  }

  private ejecutarCierre(observacion?: string): void {
    this.cerrando = true;
    this.cierreService.cerrarPeriodo({
      idEmpresa: this.parametros.GetIdEmpresa(),
      anio: this.anio,
      mes: this.mes,
      idUsuario: this.parametros.IdUsuario,
      observacion: observacion?.trim() || undefined
    }).subscribe({
      next: async (resp) => {
        this.periodo = resp;
        this.cerrando = false;
        const alert = await this.alertCtrl.create({
          header: 'Período cerrado',
          message: resp.mensaje,
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        this.cerrando = false;
        const alert = await this.alertCtrl.create({
          header: 'No se pudo cerrar',
          message: err?.error?.message || 'Ocurrió un error al cerrar el período.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  estadoColor(): string {
    return this.periodo?.estado === 'Cerrado' ? 'medium' : 'success';
  }
}
