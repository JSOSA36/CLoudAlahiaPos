import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AlertController, ToastController } from '@ionic/angular';
import { Parametros } from '../models/parametros.models';
import { ParametroConfigService } from '../servicios/parametrosconfig.service';
import { ParametrosService } from '../servicios/parametros.service';

@Component({
  selector: 'app-parametros-config',
  templateUrl: './parametros-config.component.html',
  styleUrls: ['./parametros-config.component.scss'],
})
export class ParametrosConfigComponent implements OnInit {

  idEmpresa = 0;
  codigoPOS = 'POS01';

  parametrosEmpresa: Parametros[] = [];
  parametrosPOS: Parametros[] = [];

  cargando = false;
  datosCargados = false;

  constructor(
    private parametroService: ParametroConfigService,
    private parametros: ParametrosService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.idEmpresa = this.parametros.GetIdEmpresa();
    this.cargarParametros();
  }

  cargarParametros() {
    const idEmpresa = Number(this.idEmpresa) || 0;

    if (!idEmpresa) {
      this.mostrarToast('Debe indicar un IdEmpresa válido');
      return;
    }

    this.cargando = true;
    this.datosCargados = false;

    forkJoin({
      empresa: this.parametroService.getParametrosEmpresa(idEmpresa),
      pos: this.parametroService.getParametrosPOS(idEmpresa, this.codigoPOS || 'POS01')
    }).subscribe({
      next: ({ empresa, pos }) => {
        this.parametrosEmpresa = this.normalizarLista(empresa);
        this.parametrosPOS = this.normalizarLista(pos);
        this.cargando = false;
        this.datosCargados = true;

        console.log('Parámetros empresa:', this.parametrosEmpresa);
        console.log('Parámetros POS:', this.parametrosPOS);

        if (!this.parametrosEmpresa.length && !this.parametrosPOS.length) {
          this.mostrarToast(
            `No se encontraron parámetros para la empresa ${idEmpresa}`
          );
        }
      },
      error: async (err) => {
        this.cargando = false;
        this.datosCargados = true;
        console.error(err);
        await this.mostrarToast('Error cargando parámetros');
      }
    });
  }

  private normalizarLista(lista: Parametros[] | null | undefined): Parametros[] {
    return (lista || []).map(item => ({
      idParametro: item.idParametro,
      idEmpresa: item.idEmpresa || this.idEmpresa,
      codigoPOS: item.codigoPOS ?? null,
      clave: item.clave || (item as any).Clave || '',
      valor: item.valor ?? (item as any).Valor ?? '',
      descripcion: item.descripcion ?? (item as any).Descripcion ?? ''
    }));
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
