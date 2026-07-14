import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ContabilidadConfiguracionService } from 'src/app/servicios/contabilidad-configuracion.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ContabilidadConfiguracion } from 'src/app/models/ContabilidadConfiguracion.models';

@Component({
  selector: 'app-contabilidad-configuracion-integracion',
  templateUrl: './contabilidad-configuracion-integracion.component.html',
  styleUrls: ['./contabilidad-configuracion-integracion.component.scss'],
})
export class ContabilidadConfiguracionIntegracionComponent implements OnInit {
  cargando = false;
  guardando = false;
  sinAcceso = false;
  config: ContabilidadConfiguracion | null = null;

  integracionAutomatica = false;
  generarCOGSAutomatico = true;
  separarAsientoCOGS = true;

  constructor(
    private configService: ContabilidadConfiguracionService,
    private parametros: ParametrosService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.sinAcceso = false;

    this.configService.get(this.parametros.GetIdEmpresa()).subscribe({
      next: (resp) => {
        this.config = resp;
        this.integracionAutomatica = resp.integracionAutomatica;
        this.generarCOGSAutomatico = resp.generarCOGSAutomatico;
        this.separarAsientoCOGS = resp.separarAsientoCOGS;
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        if (err?.status === 403) {
          this.sinAcceso = true;
          return;
        }

        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.message || 'No se pudo cargar la configuración.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  guardar(): void {
    this.guardando = true;

    this.configService.actualizar({
      idEmpresa: this.parametros.GetIdEmpresa(),
      integracionAutomatica: this.integracionAutomatica,
      generarCOGSAutomatico: this.generarCOGSAutomatico,
      separarAsientoCOGS: this.separarAsientoCOGS
    }).subscribe({
      next: async (resp) => {
        this.config = resp;
        this.guardando = false;
        const alert = await this.alertCtrl.create({
          header: 'Guardado',
          message: 'Configuración actualizada correctamente.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        this.guardando = false;
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.message || 'No se pudo guardar la configuración.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }
}
