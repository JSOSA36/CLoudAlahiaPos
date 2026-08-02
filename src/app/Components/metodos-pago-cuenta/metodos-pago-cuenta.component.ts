import {
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';

import {
  ModalController
} from '@ionic/angular';

import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

import {
  MetodoPagoCuentaService
} from 'src/app/servicios/metodo-pago-cuenta.service';

import {
  CuentaFinancieraService
} from 'src/app/servicios/cuenta-financiera.service';

@Component({
  selector: 'app-metodos-pago-cuenta',

  templateUrl:
    './metodos-pago-cuenta.component.html',

  styleUrls:
    ['./metodos-pago-cuenta.component.scss'],
})
export class MetodosPagoCuentaComponent
implements OnInit {

  /* =====================================
  🔥 OUTPUT
  ====================================== */

  @Output()
  onClose =
    new EventEmitter<void>();

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  cargando = false;

  metodos:any[] = [];

  cuentas:any[] = [];

  /* =====================================
  🔥 MÉTODOS
  ====================================== */

  metodosDisponibles = [

  /* =====================================
  🔥 CLÁSICOS
  ====================================== */

  {
    nombre:'EFECTIVO',
    icono:'cash-outline',
    color:'#16a34a'
  },

  {
    nombre:'TARJETA',
    icono:'card-outline',
    color:'#2563eb'
  },

  /* =====================================
  🔥 BANCOS
  ====================================== */

  {
    nombre:'POPULAR',
    icono:'business-outline',
    color:'#dc2626'
  },
{
  nombre:'BILLET BHD',
  icono:'phone-portrait-outline',
   color:'#059669'
},
  {
    nombre:'BHD',
    icono:'wallet-outline',
    color:'#f59e0b'
  },

  {
    nombre:'BANRESERVAS',
    icono:'business-outline',
    color:'#059669'
  },

  {
    nombre:'APAP',
    icono:'business-outline',
    color:'#7c3aed'
  },

  {
    nombre:'SCOTIABANK',
    icono:'business-outline',
    color:'#ef4444'
  },

  {
    nombre:'SANTA CRUZ',
    icono:'business-outline',
    color:'#0ea5e9'
  },

  {
    nombre:'ASOCIACION POPULAR',
    icono:'business-outline',
    color:'#2563eb'
  },

  {
    nombre:'ASOCIACION CIBAO',
    icono:'business-outline',
    color:'#f97316'
  },

  {
    nombre:'LA NACIONAL',
    icono:'business-outline',
    color:'#14b8a6'
  },

  /* =====================================
  🔥 DIGITALES
  ====================================== */

  {
    nombre:'QIK',
    icono:'phone-portrait-outline',
    color:'#22c55e'
  },

  {
    nombre:'PAYPAL',
    icono:'logo-paypal',
    color:'#2563eb'
  },

  {
    nombre:'ZELLE',
    icono:'swap-horizontal-outline',
    color:'#7c3aed'
  },

  /* =====================================
  🔥 DELIVERY
  ====================================== */

  {
    nombre:'PEDIDOSYA',
    icono:'bicycle-outline',
    color:'#ef4444'
  },

  {
    nombre:'UBEREATS',
    icono:'car-outline',
    color:'#16a34a'
  },

  {
    nombre:'HUGO',
    icono:'fast-food-outline',
    color:'#f97316'
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

    public modalCtrl:
      ModalController

  ){}

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit(): void {

    console.log(
      'INIT METODOS PAGO CUENTA'
    );
    this.CargarTodo();
  }

  /* =====================================
  🔥 CARGAR TODO
  ====================================== */

  CargarTodo(): void {

    this.cargando = true;

    this.cuentaService
    .getByEmpresa(

      this.parametros
      .GetIdEmpresa()

    )
    .subscribe({

      next:(cuentasResp:any[])=>{

        this.cuentas =
          cuentasResp || [];

        this.metodoService
        .getByEmpresa(

          this.parametros
          .GetIdEmpresa()

        )
        .subscribe({

          next:(metodosResp:any[])=>{

            this.metodos =
              metodosResp || [];

            this.GenerarMetodosFaltantes();

            this.cargando = false;

            console.log(
              'METODOS:',
              this.metodos
            );

            console.log(
              'CUENTAS:',
              this.cuentas
            );
          },

          error:(err)=>{

            console.error(err);

            this.cargando = false;
          }
        });
      },

      error:(err)=>{

        console.error(err);

        this.cargando = false;
      }
    });
  }

  /* =====================================
  🔥 GENERAR FALTANTES
  ====================================== */

  GenerarMetodosFaltantes(): void {

    this.metodosDisponibles
    .forEach(metodo=>{

      const existe =

        this.metodos
        .some(

          (x:any)=>

            x.metodoPago
            ===
            metodo.nombre
        );

      if(!existe){

        this.metodos.push({

          idMetodoPagoCuenta:0,

          metodoPago:
            metodo.nombre,

          idCuentaFinanciera:null,

          activo:true
        });
      }
    });
  }

  /* =====================================
  🔥 GUARDAR
  ====================================== */

  Guardar(
    item:any
  ): void {

    if(!item.idCuentaFinanciera){

      return;
    }

    const payload = {

      idMetodoPagoCuenta:
        item.idMetodoPagoCuenta || 0,

      idEmpresa:
        this.parametros
        .GetIdEmpresa(),

      metodoPago:
        item.metodoPago,

      idCuentaFinanciera:
        item.idCuentaFinanciera,

      activo:
        item.activo
    };

    console.log(
      'PAYLOAD:',
      payload
    );

    /* =====================================
    🔥 CREATE
    ====================================== */

    if(
      !item.idMetodoPagoCuenta
    ){

      this.metodoService
      .create(payload)
      .subscribe({

        next:(resp)=>{

          console.log(
            'CREADO:',
            resp
          );

          this.CargarTodo();
        },

        error:(err)=>{

          console.error(err);
        }
      });

      return;
    }

    /* =====================================
    🔥 UPDATE
    ====================================== */

    this.metodoService
    .update(payload)
    .subscribe({

      next:(resp)=>{

        console.log(
          'ACTUALIZADO:',
          resp
        );
      },

      error:(err)=>{

        console.error(err);
      }
    });
  }

  /* =====================================
  🔥 GET CUENTA
  ====================================== */

  GetNombreCuenta(
    idCuenta:number | null | undefined
  ): string {

    if(!idCuenta){

      return '';
    }

    const cuenta =

      this.cuentas
      .find(

        (x:any)=>

          x.idCuentaFinanciera
          ===
          idCuenta
      );

    return cuenta?.nombre || '';
  }

  /* =====================================
  🔥 GET MÉTODO
  ====================================== */

  GetMetodo(
    nombre:string
  ): any {

    return this.metodosDisponibles
    .find(

      x =>

        x.nombre
        ===
        nombre

    ) || {

      nombre,

      icono:'card-outline',

      color:'#64748b'
    };
  }

  /* =====================================
  🔥 CLOSE
  ====================================== */

  cerrar(): void {

    this.modalCtrl.dismiss();

    this.onClose.emit();
  }
}