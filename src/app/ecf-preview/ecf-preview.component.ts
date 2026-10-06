import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';

@Component({
  selector: 'app-ecf-preview',
  templateUrl: './ecf-preview.component.html',
  styleUrls: ['./ecf-preview.component.scss'],
})
export class EcfPreviewComponent implements OnInit, OnDestroy {

  @Input() factura: any;
  @Input() ecfData: any;
  /** Título del modal según tipo de documento electrónico. */
  @Input() titulo = 'Vista Previa — Documento Electrónico';

  consultando = false;
  exportandoPdf = false;
  private pollSub?: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private feService: FacturacionElectronicaService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    if (this.esPendiente && this.trackIdValido) {
      this.iniciarConsultaEstado();
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  get trackIdValido(): boolean {
    const id = this.ecfData?.trackId;
    return !!id && id !== '00000000-0000-0000-0000-000000000000';
  }

  get esAceptado(): boolean {
    const estado = (this.ecfData?.estadoDgii || '').toLowerCase();
    return estado.includes('aceptado');
  }

  get esRechazado(): boolean {
    const estado = (this.ecfData?.estadoDgii || '').toLowerCase();
    return estado.includes('rechazado');
  }

  get esError(): boolean {
    const estado = (this.ecfData?.estadoDgii || '').toLowerCase();
    return estado.includes('error');
  }

  get esPendiente(): boolean {
    return !this.esAceptado && !this.esRechazado && !this.esError;
  }

  /** Etiqueta legible: DGII suele devolver EnProceso al recibir el envío. */
  get estadoLabel(): string {
    const raw = (this.ecfData?.estadoDgii || '').trim();
    if (!raw) return this.consultando ? 'Consultando DGII...' : 'Procesando...';
    const lower = raw.toLowerCase().replace(/\s+/g, '');
    if (lower.includes('aceptadocondicional')) return 'Aceptado condicional';
    if (lower.includes('aceptado')) return 'Aceptado';
    if (lower.includes('rechazado')) return 'Rechazado';
    if (lower.includes('proceso') || lower.includes('pendiente') || lower === 'enviado') {
      return this.consultando ? 'En proceso en DGII…' : 'En proceso en DGII';
    }
    if (lower.includes('error')) return 'Error';
    return raw;
  }

  iniciarConsultaEstado() {
    if (!this.trackIdValido || this.esAceptado || this.esRechazado) return;

    this.pollSub?.unsubscribe();
    this.consultando = true;

    // DGII suele tardar unos segundos; reintentar hasta ~45s.
    let intentos = 0;
    const maxIntentos = 8;

    this.pollSub = timer(2500, 5000).pipe(
      switchMap(() => {
        intentos++;
        return this.feService.consultarEstado(this.ecfData.trackId);
      }),
      takeWhile((res) => {
        this.aplicarConsulta(res);
        const final = this.esAceptado || this.esRechazado;
        if (final || intentos >= maxIntentos) {
          this.consultando = false;
          return false;
        }
        return true;
      }, true)
    ).subscribe({
      error: () => { this.consultando = false; }
    });
  }

  actualizarEstado() {
    if (!this.trackIdValido || this.consultando) return;
    this.consultando = true;
    this.feService.consultarEstado(this.ecfData.trackId).subscribe({
      next: (res) => {
        this.aplicarConsulta(res);
        this.consultando = false;
        if (this.esPendiente) this.iniciarConsultaEstado();
      },
      error: () => { this.consultando = false; }
    });
  }

  private aplicarConsulta(res: any) {
    if (!res || !this.ecfData) return;
    if (res.estado) this.ecfData.estadoDgii = res.estado;
    if (res.securityCode) this.ecfData.securityCode = res.securityCode;
    if (res.urlQR) this.ecfData.urlQR = res.urlQR;
    if (Array.isArray(res.mensajes) && res.mensajes.length) {
      this.ecfData.mensajesDgii = res.mensajes;
    }
  }

  get mensajesDgii(): string[] {
    const list = this.ecfData?.mensajesDgii;
    if (Array.isArray(list) && list.length) return list;
    const uno = this.ecfData?.mensajeEmision || this.factura?.mensajeEmision;
    return uno ? [uno] : [];
  }

  get puedeImprimir(): boolean {
    return !this.esRechazado && !this.esError;
  }

  get razonSocial(): string {
    return this.ecfData?.razonSocialEmisor || this.factura?.razonSocial || this.factura?.empresa || '';
  }

  get nombreComercial(): string {
    return this.factura?.nombreComercial || this.factura?.empresa || this.razonSocial;
  }

  get fechaEmisionTxt(): string {
    return this.fechaCorta(this.factura?.fecha);
  }

  get fechaVencimientoTxt(): string {
    return this.fechaCorta(this.factura?.fechaVencimiento);
  }

  get codigoSeguridad(): string {
    return (this.ecfData?.securityCode || this.qrParam('CodigoSeguridad') || '').trim();
  }

  get fechaFirmaTxt(): string {
    const qr = this.qrParam('FechaFirma');
    if (qr) return qr;
    return this.fechaFirmaPlana(this.factura?.fechaFirma || this.ecfData?.fechaFirma);
  }

  lineaMonto(item: any): number {
    return Number(item?.cantidad || 0) * Number(item?.precio || 0);
  }

  private fechaCorta(valor?: string | Date | null): string {
    if (!valor) return '';
    if (typeof valor === 'string') {
      const lista = valor.trim().match(/^(\d{2})-(\d{2})-(\d{4})/);
      if (lista) return `${lista[1]}-${lista[2]}-${lista[3]}`;
      const iso = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
    }
    const d = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(d.getTime()) || d.getFullYear() > 2100) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  }

