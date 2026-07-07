import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { ModalController } from '@ionic/angular';

import { ClienteService } from 'src/app/servicios/cliente.service';

import { ParametrosService } from 'src/app/servicios/parametros.service';

import { ClienteVozComponent } from 'src/app/modals/cliente-voz/cliente-voz.component';

import { BizcochoEncargoService } from '../../servicios/bizcocho-encargo.service';
import { PrintService } from 'src/app/servicios/print.services';
import {
  BizcochoEncargo,
  FacturaDetalleBizcochoDTO
} from '../../models/BizcochoEncargo.models';

import { PagoEncargoComponent } from '../pago-encargo/pago-encargo.component';

@Component({
  selector: 'app-form-encargos',
  templateUrl: './form-encargos.component.html',
  styleUrls: ['./form-encargos.component.scss'],
})
export class FormEncargosComponent implements OnInit {

  @Input() data?: BizcochoEncargo;

  form!: FormGroup;

  editando = false;

  guardando = false;

  modoEditar = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private encargoService: BizcochoEncargoService,
    private authService: ParametrosService,
    private clienteService: ClienteService,
    private printService: PrintService
  ) {}

  ngOnInit() {

    this.initForm();

    if (this.data) {

      this.editando = true;

      this.cargarData();

      // 🔥 BLOQUEOS
      this.form.get('libras')?.disable();

      this.form.get('precio')?.disable();

      this.form.get('abono')?.disable();
    }
  }

  // =========================
  // 🔥 INIT FORM
  // =========================
  initForm() {

    this.form = this.fb.group({

      // 🔥 CLIENTE
      idCliente: [0],

      cliente: ['', Validators.required],

      celular: ['', Validators.required],

      // 🔥 BIZCOCHO
      tipoMasa: ['Vainilla'],

      tipoRelleno: ['Fresa'],

      libras: [1, Validators.required],

      // 🔥 PRECIO POR LIBRA
      precio: [0, Validators.required],

      // 🔥 ABONO
      abono: [0],

      // 🔥 EXTRA
      nota: [''],

      fechaEntrega: ['', Validators.required],

      horaEntrega: ['', Validators.required]
    });
  }

  // =========================
  // 🔍 BUSCAR CLIENTE
  // =========================
  buscarPorCelular(event: any) {

    const celular =
      event.target.value?.trim();

    // 🔥 LIMPIAR
    if (!celular || celular.length < 7) {

      this.form.patchValue({

        idCliente: 0,

        cliente: ''
      });

      return;
    }

    this.clienteService
      .GetByTelefono(
        this.authService.IdEmpresa,
        celular
      )
      .subscribe({

        next: (cliente: any) => {

          console.log(
            'Cliente encontrado:',
            cliente
          );

          // 🔥 NO EXISTE
          if (!cliente) {

            this.form.patchValue({

              idCliente: 0
            });

            return;
          }

          // 🔥 EXISTE
          this.form.patchValue({

            idCliente:
              cliente.idCliente,

            cliente:
              cliente.nombre,

            celular:
              cliente.telefono
          });
        },

        error: (err) => {

          console.error(err);

          this.form.patchValue({

            idCliente: 0
          });
        }
      });
  }

  // =========================
  // 🔥 MODAL CLIENTES
  // =========================
  async abrirClientes() {

    const modal =
      await this.modalCtrl.create({

        component:
          ClienteVozComponent,
      });

    await modal.present();

    const { data } =
      await modal.onDidDismiss();

    const cliente =
      data?.cliente ?? data;

    if (!cliente)
      return;

    this.form.patchValue({

      idCliente:
        cliente.idCliente,

      cliente:
        cliente.nombre,

      celular:
        cliente.telefono
    });
  }

  // =========================
  // 🔄 CARGAR DATA
  // =========================
  cargarData() {

    const d = this.data!;

    const detalle =
      d.facturaDetalles?.[0];

    this.form.patchValue({

      idCliente:
        d.idCliente,

      cliente:
        d.cliente,

      celular:
        d.celular,

      tipoMasa:
        detalle?.tipoMasa,

      tipoRelleno:
        detalle?.tipoRelleno,

      libras:
        detalle?.libras,

      precio:
        detalle?.subTotal,

      abono:
        d.abono,

      nota:
        d.nota,

      fechaEntrega:
        this.toDateInput(
          d.fechaEntrega
        ),

      horaEntrega:
        this.toTimeInput(
          d.horaEntrega
        )
    });
  }

  // =========================
  // 🧮 TOTAL
  // =========================
 get total(): number {

  return Number(
    this.form.value.precio
  ) || 0;
}

  // =========================
  // 💰 PENDIENTE
  // =========================
  get pendiente(): number {

    const total =
      this.total;

    const abono =
      Number(this.form.value.abono) || 0;

    return total - abono;
  }

  // =========================
  // 🔥 ESTADO
  // =========================
  get estado(): string {

    return this.pendiente <= 0
      ? 'Pagado'
      : 'Pendiente';
  }

  // =========================
  // 🔥 CREAR DETALLE
  // =========================
  buildDetalle():
  FacturaDetalleBizcochoDTO {

    const v = this.form.value;

    return {

      cantidad:
        Number(v.libras) || 0,

      libras:
        Number(v.libras) || 0,

      subTotal:
        this.total,

      tipoMasa:
        v.tipoMasa,

      tipoRelleno:
        v.tipoRelleno,

      descripcion:
        'Bizcocho Encargo'
    };
  }

  // =========================
  // 🔥 CREAR OBJETO
  // =========================
  // =========================
