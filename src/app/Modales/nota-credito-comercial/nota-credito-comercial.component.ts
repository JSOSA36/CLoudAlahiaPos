import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { NotasCreditoService } from 'src/app/servicios/notas-credito.service';
import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';
import { NotaCreditoPreviewComponent } from 'src/app/nota-credito-preview/nota-credito-preview.component';
import { EcfPreviewLauncherService } from 'src/app/servicios/ecf-preview-launcher.service';

@Component({
  selector: 'app-nota-credito-comercial',
  templateUrl: './nota-credito-comercial.component.html',
  styleUrls: ['./nota-credito-comercial.component.scss'],
})
export class NotaCreditoComercialComponent implements OnInit {
  @Input() factura: any = null;
  @Input() idClientePreseleccionado: number | null = null;
  @Input() nombreClientePreseleccionado: string | null = null;

  idCliente: number | null = null;
  nombreCliente = '';
  rncCliente = '';
  concepto = '';
  monto: number | null = null;
  procesando = false;

  get idFactura(): number {
    return this.factura?.idFacturaHeader || 0;
  }

  get numeroFactura(): string {
    return this.factura?.numeroDocumento || this.factura?.numeroFactura || '';
  }

  get totalFactura(): number {
    return Number(this.factura?.total) || 0;
  }

  get itbisFactura(): number {
    return Number(this.factura?.totalItbis ?? this.factura?.itbis) || 0;
  }

  get subTotalFactura(): number {
    const sub = Number(this.factura?.subTotal);
    if (Number.isFinite(sub) && sub > 0) return sub;
    return Math.max(0, this.totalFactura - this.itbisFactura);
  }

  /** Ratio ITBIS de la factura origen (0 si no hay). */
  get ratioItbisFactura(): number {
    if (!this.idFactura || this.totalFactura <= 0 || this.itbisFactura <= 0) return 0;
    return this.itbisFactura / this.totalFactura;
  }

  get montoTotal(): number {
    return Math.max(0, Number(this.monto) || 0);
  }

  /** ITBIS derivado proporcional al de la factura (solo lectura). */
  get itbisDerivado(): number {
    if (this.montoTotal <= 0) return 0;
    if (this.ratioItbisFactura <= 0) return 0;
    return Math.round(this.montoTotal * this.ratioItbisFactura * 100) / 100;
  }

  get netoDerivado(): number {
    return Math.round((this.montoTotal - this.itbisDerivado) * 100) / 100;
  }