  private fechaFirmaPlana(valor?: string | Date | null): string {
    if (!valor) return '';
    if (typeof valor === 'string') {
      const lista = valor.trim().match(/^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}:\d{2}:\d{2}))?/);
      if (lista) return lista[4] ? `${lista[1]}-${lista[2]}-${lista[3]} ${lista[4]}` : `${lista[1]}-${lista[2]}-${lista[3]}`;
    }
    const d = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(d.getTime()) || d.getFullYear() > 2100) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  private qrParam(key: string): string {
    const url = this.ecfData?.urlQR;
    if (!url) return '';
    try {
      return decodeURIComponent(new URL(url).searchParams.get(key) || '').replace(/\+/g, ' ');
    } catch {
      const m = String(url).match(new RegExp(`[?&]${key}=([^&]+)`, 'i'));
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    }
  }

  imprimir() {
    if (!this.puedeImprimir) return;
    window.print();
  }

  async exportarPdf() {
    if (!this.esAceptado || this.exportandoPdf) return;
    this.exportandoPdf = true;
    try {
      const { descargarEcfPdf } = await import('./ecf-preview-pdf');
      await descargarEcfPdf({
        empresa: this.ecfData?.razonSocialEmisor || this.factura?.empresa,
        razonSocial: this.razonSocial,
        nombreComercial: this.nombreComercial,
        rncEmisor: this.ecfData?.rncEmisor,
        direccion: this.factura?.direccion,
        tipoDocumento: this.factura?.tipoDocumentoFiscal,
        encf: this.ecfData?.encf,
        fecha: this.factura?.fecha,
        fechaVencimiento: this.factura?.fechaVencimiento,
        fechaFirma: this.fechaFirmaTxt,
        cliente: this.factura?.cliente,
        rnc: this.factura?.rnc,
        securityCode: this.codigoSeguridad,
        urlQR: this.ecfData?.urlQR,
        items: this.factura?.items || [],
        totalItbis: this.factura?.totalItbis,
        total: this.factura?.total
      });
    } catch (err) {
      console.error(err);
      const toast = await this.toastCtrl.create({
        message: 'No se pudo exportar el PDF',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.exportandoPdf = false;
    }
  }

  cerrar() {
    this.pollSub?.unsubscribe();
    this.modalCtrl.dismiss();
  }
}