// 🔥 CREAR OBJETO
// =========================
buildEncargoBase():
BizcochoEncargo {

  const v = this.form.value;


  console.log(v);
  return {

    // =====================================================
    // 🔥 HEADER
    // =====================================================

    idFacturaHeader:
      this.data?.idFacturaHeader,

    idEmpresa:
      this.authService.IdEmpresa,

    idCliente:
      Number(v.idCliente),

    // =====================================================
    // 🔥 MONTOS
    // =====================================================

    // =====================================================
// 🔥 MONTOS
// =====================================================

total:
  this.total,

// 🔥 IMPORTANTE
// 👉 NUEVO:
// usar abono del form
//
// 👉 EDICIÓN:
// usar abono real guardado
abono:

  this.editando

    ? (this.data?.abono || 0)

    : (Number(v.abono) || 0),

formaPago:
  'Efectivo',

estado:
  'PENDIENTE',
    // =====================================================
    // 🔥 EXTRA
    // =====================================================

    nota:
      v.nota,

    fechaEntrega:
      this.mergeFechaHora(
        v.fechaEntrega,
        v.horaEntrega
      ),

    horaEntrega:
      v.horaEntrega
        ? v.horaEntrega.substring(0, 5)
        : '',

    fechaRegistro:
      this.data?.fechaRegistro
      || new Date(),

    // =====================================================
    // 🔥 CLIENTE
    // =====================================================

    cliente:
      v.cliente,

    celular:
      v.celular,

    // =====================================================
    // 🔥 DETALLES
    // =====================================================

    facturaDetalles: [

      this.buildDetalle()
    ],

    // =====================================================
    // 🔥 FISCALES
    // =====================================================

    ncf: '',

    rnc: '',

    nombreEmpresa: ''
  };
}

  // =========================
  // 💾 GUARDAR
  // =========================
  // =========================
