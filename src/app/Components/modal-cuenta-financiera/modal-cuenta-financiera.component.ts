import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import {
  AlertController,
  ModalController
} from '@ionic/angular';

import {
  CuentaFinancieraService
} from 'src/app/servicios/cuenta-financiera.service';

import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-modal-cuenta-financiera',

  templateUrl:
    './modal-cuenta-financiera.component.html',

  styleUrls:
    ['./modal-cuenta-financiera.component.scss'],
})
export class ModalCuentaFinancieraComponent
implements OnInit {

  /* =====================================
  🔥 INPUT
  ====================================== */

  @Input()
  cuenta:any = null;

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

  isEdit = false;

  model:any = {

    idCuentaFinanciera:0,

    idEmpresa:0,

    nombre:'',

    tipoCuenta:'CAJA',

    banco:'',

    numeroCuenta:'',

    balanceInicial:0,

    color:'#2563eb',

    icono:'wallet-outline',

    activa:true
  };

  /* =====================================
  🔥 TIPOS
  ====================================== */

  tiposCuenta = [

    {
      nombre:'CAJA',

      icono:'cash-outline'
    },

    {
      nombre:'BANCO',

      icono:'business-outline'
    },

    {
      nombre:'TARJETA',

      icono:'card-outline'
    }
  ];

  /* =====================================
  🔥 ICONOS
  ====================================== */

  iconos = [

    'wallet-outline',

    'cash-outline',

    'business-outline',

    'card-outline',

    'cash',

    'card',

    'storefront-outline'
  ];

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private cuentaService:
      CuentaFinancieraService,

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

    if(this.cuenta){

      this.isEdit = true;

      this.model = {

        ...this.cuenta
      };
    }

    this.model.idEmpresa =

      this.parametros
      .GetIdEmpresa();
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

    if(!this.model.nombre){

      this.MostrarAlerta(

        'Nombre',

        'Debes indicar un nombre'
      );

      return false;
    }

    if(!this.model.tipoCuenta){

      this.MostrarAlerta(

        'Tipo',

        'Debes seleccionar un tipo de cuenta'
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

    console.log(
      'CUENTA:',
      this.model
    );

    /* =====================================
    🔥 UPDATE
    ====================================== */

    if(this.isEdit){

      this.cuentaService
      .update(this.model)
      .subscribe({

        next:(resp)=>{

          console.log(
            'ACTUALIZADO:',
            resp
          );

          this.guardando = false;

          this.onGuardar.emit(
            this.model
          );

          this.modalCtrl.dismiss(
            this.model
          );
        },

        error:(err)=>{

          console.error(err);

          this.guardando = false;

          this.MostrarAlerta(

            'Error',

            'No se pudo actualizar la cuenta'
          );
        }
      });

      return;
    }

    /* =====================================
    🔥 CREATE
    ====================================== */

    this.cuentaService
    .create(this.model)
    .subscribe({

      next:(resp)=>{

        console.log(
          'CREADO:',
          resp
        );

        this.guardando = false;

        this.onGuardar.emit(
          resp
        );

        this.modalCtrl.dismiss(
          resp
        );
      },

      error:(err)=>{

        console.error(err);

        this.guardando = false;

        this.MostrarAlerta(

          'Error',

          'No se pudo crear la cuenta'
        );
      }
    });
  }

  /* =====================================
  🔥 CLOSE
  ====================================== */

  cerrar(): void {

    this.modalCtrl.dismiss();
  }
}