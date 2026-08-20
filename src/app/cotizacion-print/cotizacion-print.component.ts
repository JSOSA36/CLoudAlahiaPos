import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { EmpresaDto } from '../models/empresadto.models';
import { FacturaHeaderService } from '../servicios/factura-header.service';
import { ParametrosService } from '../servicios/parametros.service';
import { descargarCotizacionPdf } from './cotizacion-pdf';
@Component({
  selector: 'app-cotizacion-print',
  templateUrl: './cotizacion-print.component.html',
  styleUrls: ['./cotizacion-print.component.scss'],
})
export class CotizacionPrintComponent implements OnInit {

  @Input() cotizacion: any;
  @Input() empresa?: EmpresaDto;
  @Input() nombreEmpresa = '';
  @Input() autoImprimir = false;

  fechaValidez = new Date();
  exportandoPdf = false;
  compartiendo = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private facturaHeader: FacturaHeaderService,
    private parametros: ParametrosService
  ) {}
  ngOnInit(): void {
    const base =
      this.cotizacion?.fechaInseccion
        ? new Date(this.cotizacion.fechaInseccion)
        : new Date();

    this.fechaValidez = new Date(base);
    this.fechaValidez.setDate(this.fechaValidez.getDate() + 15);

    if (this.autoImprimir) {
      setTimeout(() => window.print(), 250);
    }
  }

  get nombreComercial(): string {
    return (
      this.campoEmpresa('nombreComercial') ||
      this.nombreEmpresa ||
      'Mi Empresa'
    );
  }

  get direccionEmpresa(): string {
    return this.campoEmpresa('direccion') || this.campoEmpresa('Direccion');
  }

  get telefonoEmpresa(): string {
    return this.campoEmpresa('telefono') || this.campoEmpresa('Telefono');
  }

  get rncEmpresa(): string {
    return this.campoEmpresa('rnc') || this.campoEmpresa('RNC') || this.campoEmpresa('Rnc');
  }

  get correoEmpresa(): string {
    return (
      this.campoEmpresa('correElectronico') ||
      this.campoEmpresa('CorreElectronico') ||
      this.campoEmpresa('email')
    );
  }

  private campoEmpresa(campo: string): string {
    const v = (this.empresa as any)?.[campo];
    return v != null && String(v).trim() ? String(v).trim() : '';
  }

  get numeroDocumento(): string {
    const num =
      this.cotizacion?.numeroDocumento ||
      this.cotizacion?.NumeroDocumento ||
      '';

    if (num.trim()) {
      return num.trim();
    }

    if (this.cotizacion?.idFacturaHeader) {
      return String(this.cotizacion.idFacturaHeader);
    }

    return '—';
  }

  get clienteNombre(): string {
    return (
      this.datoCliente('nombreComercial') ||
      this.cotizacion?.nombreCuenta ||
      this.cotizacion?.NombreCuenta ||
      'Al Portador'
    );
  }

  get clienteTelefono(): string {
    return (
      this.datoCliente('celular') ||
      this.datoCliente('Celular') ||
      this.datoCliente('telefono') ||
      this.datoCliente('Telefono') ||
      ''
    );
  }

  get clienteRnc(): string {
    return (
      this.datoCliente('cedulaRNC') ||
      this.datoCliente('CedulaRNC') ||
      this.datoCliente('rnc') ||
      this.cotizacion?.rnc ||
      this.cotizacion?.RNC ||
      ''
    );
  }

  get clienteDireccion(): string {
    return (
      this.datoCliente('direccion') ||
      this.datoCliente('Direccion') ||
      ''
    );
  }

  get clienteCorreo(): string {
    return (
      this.datoCliente('email') ||
      this.datoCliente('Email') ||
      this.datoCliente('correo') ||
      ''
    );
  }

  /** Lee del cliente anidado o del header plano. */
  private datoCliente(campo: string): string {
    const c = this.cotizacion?.clientes || this.cotizacion?.Clientes;
    const v = c?.[campo];
    if (v != null && String(v).trim()) {
      return String(v).trim();
    }
    return '';
  }

  private get detalles(): any[] {
    return this.cotizacion?.facturaDetalles || [];
  }

  get subtotal(): number {
    const desdeLineas = this.detalles.reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.precioOferta ?? item.PrecioOferta ?? 0) *
        Number(item.cantidad ?? item.Cantidad ?? 0),
      0
    );

    if (desdeLineas > 0) {
      return desdeLineas;
    }

    return Number(
      this.cotizacion?.subTotal ??
      this.cotizacion?.SubTotal ??
      0
    );
  }

  get itbis(): number {
    return Number(
      this.cotizacion?.totalItbis ??
      this.cotizacion?.TotalItbis ??
      0
    );
  }

  get descuento(): number {
    const headerDesc = Number(
      this.cotizacion?.totalDescuento ??
      this.cotizacion?.TotalDescuento ??
      0
    );

    if (headerDesc > 0.009) {
      return headerDesc;
    }

    const lineasDesc = this.detalles.reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.descuento ?? item.Descuento ?? 0) *
        Number(item.cantidad ?? item.Cantidad ?? 0),
      0
    );

    if (lineasDesc > 0.009) {
      return lineasDesc;
    }

    const bruto = this.subtotal + this.itbis;
    const neto = Number(
      this.cotizacion?.total ??
      this.cotizacion?.Total ??
      0
    );

    if (neto > 0 && bruto - neto > 0.009) {
      return +(bruto - neto).toFixed(2);
    }

    return 0;
  }

  get mostrarDescuento(): boolean {
    return this.descuento > 0.009;
  }

  get total(): number {
    const stored = Number(
      this.cotizacion?.total ??
      this.cotizacion?.Total ??
      0
    );

    if (stored > 0) {
      return stored;
    }

    return +(this.subtotal + this.itbis - this.descuento).toFixed(2);
  }

  nombreProducto(item: any): string {
    return (
      item?.productos?.nombre ||
      item?.productos?.descripcion ||
      'Producto'
    );
  }

  imprimir(): void {
    setTimeout(() => window.print(), 50);
  }

  async exportarPdf(): Promise<void> {
    this.emitir('download');
  }

  async copiarLink(): Promise<void> {
    try {
      this.compartiendo = true;
      const link = await this.obtenerLinkPublico();
      if (!link) return;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        await this.mostrarToast(
          'Link copiado. Péguelo al cliente en WhatsApp o correo.',
          'success'
        );
      } else {
        await this.mostrarToast(link, 'warning');
      }
    } catch (err) {
      console.error(err);
      await this.mostrarToast(
        'No se pudo generar el link de la cotización',
        'danger'
      );
    } finally {
      this.compartiendo = false;
    }
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  private async obtenerLinkPublico(): Promise<string | null> {
    const idFactura = Number(
      this.cotizacion?.idFacturaHeader ||
        this.cotizacion?.IdFacturaHeader ||
        0
    );
    const idEmpresa = Number(
      this.cotizacion?.idEmpresa ||
        this.cotizacion?.IdEmpresa ||
        this.parametros.IdEmpresa ||
        0
    );

    if (idFactura <= 0) {
      await this.mostrarToast(
        'Guarde la cotización antes de compartir el link.',
        'warning'
      );
      return null;
    }

    if (idEmpresa <= 0) {
      await this.mostrarToast(
        'No se pudo identificar la empresa para compartir.',
        'danger'
      );
      return null;
    }

    const res = await firstValueFrom(
      this.facturaHeader.crearLinkCotizacionPublica(idFactura, idEmpresa)
    );

    if (!res?.token) {
      await this.mostrarToast(
        'No se pudo generar el link de la cotización.',
        'danger'
      );
      return null;
    }

    return this.facturaHeader.buildLinkCotizacionPublica(res);
  }

  private emitir(modo: 'download' | 'open'): void {
    if (!this.cotizacion) {
      return;
    }
    try {
      this.exportandoPdf = true;
      descargarCotizacionPdf({
        empresa: this.nombreComercial,
        direccion: this.direccionEmpresa,
        telefono: this.telefonoEmpresa,
        rnc: this.rncEmpresa,
        correo: this.correoEmpresa,
        notaEmpresa: this.empresa?.nota,
        numero: this.numeroDocumento,
        fecha: this.cotizacion?.fechaInseccion,
        hora: this.cotizacion?.hora,
        validez: this.fechaValidez,
        cliente: this.clienteNombre,
        clienteTelefono: this.clienteTelefono,
        clienteRnc: this.clienteRnc,
        clienteDireccion: this.clienteDireccion,
        clienteCorreo: this.clienteCorreo,
        nota: this.cotizacion?.nota,
        lineas: this.detalles.map((item: any) => ({
          descripcion: this.nombreProducto(item),
          cantidad: Number(item.cantidad ?? item.Cantidad ?? 0),
          precio: Number(item.precioOferta ?? item.PrecioOferta ?? 0),
          itbis: Number(item.itbis ?? item.Itbis ?? 0),
          total: Number(item.subTotal ?? item.SubTotal ?? 0)
        })),
        subtotal: this.subtotal,
        itbis: this.itbis,
        descuento: this.descuento,
        mostrarDescuento: this.mostrarDescuento,
        total: this.total,
        modo
      });
      if (modo === 'download') {
        this.mostrarToast('PDF exportado correctamente', 'success');
      }
    } catch {
      this.mostrarToast('No se pudo exportar el PDF', 'danger');
    } finally {
      this.exportandoPdf = false;
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ): Promise<void> {
    (
      await this.toastCtrl.create({
        message,
        duration: 2800,
        position: 'top',
        color
      })
    ).present();
  }
}