import {

  Component,

  EventEmitter,

  Output

} from '@angular/core';

import {
  ModalController,
  ToastController
} from '@ionic/angular';

import { ParametrosService }
from 'src/app/servicios/parametros.service';

import { CajaAperturaService }
from 'src/app/servicios/caja-apertura.service';

@Component({

  selector: 'app-apertura-caja',

  templateUrl:
    './apertura-caja.component.html',

  styleUrls:
    ['./apertura-caja.component.scss']
})
export class AperturaCajaComponent {

  /* =====================================
  🔥 OUTPUT
  ====================================== */

  @Output()
  onAbrirCaja =
    new EventEmitter<any>();

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  montoInicial = 0;

  observacion = '';

  cargando = false;

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private modalCtrl:
      ModalController,

    private toastCtrl:
      ToastController,

    private parametro:
      ParametrosService,

    private _CajaApertura:
      CajaAperturaService

  ){}

  /* =====================================
  🔥 ABRIR CAJA
  ====================================== */

  abrirCaja(){

    const monto =
      Number(this.montoInicial ?? 0);

    if (isNaN(monto) || monto < 0) {

      this.MostrarMensaje(

        'El monto inicial no puede ser negativo',

        'warning'
      );

      return;
    }

    this.montoInicial = monto;

    this.cargando = true;

    const payload = {

      idEmpresa:
        this.parametro
        .GetIdEmpresa(),

      idUsuario:
        this.parametro
        .IdUsuario,

      montoInicial:
        this.montoInicial,

      observacion:
        this.observacion
    };

    console.log(
      'APERTURA:',
      payload
    );

    this._CajaApertura
    .abrirCaja(payload)
    .subscribe({

      next:(resp:any)=>{

        console.log(
          'RESPUESTA:',
          resp
        );

        if(!resp.success){

          this.MostrarMensaje(

            resp.message,

            'warning'
          );

          this.cargando = false;

          return;
        }

        /* =====================================
        🔥 LOCAL STORAGE
        ====================================== */

        localStorage.setItem(

          'CAJA_ABIERTA',

          'true'
        );

        localStorage.setItem(

          'MONTO_INICIAL_CAJA',

          String(
            this.montoInicial
          )
        );

        if(resp.idCajaApertura){

          localStorage.setItem(

            'ID_CAJA_APERTURA',

            String(
              resp.idCajaApertura
            )
          );
        }

        /* =====================================
        🔥 EVENT
        ====================================== */

        this.onAbrirCaja.emit(
          payload
        );

        /* =====================================
        🔥 MENSAJE
        ====================================== */

        this.MostrarMensaje(

          'Caja aperturada correctamente',

          'success'
        );

        /* =====================================
        🔥 CERRAR MODAL
        ====================================== */

        this.modalCtrl.dismiss(
          payload
        );

        this.cargando = false;
      },

      error:(err)=>{

        console.error(
          'ERROR:',
          err
        );

        const mensaje =

          err?.error?.message

          ||

          'Error aperturando caja';

        this.MostrarMensaje(

          mensaje,

          'danger'
        );

        this.cargando = false;
      }
    });
  }

  /* =====================================
  🔥 TOAST
  ====================================== */

  async MostrarMensaje(

    mensaje:string,

    color:
      'success'
      |
      'danger'
      |
      'warning'

  ){

    const toast =

      await this.toastCtrl
      .create({

        message:
          mensaje,

        duration:2500,

        position:'top',

        color:
          color
      });

    await toast.present();
  }
}