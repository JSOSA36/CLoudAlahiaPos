import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { FormEncargosComponent }
from '../form-encargos/form-encargos.component';



import { PagoEncargoComponent }
from '../pago-encargo/pago-encargo.component';

import { BizcochoEncargoService }
from '../../servicios/bizcocho-encargo.service';

import { BizcochoEncargo }
from '../../models/BizcochoEncargo.models';

import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PrintService } from 'src/app/servicios/print.services';

@Component({
  selector: 'app-listado-encargos',
  templateUrl: './listado-encargos.component.html',
  styleUrls: ['./listado-encargos.component.scss'],
})
export class ListadoEncargosComponent
implements OnInit {

  encargos: BizcochoEncargo[] = [];
filtroEstado = '';
  encargoSeleccionado:
    BizcochoEncargo | null = null;

  filtroCliente = '';
filtroFechaDesde = '';
filtroFechaHasta = '';
  filtroCelular = '';

  cargando = false;

  constructor(
    private modal: ModalController,
private printService: PrintService,
    private encargoService:
      BizcochoEncargoService,

    private authService:
      ParametrosService
  ) {

    console.log(this.authService.IdEmpresa);
  }
imprimir(
  encargo: BizcochoEncargo
) {

  const idFacturaHeader =
    encargo.idFacturaHeader;

  if (!idFacturaHeader)
    return;

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
  // =====================================================
  // 🔥 INIT
  // =====================================================

  ngOnInit() {

    this.cargarEncargos();
  }
filtrarEstado(
  estado: string
) {

  if (
    this.filtroEstado === estado
  ) {

    // 🔥 quitar filtro
    this.filtroEstado = '';

    return;
  }

  this.filtroEstado = estado;
}
  // =====================================================
  // 🔥 CARGAR
  // =====================================================

  cargarEncargos() {

    this.cargando = true;

    this.encargoService
      .getAll(this.authService.IdEmpresa)
      .subscribe({

        next: (data) => {

     this.encargos =
  (data ?? []).map(e => ({

    ...e,

    fechaEntrega:
      e.fechaEntrega
        ? new Date(e.fechaEntrega)
        : new Date(),

    fechaRegistro:
      e.fechaRegistro
        ? new Date(e.fechaRegistro)
        : new Date(),

    fechaInseccion:
      e.fechaInseccion
        ? new Date(e.fechaInseccion)
        : new Date(),

    facturaDetalles:
      e.facturaDetalles || []
  }));
          this.cargando = false;
        },

        error: (err) => {

          console.error(
            '❌ Error cargando encargos',
            err
          );

          this.cargando = false;
        }
      });
  }

  // =====================================================
  // 🔍 FILTRO
  // =====================================================

get encargosFiltrados(): BizcochoEncargo[] {

  const cliente =
    this.filtroCliente
    .toLowerCase()
    .trim();

  const celular =
    this.filtroCelular
    .trim();

  return this.encargos.filter(e => {

    const nombreCliente =
      (
        e.cliente ||
        e.nombreEmpresa ||
        ''
      )
      .toLowerCase();

    const telefono =
      e.celular || '';

    const estado =
      this.getColor(e);

    // 🔥 FECHA ENTREGA
    const fechaEntrega =
      e.fechaEntrega
      ? new Date(e.fechaEntrega)
      : null;

    const cumpleFechaDesde =
      !this.filtroFechaDesde
      ||
      (
        fechaEntrega &&
        fechaEntrega >=
        new Date(this.filtroFechaDesde)
      );

    const cumpleFechaHasta =
      !this.filtroFechaHasta
      ||
      (
        fechaEntrega &&
        fechaEntrega <=
        new Date(
          this.filtroFechaHasta + 'T23:59:59'
        )
      );

    return (

      (
        !cliente ||
        nombreCliente.includes(cliente)
      )

      &&

      (
        !celular ||
        telefono.includes(celular)
      )

      &&

      (
        !this.filtroEstado ||
        estado === this.filtroEstado
      )

      &&

      cumpleFechaDesde

      &&

      cumpleFechaHasta
    );
  });
}
get totalEncargos(): number {

  return this.encargosFiltrados
    .reduce(
      (acc, x) =>
        acc + (x.total || 0),
      0
    );
}

get totalAbonado(): number {

  return this.encargosFiltrados
    .reduce(
      (acc, x) =>
        acc + (x.abono || 0),
      0
    );
}
// =====================================================
// 🖨️ IMPRIMIR CIERRE ENCARGOS
// =====================================================

imprimirCierreEncargos() {

  this.printService
    .printCierreEncargos(

      this.authService.IdEmpresa

    )
    .subscribe({

      next: (resp) => {

        console.log(
          '🖨️ Cierre enviado',
          resp
        );
      },

      error: (err) => {

        console.error(
          '❌ Error imprimiendo cierre',
          err
        );
      }
    });
}
get totalPendiente(): number {

  return this.encargosFiltrados
    .reduce(
      (acc, x) =>
        acc + (
          (x.total || 0)
          -
          (x.abono || 0)
        ),
      0
    );
}

get totalPagados(): number {

  return this.encargosFiltrados
    .filter(
      x =>
        (x.estado || '')
        .toLowerCase() === 'pagado'
    )
    .length;
}

get totalPendientesCount(): number {

  return this.encargosFiltrados
    .filter(
      x =>
        (x.estado || '')
        .toLowerCase() !== 'pagado'
    )
    .length;
}
  // =====================================================
  // 🎯 SELECCIONAR
  // =====================================================

  seleccionar(
    encargo: BizcochoEncargo
  ) {
    this.encargoSeleccionado =
      encargo;
  }

  // =====================================================
  // 🎨 COLOR
  // =====================================================

  getColor(
    encargo: BizcochoEncargo
  ): string {

    if (
      (encargo.estado || '')
      .toLowerCase() === 'pagado'
    ) {
      return 'pagado';
    }

    if (!encargo.fechaEntrega) {
      return 'proximo';
    }

    const ahora = new Date();

    const fecha =
      new Date(encargo.fechaEntrega);

    const diffHoras =
      (
        fecha.getTime()
        - ahora.getTime()
      ) / 3600000;

    if (diffHoras < 0)
      return 'vencido';

    if (diffHoras <= 24)
      return 'hoy';

    return 'proximo';
  }

  // =====================================================
  // 🔥 MODAL
  // =====================================================

  private async abrirModal(
    config: any
  ) {

    document.body
      .classList
      .add('modal-open');

    const modal =
      await this.modal.create(config);

    await modal.present();

    const { data } =
      await modal.onDidDismiss();

    document.body
      .classList
      .remove('modal-open');

    return data;
  }

  // =====================================================
  // ➕ NUEVO
  // =====================================================

  async nuevo() {

    const data =
      await this.abrirModal({

        component:
          FormEncargosComponent,

        cssClass:
          'modal-encargo-grande',

        backdropDismiss: false
      });

    if (data)
      this.cargarEncargos();
  }

  // =====================================================
  // ✏ EDITAR
  // =====================================================

  async editar(
    encargo: BizcochoEncargo
  ) {

    const data =
      await this.abrirModal({

        component:
          FormEncargosComponent,

        cssClass:
          'modal-encargo-grande',

        componentProps: {
          data: encargo
        }
      });

    if (data)
      this.cargarEncargos();
  }

  // =====================================================
  // 💳 PAGAR
  // =====================================================

async pagar(
  encargo: BizcochoEncargo
) {

  const data =
    await this.abrirModal({

      component:
        PagoEncargoComponent,

      cssClass:
        'modal-encargo-grande',

      componentProps: {
        encargo
      }
    });

  console.log(
    '💳 Pago data:',
    data
  );

  // 🔥 CANCELÓ
  if (!data)
    return;
  // 🔥 COBRAR
  this.encargoService
    .pagar({

      idEncargo:
        encargo.idFacturaHeader!,
      idEmpresa:this.authService.IdEmpresa,
      monto:
        data.montoPago,

      itbis:
        data.itbis || 0,

      totalPago:
        data.totalPago ||
        data.montoPago,

      formaPago:
        data.formaPago,

      tipoComprobante:
        data.tipoComprobante,

      rnc:
        data.rnc,

      nombreEmpresa:
        data.nombreEmpresa
    })
    .subscribe({

      next: () => {

        console.log(
          '✅ Pago registrado'
        );

        // 🔥 REFRESCAR
        this.cargarEncargos();

        // 🔥 IMPRIMIR (NO BLOQUEA)
        const idFacturaHeader =
          encargo.idFacturaHeader || 0;

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

                console.warn(
                  '⚠️ No se pudo imprimir',
                  err
                );
              }
            });
        }
      },

      error: (err) => {

        console.error(
          '❌ Error cobrando',
          err
        );
      }
    });
}
  // =====================================================
  // 📦 ENTREGAR
  // =====================================================

  entregar(
    encargo: BizcochoEncargo
  ) {

    const id =
      encargo.idFacturaHeader;

    if (!id) {

      console.error(
        '❌ Encargo sin IdFacturaHeader'
      );

      return;
    }

    this.encargoService
      .entregar(id)
      .subscribe({

        next: () =>
          this.cargarEncargos(),

        error: (err) =>
          console.error(err)
      });
  }

  // =====================================================
  // 💰 HELPERS
  // =====================================================

  total(
    e: BizcochoEncargo
  ): number {

    return e.total || 0;
  }

  pendiente(
    e: BizcochoEncargo
  ): number {

    return (
      (e.total || 0)
      - (e.abono || 0)
    );
  }

  estaPagado(
    e: BizcochoEncargo
  ): boolean {

    return (
      (e.estado || '')
      .toLowerCase()
      === 'pagado'
    );
  }

  // =====================================================
  // 🎂 LIBRAS
  // =====================================================

  getLibras(
    e: BizcochoEncargo
  ): number {

    return (
      e.facturaDetalles?.[0]
        ?.libras || 0
    );
  }
}