import {
  Component,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';


import {PrintService} from 'src/app/servicios/print.services';

import {
  AlertController
} from '@ionic/angular';

import {
  IngresosService
} from 'src/app/servicios/ingresos.service';

import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import {
  ParametrosService
} from 'src/app/servicios/parametros.service';

import {
  CajaCierreService
} from 'src/app/servicios/caja-cierre.service';

import {
  CajaAperturaService
} from 'src/app/servicios/caja-apertura.service';

type Denominacion = {

  valor:number;

  cantidad:number;
};

@Component({

  selector:'app-cierre-caja',

  templateUrl:
    './cierre-caja.component.html',

  styleUrls:
    ['./cierre-caja.component.scss']
})
export class CierreCajaComponent
implements OnInit {

  /* =====================================
  🔥 VARIABLES
  ====================================== */

  ingresos:any[] = [];

  cajaAbierta:any = null;
  totalDescuento = 0;
  validandoCaja = true;

  entradasEfectivo = 0;

  salidasEfectivo = 0;

  observacion = '';

  motivoDiferencia = '';

  totalGastosCaja = 0;

  /* =====================================
  🔥 OUTPUT
  ====================================== */

  @Output()
  onCerrarCaja =
    new EventEmitter<any>();

  /* =====================================
  🔥 CONSTRUCTOR
  ====================================== */

  constructor(

    private ingresosService:
      IngresosService,

    private parametrosService:
      ParametrosService,

    private alertCtrl:
      AlertController,
      private printService:
    PrintService,

    private cajaCierreService:
      CajaCierreService,

    private cajaAperturaService:
      CajaAperturaService,
      private _facturaHeaderService:
      FacturaHeaderService

  ){}

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit(){

    this.ValidarCajaAbierta();
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
          'alerta-cierre-caja',

        buttons:[

          {
            text:'OK',

            role:'confirm'
          }
        ]
      });

    await alert.present();

    await alert.onDidDismiss();
  }

  /* =====================================
  🔥 VALIDAR CAJA
  ====================================== */

  ValidarCajaAbierta(){

    this.validandoCaja = true;

    this.cajaAperturaService
    .getCajaAbierta(

      this.parametrosService
      .GetIdEmpresa(),

      this.parametrosService
      .IdUsuario

    )
    .subscribe({

      next:(resp:any)=>{

        console.log(
          'CAJA ABIERTA:',
          resp
        );

        if(!resp){

          this.cajaAbierta = null;

          this.validandoCaja = false;

          return;
        }

        this.cajaAbierta = resp;

        this.CargarIngresos();
      },

      error:(err)=>{

        console.error(err);

        this.cajaAbierta = null;

        this.validandoCaja = false;
      }
    });
  }

  /* =====================================
  🔥 CARGAR INGRESOS
  ====================================== */

  /* =====================================
🔥 CARGAR INGRESOS
====================================== */

/* =====================================
🔥 CARGAR INGRESOS
====================================== */
CargarIngresos(): void {

  this._facturaHeaderService
    .GetIngresosCajaActual(

      this.parametrosService.GetIdEmpresa(),

      this.parametrosService.IdUsuario

    )
    .subscribe({

      next: (res: any) => {

        console.log(
          'CIERRE CAJA:',
          res
        );

        this.ingresos = res || [];

        // =====================================
        // 🔥 DESCUENTOS
        // =====================================

        this.totalDescuento =

          this.ingresos.length > 0

            ? Number(
                this.ingresos[0].totalDescuento || 0
              )

            : 0;

        // =====================================
        // 🔥 INGRESOS EXTRAORDINARIOS
        // =====================================

        this.entradasEfectivo =

          this.ingresos.length > 0

            ? Number(
                this.ingresos[0].totalIngresosExtra || 0
              )

            : 0;

        // =====================================
        // 🔥 GASTOS DE CAJA
        // =====================================

        this.salidasEfectivo =

          this.ingresos.length > 0

            ? Number(
                this.ingresos[0].totalGastos || 0
              )

            : 0;

        console.log(
          'TOTAL INGRESOS EXTRA:',
          this.entradasEfectivo
        );

        console.log(
          'TOTAL GASTOS:',
          this.salidasEfectivo
        );

        this.validandoCaja = false;
      },

      error: (err: any) => {

        console.error(err);

        this.ingresos = [];

        this.totalDescuento = 0;

        this.entradasEfectivo = 0;

        this.salidasEfectivo = 0;

        this.validandoCaja = false;
      }

    });

}
  /* =====================================
  🔥 AGRUPAR
  ====================================== */



  /* =====================================
  🔥 GET TOTAL METODO
  ====================================== */

