import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EcfPreviewComponent } from 'src/app/ecf-preview/ecf-preview.component';
import { EmisionEcfResultadoCompleto } from 'src/app/models/facturacion-electronica.models';
import { TicketNotaCredito, NotaCreditoResultado } from 'src/app/servicios/notas-credito.service';

export type TipoDocumentoElectronico =
  | 'factura'
  | 'nota_credito'
  | 'nota_debito'
  | 'otro';

@Injectable({ providedIn: 'root' })
export class EcfPreviewLauncherService {

  constructor(private modalCtrl: ModalController) {}

  labelTipoEcf(tipoEcfDgii?: number | null): string {
    switch (tipoEcfDgii) {
      case 31: return 'Factura de Crédito Fiscal Electrónica';
      case 32: return 'Factura de Consumo Electrónica';
      case 33: return 'Nota de Débito Electrónica';
      case 34: return 'Nota de Crédito Electrónica';
      case 44: return 'Regímenes Especiales Electrónica';
      case 45: return 'Gubernamental Electrónica';
      default:
        return tipoEcfDgii
          ? `Comprobante Electrónico e${tipoEcfDgii}`
          : 'Comprobante Electrónico';
    }
  }

  tituloParaTipo(tipo: TipoDocumentoElectronico): string {
    switch (tipo) {
      case 'nota_credito':
        return 'Vista Previa — Nota de Crédito Electrónica';
      case 'nota_debito':
        return 'Vista Previa — Nota de Débito Electrónica';
      case 'factura':
        return 'Vista Previa — Factura Electrónica';
      default:
        return 'Vista Previa — Documento Electrónico';
    }
  }

  esComprobanteElectronico(ncf?: string | null, trackId?: string | null): boolean {
    const n = (ncf || '').trim().toUpperCase();
    if (n.startsWith('E') && n.length >= 3) return true;
    const t = (trackId || '').trim();
    return !!t && t !== '00000000-0000-0000-0000-000000000000';
  }

  async openFromEmision(opts: {
    resultado: EmisionEcfResultadoCompleto | any;
    factura: any;
    tipo?: TipoDocumentoElectronico;
    tipoEcfDgii?: number | null;
  }): Promise<void> {
    const tipo = opts.tipo || 'factura';
    const factura = {
      ...opts.factura,
      tipoDocumentoFiscal:
        opts.factura?.tipoDocumentoFiscal
        || this.labelTipoEcf(opts.tipoEcfDgii)
    };

    await this.present({
      titulo: this.tituloParaTipo(tipo),
      factura,
      ecfData: opts.resultado
    });
  }

  async openFromNotaCredito(opts: {
    ticket: TicketNotaCredito;
    resultado?: NotaCreditoResultado | null;
  }): Promise<boolean> {
    const ticket = opts.ticket;
    const res = opts.resultado;
    const ncf = res?.ncf || ticket.ncf;
    const trackId = res?.trackId || ticket.trackId;

    if (!this.esComprobanteElectronico(ncf, trackId)) {
      return false;
    }

    const mensajes: string[] = [];
    const msg =
      res?.mensajeEmision
      || ticket.mensajeEmision
      || '';
    if (msg) mensajes.push(msg);

    const factura = {
      empresa: ticket.nombreEmpresa,
      direccion: ticket.direccionEmpresa,
      telefono: ticket.telefonoEmpresa,
      fecha: ticket.fecha || new Date(),
      tipoDocumentoFiscal: 'Nota de Crédito Electrónica (e34)',
      cliente: ticket.cliente,
      rnc: ticket.rnc,
      ncfModificado: ticket.ncfModificado,
      numeroDocumento: ticket.numeroDocumento,
      numeroFacturaOrigen: ticket.numeroFactura,
      items: (ticket.detalles || []).map(d => ({
        nombre: d.descripcion,
        cantidad: d.cantidad,
        precio: d.precio,
        subTotal: d.subTotal
      })),
      totalItbis: ticket.totalItbis,
      total: ticket.total ?? res?.total
    };

    const ecfData = {
      encf: ncf,
      trackId,
      estadoDgii: res?.estadoDgii || ticket.estadoDgii,
      securityCode: ticket.securityCode || null,
      urlQR: ticket.urlQR || null,
      rncEmisor: ticket.rncEmisor || null,
      razonSocialEmisor: ticket.nombreEmpresa,
      mensajesDgii: mensajes
    };

    await this.present({
      titulo: this.tituloParaTipo('nota_credito'),
      factura,
      ecfData
    });
    return true;
  }

  async openFromHistorial(item: {
    encf?: string;
    tipoEcfDgii?: number;
    estadoDGII?: string;
    estadoDgii?: string;
    trackId?: string;
    fechaEmision?: string;
    montoTotal?: number;
    rncComprador?: string;
    nombreReceptor?: string;
    mensajeRespuesta?: string;
    securityCode?: string;
    urlQR?: string;
    rncEmisor?: string;
    razonSocialEmisor?: string;
  }): Promise<void> {
    const tipoEcf = item.tipoEcfDgii;
    const tipoDoc: TipoDocumentoElectronico =
      tipoEcf === 34 ? 'nota_credito'
      : tipoEcf === 33 ? 'nota_debito'
      : 'factura';

    const mensajes = item.mensajeRespuesta
      ? [item.mensajeRespuesta]
      : [];

    const factura = {
      empresa: item.razonSocialEmisor,
      fecha: item.fechaEmision ? new Date(item.fechaEmision) : new Date(),
      tipoDocumentoFiscal: this.labelTipoEcf(tipoEcf),
      cliente: item.nombreReceptor || 'Receptor',
      rnc: item.rncComprador,
      items: [],
      total: item.montoTotal
    };

    const ecfData = {
      encf: item.encf,
      trackId: item.trackId,
      estadoDgii: item.estadoDGII || item.estadoDgii,
      securityCode: item.securityCode || null,
      urlQR: item.urlQR || null,
      rncEmisor: item.rncEmisor || null,
      razonSocialEmisor: item.razonSocialEmisor || null,
      mensajesDgii: mensajes
    };

    await this.present({
      titulo: this.tituloParaTipo(tipoDoc),
      factura,
      ecfData
    });
  }

  private async present(props: {
    titulo: string;
    factura: any;
    ecfData: any;
  }): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EcfPreviewComponent,
      cssClass: 'modal-factura-full',
      componentProps: props
    });
    await modal.present();
    await modal.onDidDismiss();
  }
}
