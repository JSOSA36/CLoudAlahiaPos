import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { FacturaHeaderService } from '../servicios/factura-header.service';
import { ParametrosService } from '../servicios/parametros.service';
import { WaHelperService } from '../servicios/wa-helper.service';

@Component({
  selector: 'app-enviar-factura',
  templateUrl: './enviar-factura.modal.html',
  styleUrls: ['./enviar-factura.modal.scss']
})
export class EnviarFacturaModalComponent {
  @Input() idFactura = 0;
  @Input() numeroDocumento = '';
  @Input() total = 0;
  @Input() nombreCliente = '';
  @Input() telefono = '';
  @Input() correo = '';

  enviandoCorreo = false;
  mensaje = '';

  constructor(
    private modal: ModalController,
    private facturas: FacturaHeaderService,
    private parametros: ParametrosService,
    private wa: WaHelperService,
    private toastCtrl: ToastController
  ) {}

  cerrar(): void {
    void this.modal.dismiss();
  }

  async enviarWhatsapp(): Promise<void> {
    const phone = this.toWaPhone(this.telefono);
    if (!phone) {
      this.mensaje = 'Indique un WhatsApp válido. En RD use 809, 829 o 849.';
      return;
    }
    this.mensaje = '';
    this.facturas.crearLinkFacturaPublica(this.idFactura, this.parametros.IdEmpresa).subscribe({
      next: (link) => {
        const url = this.facturas.buildLinkFacturaPublica(link);
        const nombre = (this.nombreCliente || '').trim();
        const doc = link?.numeroDocumento || link?.NumeroDocumento || this.numeroDocumento || String(this.idFactura);
        this.numeroDocumento = doc;
        const msg =
          (nombre ? `Hola ${nombre}, ` : 'Hola, ')
          + `le enviamos su factura ${doc} por RD$ ${Number(this.total || 0).toFixed(2)}.`
          + (url ? `\n${url}` : '');
        const ok = this.wa.openChat(phone, msg);
        this.mensaje = ok
          ? 'WhatsApp abierto con la factura.'
          : 'No se pudo abrir WhatsApp.';
      },
      error: (err) => {
        this.mensaje = err?.error?.message || 'No se pudo preparar el enlace de la factura.';
      }
    });
  }

  enviarCorreo(): void {
    const correo = (this.correo || '').trim();
    if (!correo.includes('@') || !correo.includes('.')) {
      this.mensaje = 'Indique un correo válido.';
      return;
    }
    this.enviandoCorreo = true;
    this.mensaje = '';
    this.facturas.enviarFacturaCorreo(this.idFactura, this.parametros.IdEmpresa, correo).subscribe({
      next: async () => {
        this.enviandoCorreo = false;
        this.mensaje = `Factura enviada a ${correo}.`;
        const toast = await this.toastCtrl.create({
          message: this.mensaje,
          duration: 2200,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      },
      error: (err) => {
        this.enviandoCorreo = false;
        const detalle = err?.error?.message || 'No se pudo enviar el correo.';
        this.mensaje = detalle;
        this.facturas.crearLinkFacturaPublica(this.idFactura, this.parametros.IdEmpresa).subscribe({
          next: (link) => this.abrirMailto(correo, link),
          error: () => this.abrirMailto(correo, null)
        });
      }
    });
  }

  private abrirMailto(correo: string, link: any): void {
    const url = link ? this.facturas.buildLinkFacturaPublica(link) : '';
    const doc = link?.numeroDocumento || link?.NumeroDocumento || this.numeroDocumento || String(this.idFactura);
    if (doc) this.numeroDocumento = doc;
    const subject = encodeURIComponent(`Factura ${doc}`);
    const body = encodeURIComponent(
      `Le enviamos su factura ${doc} por RD$ ${Number(this.total || 0).toFixed(2)}.`
      + (url ? `\n${url}` : '')
    );
    window.open(`mailto:${correo}?subject=${subject}&body=${body}`, '_blank');
  }

  private toWaPhone(raw: string): string | null {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length >= 11 && digits.startsWith('1')) return digits;
    if (digits.length === 10 && /^(809|829|849)/.test(digits)) return '1' + digits;
    if (digits.length >= 11) return digits;
    return null;
  }
}
