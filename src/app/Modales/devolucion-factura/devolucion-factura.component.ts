import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { facturaheader } from 'src/app/models/facturaheader';
import { facturadetalles } from 'src/app/models/facturadetalles';
import { NotasCreditoService } from 'src/app/servicios/notas-credito.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PrintService } from 'src/app/servicios/print.services';

interface LineaDevolucion {
  detalle: facturadetalles;
  seleccionado: boolean;
  cantidadDevolver: number;
  maxDisponible: number;
  precioUnitario: number;
  valorLinea: number;
}

@Component({
  selector: 'app-devolucion-factura',
  templateUrl: './devolucion-factura.component.html',
  styleUrls: ['./devolucion-factura.component.scss'],
})
export class DevolucionFacturaComponent implements OnInit {

  @Input() factura!: facturaheader;

  lineas: LineaDevolucion[] = [];

  observacion = '';

  procesando = false;

  constructor(
    private modalCtrl: ModalController,
    private notasCreditoService: NotasCreditoService,
    private parametros: ParametrosService,
    private printService: PrintService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {

    this.inicializarLineas();
  }

  private inicializarLineas(): void {

    const detalles =
      this.factura?.facturaDetalles || [];

    this.lineas = detalles
      .map(det => {

        const vendida =
          Number(det.cantidad || 0);

        const devuelta =
          Number(
            (det as any).cantidadDevuelta || 0
          );

        const maxDisponible =
          Math.max(vendida - devuelta, 0);

        const precioUnitario =
          vendida > 0
            ? Number(det.subTotal || 0) / vendida
            : Number(
                det.precioOferta
                || det.productos?.precioVenta
                || 0
              );

        return {
          detalle: det,
          seleccionado: false,
          cantidadDevolver: 0,
          maxDisponible,
          precioUnitario,
          valorLinea: 0
        };
      })
      .filter(l => l.maxDisponible > 0);
  }

  get totalDevolucion(): number {

    return this.lineas.reduce(
      (acc, linea) => acc + linea.valorLinea,
      0
    );
  }

  get hayLineasSeleccionadas(): boolean {

    return this.lineas.some(
      l => l.seleccionado && l.cantidadDevolver > 0
    );
  }

  onLineaChange(linea: LineaDevolucion): void {

    if (linea.seleccionado) {

      if (linea.cantidadDevolver <= 0) {

        linea.cantidadDevolver =
          linea.maxDisponible;
      }

    } else {

      linea.cantidadDevolver = 0;
    }

    this.recalcularLinea(linea);
  }

  cambiarCantidad(linea: LineaDevolucion): void {

    let cantidad =
      Number(linea.cantidadDevolver || 0);

    if (cantidad < 0) {
      cantidad = 0;
    }

    if (cantidad > linea.maxDisponible) {
      cantidad = linea.maxDisponible;
    }

    linea.cantidadDevolver = cantidad;
    linea.seleccionado = cantidad > 0;

    this.recalcularLinea(linea);
  }

  private recalcularLinea(
    linea: LineaDevolucion
  ): void {

    const factor =
      linea.detalle.cantidad > 0
        ? linea.cantidadDevolver
          / linea.detalle.cantidad
        : 0;

    linea.valorLinea =
      Math.round(
        Number(linea.detalle.subTotal || 0)
          * factor
        * 100
      ) / 100;
  }

  cerrar(): void {

    this.modalCtrl.dismiss();
  }

  async confirmarDevolucion(): Promise<void> {

    if (!this.hayLineasSeleccionadas) {

      await this.mostrarToast(
        'Seleccione productos y cantidades a devolver.',
        'warning'
      );

      return;
    }

    const lineas =
      this.lineas
        .filter(
          l =>
            l.seleccionado
            && l.cantidadDevolver > 0
        )
        .map(l => ({
          idFacturaDetalle:
            l.detalle.idFacturaDetalle,
          cantidad: l.cantidadDevolver
        }));

    this.procesando = true;

    this.notasCreditoService
      .crearNotaCredito({

        idFacturaHeader:
          this.factura.idFacturaHeader,

        idEmpresa:
          this.parametros.GetIdEmpresa(),

        idUsuario:
          this.parametros.IdUsuario,

        observacion: this.observacion,

        lineas
      })
      .subscribe({

        next: async (res) => {

          this.procesando = false;

          await this.mostrarToast(
            res?.mensaje
              || 'Nota de crédito generada.',
            'success'
          );

          try {

            await firstValueFrom(
              this.printService.printNotaCredito(
                res.idNotaCredito,
                this.parametros.GetIdEmpresa()
              )
            );

          } catch {

            await this.mostrarToast(
              'NC creada, pero no se pudo imprimir.',
              'warning'
            );
          }

          this.modalCtrl.dismiss({
            refresh: true,
            notaCredito: res
          });
        },

        error: async (err) => {

          this.procesando = false;

          await this.mostrarToast(
            err?.error
              || 'Error al generar la nota de crédito.',
            'danger'
          );
        }
      });
  }

  private async mostrarToast(
    message: string,
    color: string
  ): Promise<void> {

    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });

    await toast.present();
  }

  nombreProducto(
    detalle: facturadetalles
  ): string {

    return detalle?.productos?.nombre
      || 'Producto';
  }
}
