import {
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';

import {
  AlertController,
  ModalController
} from '@ionic/angular';

import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

import {
  CuentaFinancieraService
} from 'src/app/servicios/cuenta-financiera.service';

import {
  MovimientoFinancieroService
} from 'src/app/servicios/movimiento-financiero.service';

@Component({
  selector: 'app-modal-transferencia-financiera',

  templateUrl:
    './modal-transferencia-financiera.component.html',

  styleUrls:
    ['./modal-transferencia-financiera.component.scss'],
})
export class ModalTransferenciaFinancieraComponent
implements OnInit {

  /* =====================================
  🔥 OUTPUT
  ====================================== */

  @Output()
  onGuardar =
    new EventEmitter<any>();

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  guardando = false;

  cuentas:any[] = [];

  cuentaOrigen:any = null;

  cuentaDestino:any = null;

  monto = 0;

  motivo = '';

  observacion = '';

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private cuentaService:
      CuentaFinancieraService,

    private movimientoService:
      MovimientoFinancieroService,

    private parametros:
      ParametrosService,

    private alertCtrl:
      AlertController,

    public modalCtrl:
      ModalController

  ){}

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit(): void {

    this.CargarCuentas();
  }

  /* =====================================
  🔥 CARGAR CUENTAS
  ====================================== */

  CargarCuentas(): void {

    this.cuentaService
    .getByEmpresa(

      this.parametros
      .GetIdEmpresa()

    )
    .subscribe({

      next:(resp:any[])=>{

        this.cuentas =
          resp;

        console.log(
          'CUENTAS:',
          resp
        );
      },

      error:(err)=>{

        console.error(err);
      }
    });
  }

  /* =====================================
  🔥 ALERTA
  ====================================== */

  async MostrarAlerta(

    titulo:string,

    mensaje:string

  ): Promise<void> {

    const alert =

      await this.alertCtrl
      .create({

        header:
          titulo,

        message:
          mensaje,

        buttons:['OK']
      });

    await alert.present();
  }

  /* =====================================
  🔥 VALIDAR
  ====================================== */

  Validar(): boolean {

    if(!this.cuentaOrigen){

      this.MostrarAlerta(

        'Cuenta origen',

        'Debes seleccionar una cuenta origen'
      );

      return false;
    }

    if(!this.cuentaDestino){

      this.MostrarAlerta(

        'Cuenta destino',

        'Debes seleccionar una cuenta destino'
      );

      return false;
    }

    if(

      this.cuentaOrigen
      ===
      this.cuentaDestino
    ){

      this.MostrarAlerta(

        'Transferencia',

        'No puedes transferir a la misma cuenta'
      );

      return false;
    }

    if(this.monto <= 0){

      this.MostrarAlerta(

        'Monto',

        'Debes indicar un monto válido'
      );

      return false;
    }

    if(!this.motivo){

      this.MostrarAlerta(

        'Motivo',

        'Debes indicar un motivo'
      );

      return false;
    }

    return true;
  }

  /* =====================================
  🔥 GUARDAR
  ====================================== */

  guardar(): void {

    if(!this.Validar()){

      return;
    }

    this.guardando = true;

    const payload = {

      idEmpresa:
        this.parametros
        .GetIdEmpresa(),

      idUsuario:
        this.parametros
        .IdUsuario,

      idCuentaOrigen:
        this.cuentaOrigen,

      idCuentaDestino:
        this.cuentaDestino,

      monto:
        this.monto,

      motivo:
        this.motivo,

      observacion:
        this.observacion
    };

    console.log(
      'TRANSFERENCIA:',
      payload
    );

    this.movimientoService
    .registrarTransferencia(
      payload
    )
    .subscribe({

      next:(resp)=>{

        console.log(
          'OK:',
          resp
        );

        this.guardando = false;

        this.onGuardar.emit(
          payload
        );

        this.modalCtrl.dismiss(
          payload
        );
      },

      error:(err)=>{

        console.error(err);

        this.guardando = false;

        this.MostrarAlerta(

          'Error',

          'No se pudo registrar la transferencia'
        );
      }
    });
  }

  /* =====================================
  🔥 GET CUENTA
  ====================================== */

  GetCuenta(
    id:number
  ): any {

    return this.cuentas
    .find(

      x =>

        x.idCuentaFinanciera
        ===
        id
    );
  }

  /* =====================================
  🔥 CERRAR
  ====================================== */

  cerrar(): void {

    this.modalCtrl.dismiss();
  }
}