import {
  Component,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';


import {PrintService} from 'src/app/servicios/print.services';

import {
  AlertController,
  ToastController
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
import { ParametroConfigService } from 'src/app/servicios/parametrosconfig.service';
import { ArsAseguradoraService } from 'src/app/servicios/ars-aseguradora.service';
import { ArsDesgloseCaja } from 'src/app/models/ars-aseguradora';
import { firstValueFrom } from 'rxjs';

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
  desgloseArs: ArsDesgloseCaja[] = [];

  cajaAbierta:any = null;
  totalDescuento = 0;
  validandoCaja = true;

  cajaRecienCerrada = false;

  ultimoCierreId = 0;

  ultimoCierreFecha: string | null = null;

  reimprimiendoCierre = false;

  entradasEfectivo = 0;

  salidasEfectivo = 0;

  observacion = '';

  motivoDiferencia = '';

  totalGastosCaja = 0;

  /** Si true, pide billetes/monedas. Si false, cierre simplificado (Sena). */
  controlPorDenominacion = true;

  /** Monto contado cuando el cierre NO usa denominaciones. */
  efectivoContadoIngresado = 0;

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

    private toastCtrl:
      ToastController,

      private printService:
    PrintService,

    private cajaCierreService:
      CajaCierreService,

    private cajaAperturaService:
      CajaAperturaService,
      private _facturaHeaderService:
      FacturaHeaderService,
    private parametroConfig: ParametroConfigService,
    private arsService: ArsAseguradoraService

  ){}

  /* =====================================
  🔥 INIT
  ====================================== */

  ngOnInit(){

    void this.cargarControlEfectivo().then(() => this.ValidarCajaAbierta());
  }

  /** Lee ControlEfectivoPorDenominacion (false = sin grilla de billetes). */
  private async cargarControlEfectivo(): Promise<void> {
    const idEmpresa = this.parametrosService.GetIdEmpresa();
    if (!idEmpresa) {
      this.controlPorDenominacion = true;
      return;
    }
    try {
      const params = await firstValueFrom(
        this.parametroConfig.getParametrosEmpresa(idEmpresa)
      );
      const row = (params || []).find(
        (x: any) =>
          String(x.clave || x.Clave || '')
            .trim()
            .toLowerCase() === 'controlefectivopordenominacion'
      ) as any;
      const valor = String(row?.valor ?? row?.Valor ?? 'true')
        .trim()
        .toLowerCase();
      this.controlPorDenominacion = valor === 'true' || valor === '1';
    } catch {
      this.controlPorDenominacion = true;
    }
  }

  private sincronizarContadoSimplificado(): void {
    if (this.controlPorDenominacion) return;
    this.efectivoContadoIngresado = this.efectivoEsperadoFisico;
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

          this.CargarUltimoCierre();

          return;
        }

        this.cajaAbierta = resp;

        this.CargarIngresos();
      },

      error:(err)=>{

        console.error(err);

        this.cajaAbierta = null;

        this.validandoCaja = false;

        this.CargarUltimoCierre();
      }
    });
  }

  private idCierreDeRespuesta(resp: any): number {
    return Number(
      resp?.idCajaCierre
      ?? resp?.IdCajaCierre
      ?? resp?.data?.idCajaCierre
      ?? resp?.data?.IdCajaCierre
      ?? 0
    ) || 0;
  }

  CargarUltimoCierre(): void {
    const idEmpresa = this.parametrosService.GetIdEmpresa();
    const idUsuario = this.parametrosService.IdUsuario;

    if (!idEmpresa || !idUsuario) {
      this.ultimoCierreId = 0;
      this.ultimoCierreFecha = null;
      return;
    }

    this.cajaCierreService
      .getUltimoCierre(idEmpresa, idUsuario)
      .subscribe({
        next: (resp: any) => {
          this.ultimoCierreId = this.idCierreDeRespuesta(resp);
          const fecha = resp?.fechaCierre ?? resp?.FechaCierre ?? null;
          this.ultimoCierreFecha = fecha ? String(fecha) : null;
        },
        error: () => {
          this.ultimoCierreId = 0;
          this.ultimoCierreFecha = null;
        }
      });
  }

  async reimprimirUltimoCierre(): Promise<void> {
    if (!this.ultimoCierreId || this.reimprimiendoCierre) {
      return;
    }

    this.reimprimiendoCierre = true;

    try {
      await firstValueFrom(
        this.printService.printCierre(this.ultimoCierreId)
      );

      const toast = await this.toastCtrl.create({
        message: 'Cierre enviado a la impresora.',
        duration: 2500,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch {
      const toast = await this.toastCtrl.create({
        message: 'No se pudo imprimir. Verifica el agente de impresión e inténtalo de nuevo.',
        duration: 4000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.reimprimiendoCierre = false;
    }
  }

  cerrarSesionTrasCierre(): void {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
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
        this.cargarDesgloseArs();

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

        this.sincronizarContadoSimplificado();
        this.validandoCaja = false;
      },

      error: (err: any) => {

        console.error(err);

        this.ingresos = [];

        this.totalDescuento = 0;

        this.entradasEfectivo = 0;

        this.salidasEfectivo = 0;

        this.sincronizarContadoSimplificado();
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

get totalArsCierre(): number {
  return (this.desgloseArs || []).reduce((s, x) => s + Number(x.total || 0), 0);
}

private cargarDesgloseArs(): void {
  const idEmpresa = this.parametrosService.GetIdEmpresa();
  const idUsuario = this.parametrosService.IdUsuario;
  if (!idEmpresa || !idUsuario) {
    this.desgloseArs = [];
    return;
  }
  this.arsService.desgloseCaja(idEmpresa, idUsuario).subscribe({
    next: (rows) => this.desgloseArs = rows || [],
    error: () => this.desgloseArs = []
  });
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

  /** El cajero no puede contar efectivo negativo. */
  get efectivoEsperadoFisico(): number {
    return Math.max(0, Number(this.efectivoEsperado.toFixed(2)));
  }

  get gastosExcedenEfectivo(): boolean {
    return Number(this.efectivoEsperado.toFixed(2)) < 0;
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

    if (!this.controlPorDenominacion) {
      return Math.round((Number(this.efectivoContadoIngresado) || 0) * 100) / 100;
    }

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

      - this.efectivoEsperadoFisico
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

  const observacionOk =

    !this.gastosExcedenEfectivo

    || (this.observacion || '').trim().length >= 8;

  return (

    tieneTotales

    &&

    hayConteo

    &&

    cajaCuadrada

    &&

    observacionOk
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

    if (this.gastosExcedenEfectivo && (this.observacion || '').trim().length < 8) {
      await this.MostrarAlerta(
        'Observación requerida',
        'Los gastos de caja superan el efectivo disponible. Escribe una observación para poder cerrar.'
      );
      return;
    }

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
        this.idCierreDeRespuesta(resp);

      console.log(
        'CIERRE OK:',
        resp
      );

      if(idCajaCierre){

        this.ultimoCierreId = idCajaCierre;
        this.ultimoCierreFecha = new Date().toISOString();

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

      this.cajaAbierta = null;
      this.cajaRecienCerrada = true;

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