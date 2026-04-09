import { Component, OnInit } from '@angular/core';

import { AlertController, ToastController } from '@ionic/angular';
import { Parametros } from '../models/parametros.models';
import { ParametroConfigService } from '../servicios/parametrosconfig.service';
@Component({
  selector: 'app-parametros-config',
  templateUrl: './parametros-config.component.html',
  styleUrls: ['./parametros-config.component.scss'],
})
export class ParametrosConfigComponent  implements OnInit {

 idEmpresa: number = 1;
  codigoPOS: string = 'POS01';

  parametrosEmpresa: Parametros[] = [];
  parametrosPOS: Parametros[] = [];

  cargando = false;

  constructor(
    private parametroService: ParametroConfigService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.cargarParametros();
  }

  cargarParametros() {
    this.cargando = true;

    this.parametroService.getParametrosEmpresa(this.idEmpresa).subscribe({
      next: (empresaParams) => {
        console.log('Parámetros de empresa cargados:', empresaParams);
        this.parametrosEmpresa = empresaParams ?? [];

        this.parametroService.getParametrosPOS(this.idEmpresa, this.codigoPOS).subscribe({
          next: (posParams) => {
            this.parametrosPOS = posParams ?? [];
            this.cargando = false;
          },
          error: async (err) => {
            this.cargando = false;
            console.error(err);
            await this.mostrarToast('Error cargando parámetros POS');
          }
        });
      },
      error: async (err) => {
        this.cargando = false;
        console.error(err);
        await this.mostrarToast('Error cargando parámetros de empresa');
      }
    });
  }

  agregarParametroEmpresa() {
    this.parametrosEmpresa.push({
      idEmpresa: this.idEmpresa,
      codigoPOS: null,
      clave: '',
      valor: '',
      descripcion: ''
    });
  }

  agregarParametroPOS() {
    this.parametrosPOS.push({
      idEmpresa: this.idEmpresa,
      codigoPOS: this.codigoPOS,
      clave: '',
      valor: '',
      descripcion: ''
    });
  }

  eliminarParametroEmpresa(index: number) {
    this.parametrosEmpresa.splice(index, 1);
  }

  eliminarParametroPOS(index: number) {
    this.parametrosPOS.splice(index, 1);
  }

  async guardar() {
    const listaFinal: Parametros[] = [
      ...this.parametrosEmpresa.map(x => ({
        ...x,
        idEmpresa: this.idEmpresa,
        codigoPOS: null
      })),
      ...this.parametrosPOS.map(x => ({
        ...x,
        idEmpresa: this.idEmpresa,
        codigoPOS: this.codigoPOS
      }))
    ];

    const invalidos = listaFinal.filter(x => !x.clave?.trim());
    if (invalidos.length > 0) {
      await this.mostrarToast('Hay parámetros sin clave');
      return;
    }

    this.parametroService.guardarLista(listaFinal).subscribe({
      next: async () => {
        await this.mostrarToast('Parámetros guardados correctamente ✅');
        this.cargarParametros();
      },
      error: async (err) => {
        console.error(err);
        await this.mostrarToast('Error al guardar parámetros');
      }
    });
  }

  async confirmarGuardar() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Deseas guardar los parámetros?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: () => {
            this.guardar();
          }
        }
      ]
    });

    await alert.present();
  }

  async mostrarToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'top'
    });

    await toast.present();
  }

}
