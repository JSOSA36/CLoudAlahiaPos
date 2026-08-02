import {
  Component,
  OnInit
} from '@angular/core';

import {
  ModalController,
  AlertController
} from '@ionic/angular';

import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

import {
  CuentaFinancieraService
} from 'src/app/servicios/cuenta-financiera.service';

import {
  ModalCuentaFinancieraComponent
} from '../modal-cuenta-financiera/modal-cuenta-financiera.component';

@Component({
  selector: 'app-cuentas-financieras',

  templateUrl:
    './cuentas-financieras.component.html',

  styleUrls:
    ['./cuentas-financieras.component.scss'],
})
export class CuentasFinancierasComponent
implements OnInit {

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  cargando = false;

  cuentas:any[] = [];

  cuentasFiltradas:any[] = [];

  search = '';

  totalGeneral = 0;

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private cuentaService:
      CuentaFinancieraService,

    private parametros:
      ParametrosService,

    private modalCtrl:
      ModalController,

    private alertCtrl:
      AlertController

  ){}

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit(): void {

    this.CargarCuentas();
  }

  /* =====================================
  🔥 CARGAR
  ====================================== */

  CargarCuentas(): void {

    this.cargando = true;

    this.cuentaService
    .getByEmpresa(

      this.parametros
      .GetIdEmpresa()

    )
    .subscribe({

      next:(resp:any[])=>{

        console.log(
          'CUENTAS:',
          resp
        );

        this.cuentas =
          resp;

        this.cuentasFiltradas =
          resp;

        this.cargando = false;

        this.CalcularBalances();
      },

      error:(err)=>{

        console.error(err);

        this.cargando = false;
      }
    });
  }

  /* =====================================
  🔥 CALCULAR BALANCES
  ====================================== */

  async CalcularBalances(){

    this.totalGeneral = 0;

    for(const cuenta of this.cuentas){

      this.cuentaService
      .getBalance(

        cuenta.idCuentaFinanciera

      )
      .subscribe({

        next:(balance:number)=>{

          cuenta.balanceActual =
            balance;

          this.totalGeneral +=
            balance;
        },

        error:(err)=>{

          console.error(err);
        }
      });
    }
  }

  /* =====================================
  🔥 FILTRAR
  ====================================== */

  Filtrar(): void {

    const texto =

      this.search
      .toLowerCase()
      .trim();

    if(!texto){

      this.cuentasFiltradas =
        this.cuentas;

      return;
    }

    this.cuentasFiltradas =

      this.cuentas.filter(x =>

        x.nombre
        ?.toLowerCase()
        .includes(texto)

        ||

        x.tipoCuenta
        ?.toLowerCase()
        .includes(texto)

        ||

        x.banco
        ?.toLowerCase()
        .includes(texto)
      );
  }

  /* =====================================
  🔥 NUEVA CUENTA
  ====================================== */

  async NuevaCuenta(){

    const modal =

      await this.modalCtrl
      .create({

        component:
          ModalCuentaFinancieraComponent,

        cssClass:
          'modal-900'
      });

    modal.onDidDismiss()
    .then((resp)=>{

      if(resp.data){

        this.CargarCuentas();
      }
    });

    await modal.present();
  }

  /* =====================================
  🔥 EDITAR
  ====================================== */

  async EditarCuenta(
    cuenta:any
  ){

    const modal =

      await this.modalCtrl
      .create({

        component:
          ModalCuentaFinancieraComponent,

        componentProps:{

          cuenta
        },

        cssClass:
          'modal-900'
      });

    modal.onDidDismiss()
    .then((resp)=>{

      if(resp.data){

        this.CargarCuentas();
      }
    });

    await modal.present();
  }

  /* =====================================
  🔥 ELIMINAR
  ====================================== */

  async EliminarCuenta(
    cuenta:any
  ){

    const alert =

      await this.alertCtrl
      .create({

        header:
          'Eliminar Cuenta',

        message:

          `¿Eliminar ${cuenta.nombre}?`,

        buttons:[

          {
            text:'Cancelar',

            role:'cancel'
          },

          {
            text:'Eliminar',

            role:'confirm',

            handler:()=>{

              this.cuentaService
              .delete(

                cuenta.idCuentaFinanciera

              )
              .subscribe({

                next:()=>{

                  this.CargarCuentas();
                },

                error:(err)=>{

                  console.error(err);
                }
              });
            }
          }
        ]
      });

    await alert.present();
  }

  /* =====================================
  🔥 SINCRONIZAR SALDOS
  ====================================== */

  SincronizarSaldos(): void {
    this.cargando = true;
    this.cuentaService
      .sincronizarSaldos(this.parametros.GetIdEmpresa())
      .subscribe({
        next: async (resp) => {
          this.cargando = false;
          const alert = await this.alertCtrl.create({
            header: 'Saldos',
            message: `Cuentas actualizadas: ${resp?.cuentasActualizadas ?? 0}`,
            buttons: ['OK']
          });
          await alert.present();
          this.CargarCuentas();
        },
        error: async (err) => {
          console.error(err);
          this.cargando = false;
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: err?.error?.message || 'No se pudieron sincronizar los saldos',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
  }

  /* =====================================
  🔥 COLOR TIPO
  ====================================== */

  GetColorTipo(
    tipo:string
  ): string {

    switch(tipo){

      case 'CAJA':
        return '#22c55e';

      case 'BANCO':
        return '#2563eb';

      case 'TARJETA':
        return '#a855f7';

      default:
        return '#64748b';
    }
  }
}