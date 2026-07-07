import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { RncCLienteDGIIService }
from '../../servicios/RncCLienteDGII.services';

import {
  BizcochoEncargo,
  PagoDTO
} from '../../models/BizcochoEncargo.models';
import { MetodoPagoCuentaService } from 'src/app/servicios/metodo-pago-cuenta.service';

@Component({
  selector: 'app-pago-encargo',
  templateUrl: './pago-encargo.component.html',
  styleUrls: ['./pago-encargo.component.scss'],
})
export class PagoEncargoComponent
implements OnInit {

  @Input() encargo!: BizcochoEncargo;

  esPagoFinal = false;

  form!: FormGroup;
metodosPago:any[] = [];
  cargando = false;
  abonoInicial = 0;

  // 🔥 ESTADO RNC
  estadoRnc = '';

  mensajeRnc = '';

  constructor(

    private fb: FormBuilder,

    private modal: ModalController,

    private rncService:
      RncCLienteDGIIService,
      private metodoPagoCuentaService: MetodoPagoCuentaService,
      private _Parametro: ParametrosService

  ) {
    this.CargarMetodosPago();
  }

  // =====================================================
  // 🔥 INIT
  // =====================================================
CargarMetodosPago(): void {

  this.metodoPagoCuentaService
  .getByEmpresa(

    this._Parametro
    .GetIdEmpresa()

  )
  .subscribe({

    next:(resp:any[])=>{

      this.metodosPago =

        (resp || [])
        .filter(

          x => x.activo
        );

      console.log(
        'METODOS:',
        this.metodosPago
      );
    },

    error:(err)=>{

      console.error(err);
    }
  });
}
  ngOnInit() {

    console.log(
      'Encargo recibido:',
      this.encargo
    );

    // =====================================================
    // 🔥 PENDIENTE REAL
    // =====================================================

    const pendiente =

      this.encargo.total
      - (this.encargo.abono || 0);

    // =====================================================
    // 🔥 MONTO INICIAL
    // =====================================================

    let montoInicial = 0;

    // 🔥 SI YA EXISTE
    if (this.encargo.idFacturaHeader) {

      montoInicial = pendiente;
    }
    else {

      montoInicial =
        this.encargo.abono || 0;
    }

    // =====================================================
    // 🔥 FORM
    // =====================================================

    this.form = this.fb.group({

      formaPago: ['Efectivo'],

      tipoComprobante: [
        'Sin Comprobante'
      ],

      rnc: [''],

      nombreEmpresa: [''],

      montoAbono: [montoInicial]
    });

    // =====================================================
    // 🔥 PAGO FINAL
    // =====================================================

    const montoActual =

      Number(
        this.form.get('montoAbono')
        ?.value
      ) || 0;

    this.esPagoFinal =
      montoActual >= this.pendiente;

    // 🔥 ESCUCHAR CAMBIOS
    this.form.get('montoAbono')
    ?.valueChanges
    .subscribe(valor => {

      const monto =

        Number(valor) || 0;

      this.esPagoFinal =
        monto >= this.pendiente;
    });
  }

  // =====================================================
  // 🔥 CONSULTAR RNC
  // =====================================================

  consultarRnc() {

    const rnc =

      this.form.get('rnc')
      ?.value;

    if (!rnc)
      return;

    // 🔥 LOADING
    this.estadoRnc = 'loading';

    this.mensajeRnc =
      '🔍 Consultando DGII...';

    this.rncService
      .consultarRnc(rnc)
      .subscribe({

        next: (resp) => {

          console.log(
            'Cliente DGII:',
            resp
          );

          // 🔥 SETEAR EMPRESA
          this.form.patchValue({

            nombreEmpresa:
              resp.nombre
          });

          // 🔥 SUCCESS
          this.estadoRnc =
            'success';

          this.mensajeRnc =
            '✔ RNC encontrado correctamente';
        },

        error: (err) => {

          console.error(
            'RNC no encontrado',
            err
          );

          // 🔥 LIMPIAR
          this.form.patchValue({

            nombreEmpresa: ''
          });

          // 🔥 ERROR
          this.estadoRnc =
            'error';

          this.mensajeRnc =
            '✖ RNC no encontrado en DGII';
        }
      });
  }

  // =====================================================
  // 🔥 TOTAL
  // =====================================================

  get total(): number {

    return this.encargo?.total || 0;
  }

  // =====================================================
  // 🔥 PENDIENTE
  // =====================================================

  get pendiente(): number {

    return (

      this.total
      - (this.encargo?.abono || 0)
    );
  }

  // =====================================================
  // 🔥 ITBIS
  // =====================================================

  get itbis(): number {

    if (

      this.form?.value
        ?.tipoComprobante ===
        'Sin Comprobante'
    ) {
      return 0;
    }

    return this.encargo.total * 0.18;
  }

  // =====================================================
  // 🔥 TOTAL FISCAL
  // =====================================================

  get totalFiscal(): number {

    return this.encargo.total
      + this.itbis;
  }

  // =====================================================
  // 🔥 PENDIENTE FISCAL
  // =====================================================

  get pendienteFiscal(): number {

    return this.totalFiscal
      - (this.encargo.abono || 0);
  }

  // =====================================================
  // 🔙 CERRAR
  // =====================================================

  cerrar() {

    this.modal.dismiss(null);
  }

  // =====================================================
  // 🔥 CONFIRMAR
  // =====================================================

  confirmar() {

    if (
      !this.encargo ||
      this.cargando
    ) {
      return;
    }

    const data =
      this.form.value;

    // =====================================================
    // 🔥 MONTO
    // =====================================================


    
    let montoAbono =

      Number(data.montoAbono) || 0;

    console.log(
      'Monto digitado:',
      montoAbono
    );
     
    // 🔥 SI LLEVA ITBIS
    if (
      data.tipoComprobante !==
      'Sin Comprobante'
    ) {

      montoAbono =
        this.pendienteFiscal;
    }
   
    // 🔥 VALIDAR
    if (montoAbono <= 0) {

      console.error(
        'Monto inválido'
      );

      return;
    }

    // =====================================================
    // 🔥 DETALLE PAGOS
    // =====================================================

    const pagos: PagoDTO[] = [

      {
        monto:
          montoAbono,

        metodo:
          data.formaPago
      }
    ];

    console.log(
      'Pagos enviados:',
      pagos
    );

    // =====================================================
    // 🔥 DEVOLVER
    // =====================================================

    this.modal.dismiss({

  // 🔥 SUBTOTAL REAL
  montoPago:
     this.total,

  // 🔥 ITBIS
  itbis:
    data.tipoComprobante !==
    'Sin Comprobante'
      ? this.itbis
      : 0,

  // 🔥 TOTAL FINAL
  totalPago:
    data.tipoComprobante !==
    'Sin Comprobante'
      ? this.pendienteFiscal
      : this.pendiente,

  formaPago:
    data.formaPago,

  tipoComprobante:
    data.tipoComprobante,

  rnc:
    data.rnc,

  nombreEmpresa:
    data.nombreEmpresa,

  detallePagos:
    pagos
});
  }
}