// 💾 GUARDAR
// =========================
async guardar() {

  if (
    this.form.invalid ||
    this.guardando
  ) {

    this.form.markAllAsTouched();

    return;
  }

  // =====================================================
  // 🔥 EDITAR
  // =====================================================

  if (this.editando) {

    const encargo =
      this.buildEncargoBase();

    this.guardarEncargo(
      encargo
    );

    return;
  }

  // =====================================================
  // 🔥 NUEVO → MODAL PAGO
  // =====================================================

  const encargoBase =
    this.buildEncargoBase();

  const modal =
    await this.modalCtrl.create({

      component:
        PagoEncargoComponent,

      componentProps: {

        encargo:
          encargoBase
      },

      cssClass:
        'modal-encargo-grande',

      backdropDismiss:
        false
    });

  await modal.present();

  const { data } =
    await modal.onDidDismiss();

  if (!data)
    return;

  // =====================================================
  // 🔥 CREAR OBJETO FINAL
  // =====================================================

  // =====================================================
// 🔥 CREAR OBJETO FINAL
// =====================================================

const encargoFinal =
  this.buildEncargoBase();

// =====================================================
// 🔥 PAGO REAL
// =====================================================

const pagoReal =

  data.detallePagos?.[0]
    ?.monto || 0;

// 🔥 ABONO REAL
encargoFinal.abono =
  pagoReal;

// 🔥 FORMA PAGO
encargoFinal.formaPago =
  data.formaPago;

// =====================================================
// 🔥 FISCALES
// =====================================================

(encargoFinal as any).itbis =
  data.itbis || 0;

(encargoFinal as any).totalPago =
  data.totalPago || 0;

(encargoFinal as any).tipoComprobante =
  data.tipoComprobante;

encargoFinal.rnc =
  data.rnc || '';

encargoFinal.nombreEmpresa =
  data.nombreEmpresa || '';

// =====================================================
// 🔥 DETALLE PAGOS
// =====================================================

(encargoFinal as any)
  .detallePagos =

    data.detallePagos || [];

// =====================================================
// 🔥 GUARDAR
// =====================================================

this.guardarEncargo(
  encargoFinal
);
}

  // =========================
  // 🔥 GUARDAR API
  // =========================
 guardarEncargo(
  encargo: BizcochoEncargo
) {

  this.guardando = true;

  // =====================================
  // 🔥 MAPEAR CLIENTE
  // =====================================

  encargo.cliente =
    this.form.value.cliente;

  encargo.celular =
    this.form.value.celular;

  // =====================================
  // 🔥 UPDATE
  // =====================================

  if (this.editando) {

    this.encargoService
      .update(encargo)
      .subscribe({

        next: (resp: any) => {

          // =====================================
          // 🔥 IMPRIMIR
          // =====================================

          const idFacturaHeader =

            resp?.idFacturaHeader ||

            resp?.data?.idFacturaHeader ||

            encargo.idFacturaHeader ||

            0;

          if (idFacturaHeader > 0) {

            this.printService
              .printTicket(

                idFacturaHeader,

                this.authService.IdEmpresa

              )
              .subscribe({

                next: () => {

                  console.log(
                    '🖨️ Ticket enviado'
                  );
                },

                error: (err) => {

                  console.error(
                    '❌ Error imprimiendo',
                    err
                  );
                }
              });
          }

          this.guardando = false;

          this.modalCtrl.dismiss(
            true
          );
        },

        error: (err) => {

          console.error(
            '❌ Error actualizando',
            err
          );

          this.guardando = false;
        }
      });

  } else {

    // =====================================
    // 🔥 CREATE
    // =====================================

    const request = {

      encargo,

      pagos:

        (encargo as any)
          .detallePagos || []
    };

    this.encargoService
      .create(request)
      .subscribe({

        next: (resp: any) => {

          // =====================================
          // 🔥 IMPRIMIR
          // =====================================

          const idFacturaHeader =

            resp?.idFacturaHeader ||
             resp?.id ||

            resp?.data?.idFacturaHeader ||

            0;

          if (idFacturaHeader > 0) {

            this.printService
              .printTicket(

                idFacturaHeader,

                this.authService.IdEmpresa

              )
              .subscribe({

                next: () => {

                  console.log(
                    '🖨️ Ticket enviado'
                  );
                },

                error: (err) => {

                  console.error(
                    '❌ Error imprimiendo',
                    err
                  );
                }
              });
          }

          this.guardando = false;

          this.modalCtrl.dismiss(
            true
          );
        },

        error: (err) => {

          console.error(
            '❌ Error creando',
            err
          );

          this.guardando = false;
        }
      });
  }
}
  // =========================
  // 🔙 CERRAR
  // =========================
  cerrar() {

    this.modalCtrl.dismiss();
  }

  // =========================
  // 📅 DATE INPUT
  // =========================
 private toDateInput(
  d: Date | string
): string {

  const date = new Date(d);

  const year = date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, '0');

  const day =
    String(date.getDate())
      .padStart(2, '0');

  return `${year}-${month}-${day}`;
}

  // =========================
  // ⏰ TIME INPUT
  // =========================
  private toTimeInput(
    d: Date | string
  ): string {

    const date =
      new Date(d);

    return date
      .toTimeString()
      .substring(0, 5);
  }

  // =========================
  // 🔥 MERGE
  // =========================
 private mergeFechaHora(
  fecha: string,
  hora: string
): Date {

  const [y, m, d] =
    fecha.split('-').map(Number);

  const [h, min] =
    (hora || '00:00')
      .split(':')
      .map(Number);

  return new Date(
    y,
    m - 1,
    d,
    h || 0,
    min || 0,
    0,
    0
  );
}
}