/* =====================================
🔥 GET TOTAL METODO
====================================== */

getMetodoTotal(
  metodo:string
): number {

  return this.ingresos
    .filter(

      (x:any)=>

        String(
          x.formaPago || ''
        )
        .trim()
        .toUpperCase()

        ===

        metodo
        .trim()
        .toUpperCase()
    )
    .reduce(

      (acc:number, item:any)=>

        acc + Number(
          item.total || 0
        ),

      0
    );
}

  /* =====================================
  🔥 TOTALES
  ====================================== */

  get totalEfectivoSistema(): number {

    return this.getMetodoTotal('EFECTIVO')
  }
get ventasBrutas(): number {

  return this.totalGeneral + this.totalDescuento;

}

  /* =====================================
  🔥 MONEDAS
  ====================================== */

  monedas: Denominacion[] = [

    {
      valor:25,
      cantidad:0
    },

    {
      valor:10,
      cantidad:0
    },

    {
      valor:5,
      cantidad:0
    },

    {
      valor:1,
      cantidad:0
    }
  ];

  /* =====================================
  🔥 BILLETES
  ====================================== */

  billetes: Denominacion[] = [

    {
      valor:2000,
      cantidad:0
    },

    {
      valor:1000,
      cantidad:0
    },

    {
      valor:500,
      cantidad:0
    },

    {
      valor:200,
      cantidad:0
    },

    {
      valor:100,
      cantidad:0
    },

    {
      valor:50,
      cantidad:0
    }
  ];

  /* =====================================
  🔥 TOTAL GENERAL
  ====================================== */
get metodosPagoResumen(): any[] {

  return this.ingresos
    .filter(x => Number(x.total || 0) > 0);
}
 get totalGeneral(): number {

  return this.ingresos.reduce(

    (acc:number, item:any)=>

      acc + Number(item.total || 0),

    0
  );
}

  /* =====================================
  🔥 EFECTIVO ESPERADO
  ====================================== */

 get efectivoEsperado(): number {

  return (

    Number(this.cajaAbierta?.montoInicial || 0)

    + this.totalEfectivoSistema

    + this.entradasEfectivo

    - this.salidasEfectivo
  );
}

  /* =====================================
  🔥 TOTAL MONEDAS
  ====================================== */

  get totalMonedas(): number {

    return this.monedas.reduce(

      (acc,item)=>

        acc +
        (
          item.valor *
          item.cantidad
        ),

      0
    );
  }

  /* =====================================
  🔥 TOTAL BILLETES
  ====================================== */

  get totalBilletes(): number {

    return this.billetes.reduce(

      (acc,item)=>

        acc +
        (
          item.valor *
          item.cantidad
        ),

      0
    );
  }

  /* =====================================
  🔥 EFECTIVO CONTADO
  ====================================== */

  get efectivoContado(): number {

    return (

      this.totalMonedas

      + this.totalBilletes
    );
  }

  /* =====================================
  🔥 DIFERENCIA
  ====================================== */

  get diferencia(): number {

    return (

      this.efectivoContado

      - this.efectivoEsperado
    );
  }

  /* =====================================
  🔥 VALIDAR CIERRE
  ====================================== */

 get puedeCerrarCaja(): boolean {

  const tieneTotales =

    this.totalGeneral > 0;

  const hayConteo =

    this.efectivoContado >= 0;

  const cajaCuadrada =

    this.diferenciaPermitida;

  return (

    tieneTotales

    &&

    hayConteo

    &&

    cajaCuadrada
  );
}
getMetodoTotalTransferencia(): number {

  return this.ingresos

    .filter(x =>

      String(x.formaPago || '')
        .toUpperCase()
        .includes('TRANSFERENCIA')
    )

    .reduce(

      (acc: number, item: any) =>

        acc + Number(item.total || 0),

      0
    );
}
  /* =====================================
  🔥 CERRAR CAJA
  ====================================== */

