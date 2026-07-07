import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

import { GastosService } from 'src/app/servicios/gastos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { MetodoPagoCuentaService } from 'src/app/servicios/metodo-pago-cuenta.service';

import { Gastos } from 'src/app/models/Gastos.models';
import { MetodoPagoCuenta } from 'src/app/models/MetodoPagoCuenta.models';

@Component({
  selector: 'app-gasto-form',
  templateUrl: './gastoadd.component.html',
  styleUrls: ['./gastoadd.component.scss'],
})
export class GastoFormPage implements OnInit {

  /* =====================================
  🔥 INPUTS
  ====================================== */

  @Input()
  gasto: Gastos = new Gastos();

  @Input()
  isEdit: boolean = false;

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  modalEfectivo = false;

  metodosPago: MetodoPagoCuenta[] = [];

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private gastosSrv: GastosService,

    private toastCtrl: ToastController,

    public modalCtrl: ModalController,

    private _Para: ParametrosService,

    private metodoPagoCuentaService: MetodoPagoCuentaService

  ) {}

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit(): void {

    this.gasto.idEmpresa =
      this._Para.GetIdEmpresa();

    this.gasto.idUsuario =
      this._Para.IdUsuario;

    this.gasto.formaPago =
      this.gasto.formaPago || 'EFECTIVO';

    this.CargarMetodosPago();
  }

  /* =====================================
  🔥 CARGAR MÉTODOS
  ====================================== */

  CargarMetodosPago(): void {

    this.metodoPagoCuentaService
      .getByEmpresa(

        this._Para.GetIdEmpresa()

      )
      .subscribe({

        next: (resp: MetodoPagoCuenta[]) => {

          this.metodosPago =

            (resp || [])
              .filter(x => x.activo);

          console.log(
            'METODOS:',
            this.metodosPago
          );
        },

        error: (err) => {

          console.error(err);
        }
      });
  }

  /* =====================================
  🔥 GUARDAR
  ====================================== */
/* =====================================
🔥 GUARDAR
====================================== */

async guardar(): Promise<void> {

  this.gasto.idEmpresa =
    this._Para.GetIdEmpresa();

  this.gasto.idUsuario =
    this._Para.IdUsuario;

  if (this.isEdit) {

    this.gastosSrv
      .actualizarGasto(this.gasto)
      .subscribe(async (resp: any) => {

        if (!resp.success) {

          (
            await this.toastCtrl.create({

              message: resp.message,

              duration: 2500,

              color: 'warning'

            })
          ).present();

          return;
        }

        (
          await this.toastCtrl.create({

            message:
              '✏️ Gasto actualizado correctamente',

            duration: 1500,

            color: 'success'

          })
        ).present();

        this.gasto = new Gastos();

        this.gasto.idEmpresa =
          this._Para.GetIdEmpresa();

        this.gasto.idUsuario =
          this._Para.IdUsuario;

        this.modalCtrl.dismiss({
          recargar: true
        });

      });

    return;
  }

  this.gastosSrv
    .crearGasto(this.gasto)
    .subscribe(async (resp: any) => {

      if (!resp.success) {

        (
          await this.toastCtrl.create({

            message: resp.message,

            duration: 2500,

            color: 'warning'

          })
        ).present();

        return;
      }

      (
        await this.toastCtrl.create({

          message:
            '✅ Gasto registrado',

          duration: 1500,

          color: 'success'

        })
      ).present();

      this.gasto = new Gastos();

      this.gasto.idEmpresa =
        this._Para.GetIdEmpresa();

      this.gasto.idUsuario =
        this._Para.IdUsuario;

      this.modalCtrl.dismiss({
        recargar: true
      });

    });
}

  /* =====================================
  🔥 CERRAR
  ====================================== */

  cerrar(): void {

    this.modalCtrl.dismiss({

      recargar: false

    });
  }
}