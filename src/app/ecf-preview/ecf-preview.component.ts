import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
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
  private pollSub?: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private feService: FacturacionElectronicaService
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

  get esPendiente(): boolean {
    return !this.esAceptado && !this.esRechazado;
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

  imprimir() {
    window.print();
  }

  cerrar() {
    this.pollSub?.unsubscribe();
    this.modalCtrl.dismiss();
  }
}
