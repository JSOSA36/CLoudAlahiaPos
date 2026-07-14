import { Component, Input, OnInit } from '@angular/core';

import { AlertController, ModalController } from '@ionic/angular';

import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';

import { ParametrosService } from 'src/app/servicios/parametros.service';

import { CuentaContable, TIPOS_CUENTA } from 'src/app/models/CuentaContable.models';



@Component({

  selector: 'app-modal-cuenta-contable',

  templateUrl: './modal-cuenta-contable.component.html',

  styleUrls: ['./modal-cuenta-contable.component.scss'],

})

export class ModalCuentaContableComponent implements OnInit {

  @Input() cuenta: CuentaContable | null = null;

  @Input() cuentas: CuentaContable[] = [];



  guardando = false;

  isEdit = false;

  tiposCuenta = TIPOS_CUENTA;



  model: CuentaContable = {

    idCuentaContable: 0,

    idEmpresa: 0,

    codigo: '',

    nombre: '',

    tipoCuenta: 'Activo',

    idCuentaPadre: null,

    nivel: 1,

    permiteMovimiento: true,

    activa: true

  };



  constructor(

    private cuentaService: CuentaContableService,

    private parametros: ParametrosService,

    private modalCtrl: ModalController,

    private alertCtrl: AlertController

  ) {}



  ngOnInit(): void {

    this.model.idEmpresa = this.parametros.GetIdEmpresa();



    if (this.cuenta) {

      this.isEdit = true;

      this.model = { ...this.cuenta };

    }

  }



  cerrar(): void {

    this.modalCtrl.dismiss();

  }



  async guardar(): Promise<void> {

    if (!this.model.codigo?.trim() || !this.model.nombre?.trim()) {

      await this.mostrarError('Código y nombre son obligatorios.');

      return;

    }



    this.guardando = true;



    if (this.isEdit) {

      this.cuentaService.update(this.model).subscribe({

        next: async () => {

          this.guardando = false;

          await this.modalCtrl.dismiss({ guardado: true });

        },

        error: async (err: any) => {

          this.guardando = false;

          await this.mostrarError(err?.error?.message || 'No se pudo guardar la cuenta.');

        }

      });

      return;

    }



    this.cuentaService.create(this.model).subscribe({

      next: async () => {

        this.guardando = false;

        await this.modalCtrl.dismiss({ guardado: true });

      },

      error: async (err: any) => {

        this.guardando = false;

        await this.mostrarError(err?.error?.message || 'No se pudo guardar la cuenta.');

      }

    });

  }



  private async mostrarError(message: string): Promise<void> {

    const alert = await this.alertCtrl.create({ header: 'Error', message, buttons: ['OK'] });

    await alert.present();

  }

}


