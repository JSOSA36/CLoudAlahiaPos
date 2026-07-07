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
  MetodoPagoCuentaService
} from 'src/app/servicios/metodo-pago-cuenta.service';

import {
  CuentaFinancieraService
} from 'src/app/servicios/cuenta-financiera.service';

import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-modal-metodo-pago-cuenta',

  templateUrl:
    './modal-metodo-pago-cuenta.component.html',

  styleUrls:
    ['./modal-metodo-pago-cuenta.component.scss'],
})
export class ModalMetodoPagoCuentaComponent
implements OnInit {

  /* =====================================
  🔥 INPUT
  ====================================== */

  @Input()
  metodo:any = null;

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

  cuentas:any[] = [];

  model:any = {

    idMetodoPagoCuenta:0,

    idEmpresa:0,

    metodoPago:'EFECTIVO',

    idCuentaFinanciera:null,

    activo:true
  };

  /* =====================================
  🔥 MÉTODOS DISPONIBLES
  ====================================== */

  metodosDisponibles = [

    {
      nombre:'EFECTIVO',

      icono:'cash-outline',

      color:'#22c55e'
    },

    {
      nombre:'TARJETA',

      icono:'card-outline',

      color:'#2563eb'
    },

    {
      nombre:'POPULAR',

      icono:'business-outline',

      color:'#7c3aed'
    },

    {
      nombre:'BHD',

      icono:'business-outline',

      color:'#f97316'
    },

    {
      nombre:'RESERVAS',

      icono:'business-outline',

      color:'#059669'
    }
  ];

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private metodoService:
      MetodoPagoCuentaService,

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

    this.model.idEmpresa =

      this.parametros
      .GetIdEmpresa();

    if(this.metodo){

      this.isEdit = true;

      this.model = {

        ...this.metodo
      };
    }

    this.CargarCuentas();
  }

  /* =====================================
  🔥 CUENTAS
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

    if(!this.model.metodoPago){

      this.MostrarAlerta(

        'Método',

        'Debes seleccionar un método'
      );

      return false;
    }

    if(!this.model.idCuentaFinanciera){

      this.MostrarAlerta(

        'Cuenta',

        'Debes seleccionar una cuenta financiera'
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
      'METODO:',
      this.model
    );

    /* =====================================
    🔥 UPDATE
    ====================================== */

    if(this.isEdit){

      this.metodoService
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

            'No se pudo actualizar'
          );
        }
      });

      return;
    }

    /* =====================================
    🔥 CREATE
    ====================================== */

    this.metodoService
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

          'No se pudo guardar'
        );
      }
    });
  }

  /* =====================================
  🔥 ICONO
  ====================================== */

  GetMetodo(): any {

    return this.metodosDisponibles
    .find(

      x =>

        x.nombre
        ===
        this.model.metodoPago
    );
  }

  /* =====================================
  🔥 CLOSE
  ====================================== */

  cerrar(): void {

    this.modalCtrl.dismiss();
  }
  GetCuentaSeleccionada(): any {

  return this.cuentas.find(

    (x:any)=>

      x.idCuentaFinanciera
      ===
      this.model.idCuentaFinanciera
  );
}
}