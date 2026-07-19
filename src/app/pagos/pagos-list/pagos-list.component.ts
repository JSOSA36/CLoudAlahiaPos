import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { PagoEmpresaService } from 'src/app/servicios/PagoEmpresaService';
import { PagoEmpresa } from 'src/app/models/PagoEmpresa.models';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintService } from 'src/app/servicios/print.services';

@Component({
  selector: 'app-pagos-list',
  templateUrl: './pagos-list.component.html',
  styleUrls: ['./pagos-list.component.scss']
})
export class PagosListComponent implements OnInit {
  pagos: PagoEmpresa[] = [];
  cargando = false;
  metodosPago: any[] = [];
  modalAbierto = false;
  urlSeleccionado = '';
  filtroEstado = '';
  tasa = 60;

  constructor(
    private pagoService: PagoEmpresaService,
    private sanitizer: DomSanitizer,
    private printService: PrintService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.cargarPagos();
  }

  get filtrados(): PagoEmpresa[] {
    if (!this.filtroEstado) return this.pagos;
    return this.pagos.filter(p => (p.estado || '').toUpperCase() === this.filtroEstado);
  }

  countBy(estado: string): number {
    return this.pagos.filter(p => (p.estado || '').toUpperCase() === estado).length;
  }

  inicial(nombre?: string | null): string {
    const n = (nombre || '?').trim();
    return (n.charAt(0) || '?').toUpperCase();
  }

  estadoClass(estado?: string | null): string {
    const e = (estado || '').toUpperCase();
    if (e === 'APROBADO') return 'status--ok';
    if (e === 'PENDIENTE') return 'status--warn';
    if (e === 'RECHAZADO') return 'status--bad';
    return 'status--muted';
  }

  esPdf(url: string): boolean {
    return (url || '').toLowerCase().includes('.pdf');
  }

  cargarPagos() {
    this.cargando = true;
    this.pagoService.obtenerPagos().subscribe({
      next: (res) => { this.pagos = res; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  abrirModal(url: string) {
    if (!url) return;
    this.urlSeleccionado = url;
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.urlSeleccionado = '';
  }

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  aprobar(pago: PagoEmpresa) {
    this.pagoService.validarPago({
      idPago: pago.id,
      estado: 'APROBADO',
      observacion: '',
      usuarioValida: localStorage.getItem('Usuario') || 'Admin'
    }).subscribe({
      next: () => this.cargarPagos(),
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'No se pudo aprobar',
          message: err?.error?.message || err?.error?.error || 'Error al validar el pago',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async rechazar(pago: PagoEmpresa) {
    const alert = await this.alertCtrl.create({
      header: 'Rechazar pago',
      inputs: [{ name: 'obs', type: 'textarea', placeholder: 'Motivo del rechazo' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          handler: (data) => {
            this.pagoService.validarPago({
              idPago: pago.id,
              estado: 'RECHAZADO',
              observacion: data?.obs || 'Comprobante no válido',
              usuarioValida: localStorage.getItem('Usuario') || 'Admin'
            }).subscribe({
              next: () => this.cargarPagos(),
              error: async (err) => {
                const a = await this.alertCtrl.create({
                  header: 'No se pudo rechazar',
                  message: err?.error?.message || err?.error?.error || 'Error al validar el pago',
                  buttons: ['OK']
                });
                await a.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