  get tasaItbisPct(): number {
    if (this.netoDerivado <= 0 || this.itbisDerivado <= 0) return 0;
    return Math.round((this.itbisDerivado / this.netoDerivado) * 1000) / 10;
  }

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private parametros: ParametrosService,
    private notasCredito: NotasCreditoService,
    private ecfPreview: EcfPreviewLauncherService
  ) {}

  ngOnInit() {
    if (this.factura) {
      // Receptor = RNC + nombre de la factura. No se elige cliente.
      // Si es a crédito, la factura ya trae IdCliente (CXC / saldo a favor).
      this.idCliente = this.resolverIdCliente(this.factura);
      this.nombreCliente = (this.factura.nombreEmpresa || this.factura.nombreCliente || '').trim();
      this.rncCliente = (this.factura.rnc || this.factura.RNC || '').trim();
    } else if (this.idClientePreseleccionado) {
      this.idCliente = this.idClientePreseleccionado;
      this.nombreCliente = this.nombreClientePreseleccionado || '';
    }
  }

  /** Si la factura tiene vínculo a catálogo, se envía; si no, null (e-CF sin cliente). */
  private resolverIdCliente(factura: any): number | null {
    const candidatos = [
      factura?.iDCliente,
      factura?.idCliente,
      factura?.IDCliente,
      factura?.IdCliente,
      factura?.clientes?.idCliente,
      factura?.clientes?.iDCliente,
      factura?.clientes?.IDCliente,
      factura?.Clientes?.idCliente,
      factura?.Clientes?.IDCliente
    ];

    for (const c of candidatos) {
      const n = Number(c);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    return null;
  }

  usarTotalFactura() {
    if (this.totalFactura > 0) {
      this.monto = this.totalFactura;
    }
  }

  async abrirClientes() {
    if (this.factura) return;

    const modal = await this.modalCtrl.create({
      component: ClientesComponent,
      cssClass: 'modal-clientes-full',
      componentProps: { isModalSeleccion: true },
      presentingElement: await this.modalCtrl.getTop(),
      breakpoints: [0, 1],
      initialBreakpoint: 1
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.cliente) {
      this.idCliente = data.cliente.idCliente ?? data.cliente.id ?? null;
      this.nombreCliente = data.cliente.nombreComercial || data.cliente.nombre || '';
      this.rncCliente = data.cliente.cedulaRNC || data.cliente.rnc || '';
    }
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async guardar() {
    if (this.procesando) return;

    const concepto = (this.concepto || '').trim();
    if (!concepto) {
      await this.toast('Indique el concepto / motivo', 'warning');
      return;
    }

    if (this.montoTotal <= 0) {
      await this.toast('Indique un monto válido', 'warning');
      return;
    }

    if (this.factura) {
      // Desde factura: no se elige cliente; basta RNC + nombre comercial del documento.
      this.nombreCliente = (this.nombreCliente || this.factura.nombreEmpresa || '').trim();
      this.rncCliente = (this.rncCliente || this.factura.rnc || '').trim();
      this.idCliente = this.resolverIdCliente(this.factura);

      if (!this.nombreCliente) {
        await this.toast('La factura no tiene nombre comercial del receptor', 'warning');
        return;
      }
      if (!this.rncCliente) {
        await this.toast('La factura no tiene RNC del receptor', 'warning');
        return;
      }
    } else if (!this.idCliente || this.idCliente <= 0) {
      await this.toast('Seleccione el cliente', 'warning');
      return;
    }

    this.procesando = true;
    try {
      const resultado = await firstValueFrom(
        this.notasCredito.crearNotaCreditoComercial({
          idEmpresa: this.parametros.GetIdEmpresa(),
          idUsuario: this.parametros.IdUsuario,
          idCliente: this.idCliente && this.idCliente > 0 ? this.idCliente : null,
          idFacturaHeader: this.idFactura > 0 ? this.idFactura : null,
          concepto,
          monto: this.montoTotal,
          // Backend también deriva; enviamos el calculado para trazabilidad explícita
          montoItbis: this.idFactura ? this.itbisDerivado : 0
        })
      );

      await this.toast(
        resultado?.mensaje || 'Nota de crédito creada',
        resultado?.emisionPendiente ? 'warning' : 'success'
      );

      try {
        if (resultado?.idNotaCredito) {
          const ticket = await firstValueFrom(
            this.notasCredito.getTicket(
              resultado.idNotaCredito,
              this.parametros.GetIdEmpresa()
            )
          );

          // e-CF: misma vista del POS (estado DGII / detalle). Si no, recibo interno.
          const abrioEcf = await this.ecfPreview.openFromNotaCredito({
            ticket,
            resultado
          });

          if (!abrioEcf) {
            const preview = await this.modalCtrl.create({
              component: NotaCreditoPreviewComponent,
              cssClass: 'modal-fullscreen',
              componentProps: { ticket }
            });
            await preview.present();
            await preview.onDidDismiss();
          }
        }
      } catch {
        await this.toast(
          'NC creada, pero no se pudo abrir el recibo. Búsquela en Notas de Crédito.',
          'warning'
        );
      }

      this.modalCtrl.dismiss({ refresh: true, resultado }, 'ok');
    } catch (err: any) {
      const msg = typeof err?.error === 'string'
        ? err.error
        : (err?.error?.message || err?.message || 'No se pudo crear la nota de crédito');
      await this.toast(msg, 'danger');
    } finally {
      this.procesando = false;
    }
  }

  private async toast(message: string, color: string) {
    (await this.toastCtrl.create({ message, duration: 2200, color })).present();
  }
}