async cerrarCaja(): Promise<void> {

  if(!this.puedeCerrarCaja){

    await this.MostrarAlerta(
      'Caja inválida',
      'La caja debe estar cuadrada para poder cerrarse'
    );

    return;
  }

  if(!this.cajaAbierta){

    await this.MostrarAlerta(
      'Caja no encontrada',
      'No existe una caja abierta'
    );

    return;
  }

const payload = {

  idCajaApertura:
    this.cajaAbierta.idCajaApertura,

  idEmpresa:
    this.parametrosService.GetIdEmpresa(),

  idUsuario:
    this.parametrosService.IdUsuario,

  // =====================================
  // RESUMEN
  // =====================================

  ventasBrutas:
    this.ventasBrutas,

  totalDescuento:
    this.totalDescuento,

  totalIngresosExtra:
    this.entradasEfectivo,

  totalGastos:
    this.salidasEfectivo,

  totalIngresosNetos:
    this.totalGeneral,

  debeHaber:
    this.efectivoEsperado,

  // =====================================
  // MÉTODOS
  // =====================================

  totalEfectivo:
    this.totalEfectivoSistema,

  totalTarjeta:
    this.getMetodoTotal('TARJETA'),

  totalTransferencia:
    this.getMetodoTotalTransferencia(),

  totalBillet:
    this.getMetodoTotal('BILLET'),

  totalCredito:
    this.getMetodoTotal('CRÉDITO'),

  totalGeneral:
    this.totalGeneral,

  // =====================================
  // CIERRE
  // =====================================

  montoRealCaja:
    this.efectivoContado,

  diferencia:
    this.diferencia,

  observacion:
    this.observacion
};

  this.cajaCierreService
  .procesarCierre(payload)
  .subscribe({

    next: async (resp:any)=>{

      const idCajaCierre =
        resp?.data?.idCajaCierre;

      console.log(
        'CIERRE OK:',
        resp
      );

      // =====================================
      // 🔥 INTENTAR IMPRIMIR
      // =====================================

      if(idCajaCierre){

        this.printService
        .printCierre(idCajaCierre)
        .subscribe({

          next:(r)=>{

            console.log(
              '🖨️ Cierre impreso',
              r
            );
          },

          error:(e)=>{

            console.warn(
              '⚠️ No se pudo imprimir',
              e
            );
          }
        });
      }

      // =====================================
      // 🔥 CONTINUAR SIEMPRE
      // =====================================

      localStorage.removeItem(
        'CAJA_ABIERTA'
      );

      localStorage.removeItem(
        'ID_CAJA_APERTURA'
      );

      localStorage.removeItem(
        'MONTO_INICIAL_CAJA'
      );

      this.onCerrarCaja.emit(
        payload
      );

      await this.MostrarAlerta(

  'Caja Cerrada',

  'La caja fue cerrada correctamente'
);

// =====================================
// 🔥 CERRAR SESIÓN
// =====================================

localStorage.clear();

sessionStorage.clear();

window.location.replace('/login');

      // window.location.href = '/login';
    },

    error: async (err)=>{

      console.error(
        'ERROR CIERRE:',
        err
      );

      await this.MostrarAlerta(

        'Error',

        'Ocurrió un error cerrando la caja'
      );
    }
  });
}
get diferenciaPermitida(): boolean {

  return (

    Math.abs(
      Number(
        this.diferencia
        .toFixed(2)
      )
    ) <= 5
  );
}
}