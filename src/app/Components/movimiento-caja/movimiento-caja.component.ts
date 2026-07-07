import {

  Component,

  EventEmitter,

  Output,

  Input,

  OnInit

} from '@angular/core';

import {

  AlertController,

  ModalController

} from '@ionic/angular';

import {

  ParametrosService

} from 'src/app/servicios/parametros.service';

import {

  CajaMovimientoService

} from 'src/app/servicios/caja-movimiento.service';

import {

  CajaAperturaService

} from 'src/app/servicios/caja-apertura.service';

@Component({

  selector:'app-movimiento-caja',

  templateUrl:
    './movimiento-caja.component.html',

  styleUrls:
    ['./movimiento-caja.component.scss']
})
export class MovimientoCajaComponent
implements OnInit {

  /* =====================================
  🔥 INPUT
  ====================================== */

  @Input()
  tipo:'ENTRADA' | 'SALIDA'
    = 'SALIDA';

  /* =====================================
  🔥 OUTPUT
  ====================================== */

  @Output()
  onGuardar =
    new EventEmitter<any>();

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  monto = 0;

  motivo = '';

  observacion = '';

  cargando = false;

  validandoCaja = true;

  cajaAbierta:any = null;

  balanceCaja = 0;

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private movimientoService:
      CajaMovimientoService,

    private cajaAperturaService:
      CajaAperturaService,

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

  ngOnInit(){

    this.ValidarCaja();
  }

  /* =====================================
  🔥 VALIDAR CAJA
  ====================================== */

  ValidarCaja(){

    this.validandoCaja = true;

    this.cajaAperturaService
    .getCajaAbierta(

      this.parametros
      .GetIdEmpresa(),

      this.parametros
      .IdUsuario

    )
    .subscribe({

      next:(resp:any)=>{

        console.log(
          'CAJA ABIERTA:',
          resp
        );

        /* =====================================
        🔥 NO EXISTE
        ====================================== */

        if(

          !resp

          ||

          resp.estado !==
          'ABIERTA'

        ){

          this.cajaAbierta = null;

          this.validandoCaja = false;

          return;
        }

        /* =====================================
        🔥 SET
        ====================================== */

        this.cajaAbierta =
          resp;

        /* =====================================
        🔥 BALANCE
        ====================================== */

        this.balanceCaja =

          Number(
            resp.montoInicial || 0
          );

        this.validandoCaja = false;
      },

      error:(err)=>{

        console.error(err);

        this.validandoCaja = false;
      }
    });
  }

  /* =====================================
  🔥 ALERTA
  ====================================== */

  async MostrarAlerta(

    titulo:string,

    mensaje:string

  ){

    const alert =

      await this.alertCtrl
      .create({

        header:
          titulo,

        message:
          mensaje,

        cssClass:
          'alerta-caja',

        buttons:[

          {
            text:'OK'
          }
        ]
      });

    await alert.present();

    await alert.onDidDismiss();
  }

  /* =====================================
  🔥 VALIDAR FORM
  ====================================== */

  validarFormulario(): boolean {

    /* =====================================
    🔥 CAJA
    ====================================== */

    if(!this.cajaAbierta){

      this.MostrarAlerta(

        'Caja',

        'No existe una caja abierta'
      );

      return false;
    }

    /* =====================================
    🔥 MONTO
    ====================================== */

    if(

      !this.monto

      ||

      this.monto <= 0

    ){

      this.MostrarAlerta(

        'Monto',

        'Debes indicar un monto válido'
      );

      return false;
    }

    /* =====================================
    🔥 MOTIVO
    ====================================== */

    if(

      !this.motivo

      ||

      this.motivo.trim() === ''

    ){

      this.MostrarAlerta(

        'Motivo',

        'Debes indicar un motivo'
      );

      return false;
    }

    /* =====================================
    🔥 VALIDAR FONDOS
    ====================================== */

    if(

      this.tipo === 'SALIDA'

      &&

      this.monto > this.balanceCaja

    ){

      this.MostrarAlerta(

        'Fondos insuficientes',

        'La caja no posee balance suficiente'
      );

      return false;
    }

    return true;
  }

  /* =====================================
  🔥 GUARDAR
  ====================================== */

  guardarMovimiento(){

    /* =====================================
    🔥 VALIDAR
    ====================================== */

    const valido =

      this.validarFormulario();

    if(!valido){

      return;
    }

    this.cargando = true;

    /* =====================================
    🔥 PAYLOAD
    ====================================== */

    const payload = {

      idCajaApertura:
        this.cajaAbierta
        .idCajaApertura,

      idEmpresa:
        this.parametros
        .GetIdEmpresa(),

      idUsuario:
        this.parametros
        .IdUsuario,

      tipo:
        this.tipo,

      monto:
        Number(this.monto),

      motivo:
        this.motivo,

      observacion:
        this.observacion
    };

    console.log(
      'MOVIMIENTO:',
      payload
    );

    /* =====================================
    🔥 REQUEST
    ====================================== */

    const request =

      this.tipo === 'ENTRADA'

      ?

      this.movimientoService
      .registrarEntrada(payload)

      :

      this.movimientoService
      .registrarSalida(payload);

    request.subscribe({

      next: async (resp)=>{

        console.log(
          'MOVIMIENTO OK:',
          resp
        );

        this.cargando = false;

        /* =====================================
        🔥 ALERTA
        ====================================== */

        await this.MostrarAlerta(

          'Movimiento registrado',

          this.tipo === 'ENTRADA'

          ?

          'La entrada fue registrada correctamente'

          :

          'La salida fue registrada correctamente'
        );

        /* =====================================
        🔥 EMIT
        ====================================== */

        this.onGuardar.emit(
          resp
        );

        /* =====================================
        🔥 CLOSE
        ====================================== */

        this.modalCtrl.dismiss(
          resp
        );
      },

      error: async (err)=>{

        console.error(err);

        this.cargando = false;

        await this.MostrarAlerta(

          'Error',

          'No se pudo registrar el movimiento'
        );
      }
    });
  }
}