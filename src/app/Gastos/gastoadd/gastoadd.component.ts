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
      this.gasto.formaPago ||
      this.gasto.orien ||
      'EFECTIVO';

    if (!this.isEdit && !this.gasto.tipoGasto) {
      this.gasto.tipoGasto = 'Otros';
    }

    this.CargarMetodosPago();
  }

  private armarGastoParaGuardar(): Gastos {
    const formaPago =
      (this.gasto.formaPago || this.gasto.orien || 'EFECTIVO').trim();

    return {
      idGasto: this.gasto.idGasto || 0,
      idEmpresa: this._Para.GetIdEmpresa(),
      idUsuario: this._Para.IdUsuario,
      idEmpleado: this.gasto.idEmpleado ?? null,
      tipoGasto: (this.gasto.tipoGasto || '').trim(),
      monto: Number(this.gasto.monto) || 0,
      orien: formaPago,
      detalle: (this.gasto.detalle || '').trim(),
      formaPago,
      idCuentaFinanciera: this.gasto.idCuentaFinanciera ?? null,
      referencia: (this.gasto.referencia || '').trim(),
      estaAnulado: this.gasto.estaAnulado ?? false,
      fechaRegistro: this.gasto.fechaRegistro ?? new Date(),
    };
  }

  private async validarGasto(): Promise<boolean> {
    if (!this.gasto.tipoGasto?.trim()) {
      (
        await this.toastCtrl.create({
          message: 'Seleccione un tipo de gasto.',
          duration: 2000,
          color: 'warning',
        })
      ).present();
      return false;
    }

    if (!this.gasto.monto || Number(this.gasto.monto) <= 0) {
      (
        await this.toastCtrl.create({
          message: 'Ingrese un monto válido mayor a cero.',
          duration: 2000,
          color: 'warning',
        })
      ).present();
      return false;
    }

    if (!(this.gasto.formaPago || this.gasto.orien)?.trim()) {
      (
        await this.toastCtrl.create({
          message: 'Seleccione un método de pago.',
          duration: 2000,
          color: 'warning',
        })
      ).present();
      return false;
    }

    return true;
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

  if (!(await this.validarGasto())) {
    return;
  }

  const gastoParaGuardar =
    this.armarGastoParaGuardar();

  if (this.isEdit) {

    this.gastosSrv
      .actualizarGasto(gastoParaGuardar)
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
    .crearGasto(gastoParaGuardar)
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