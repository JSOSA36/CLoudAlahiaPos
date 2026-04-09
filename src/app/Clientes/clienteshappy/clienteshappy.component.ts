import { Component, OnInit, Input } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { clientes as Cliente } from 'src/app/models/clientes';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { WaHelperService } from 'src/app/servicios/wa-helper.service';
import confetti from 'canvas-confetti';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-clienteshappy',
  templateUrl: './clienteshappy.component.html',
  styleUrls: ['./clienteshappy.component.scss'],
})
export class ClienteshappyComponent implements OnInit {
  @Input() isModal = false; // 👈 Se indica al abrirlo como modal
  clientesCumple: Cliente[] = [];
  cargando = false;

  private waRef: Window | null = null;
  private readonly waTarget = 'wa_chat_window';
  private waAnchor: HTMLAnchorElement | null = null;
  private preferSameTabOnIOSPWA = true;

  mensajeTemplate = '¡Feliz cumpleaños, {{nombre}}! 🎉 Te desea {{empresa}}.';
  empresa = 'Salon del Caribe';

  constructor(
    private clientesSrv: ClienteService,
    private toastCtrl: ToastController,
    private wa: WaHelperService,
    private modalCtrl: ModalController,
    private parametro: ParametrosService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  /** 🔹 Cierra modal (solo si es modal) */
  dismiss() {
    if (this.isModal) {
      this.modalCtrl.dismiss();
    }
  }

  /** 🎉 Confeti animado */
  lanzarConfeti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  }

  /** 🔄 Pull-to-refresh */
  onRefresh(ev: Event) {
    this.cargar(ev.target as HTMLIonRefresherElement | null);
  }

  /** 📥 Cargar cumpleañeros */
  cargar(refresher?: HTMLIonRefresherElement | null) {
    this.cargando = true;
    this.clientesSrv.GetListadoClientes(this.parametro.GetIdEmpresa()).subscribe({
      next: (data: Cliente[]) => {
        const hoy = new Date();
        const m = hoy.getMonth() + 1;
        const d = hoy.getDate();

        this.clientesCumple = (data || []).filter(c => {
          const md = this.getMonthDay(c.fechaNacimiento || '');
          return !!md && md.m === m && md.d === d;
        });

        if (this.clientesCumple.length > 0) this.lanzarConfeti();
      },
      error: async (err) => {
        console.error(err);
        (await this.toastCtrl.create({
          message: 'Error cargando clientes',
          duration: 1500,
          color: 'danger'
        })).present();
      },
      complete: () => {
        this.cargando = false;
        refresher?.complete();
      }
    });
  }

  /** 🗓️ Helpers de fecha */
  private getMonthDay(fecha: string): { m: number; d: number } | null {
    if (!fecha) return null;
    const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return { m: +iso[2], d: +iso[3] };
    const manual = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (manual) return { d: +manual[1], m: +manual[2] };
    const djs = new Date(fecha);
    return isNaN(djs.getTime()) ? null : { m: djs.getMonth() + 1, d: djs.getDate() };
  }

  fechaBonita(fecha?: string): string {
    if (!fecha) return '—';
    const iso = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const manual = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (manual) return fecha;
    const d = new Date(fecha);
    return isNaN(d.getTime())
      ? fecha
      : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  /** ☎️ WhatsApp */
  getTelefono(c: Cliente): string {
    return (c.celular || c.telefono || '').trim();
  }

  toWaPhone(raw: string): string | null {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length >= 11 && digits.startsWith('1')) return digits;
    if (digits.length === 10 && /^(809|829|849)/.test(digits)) return '1' + digits;
    if (digits.length >= 11) return digits;
    return null;
  }

  async enviarWhatsApp(c: Cliente) {
    const wa = this.toWaPhone(this.getTelefono(c));
    if (!wa) {
      (await this.toastCtrl.create({
        message: 'Número inválido o sin código de país',
        duration: 1500,
        color: 'warning'
      })).present();
      return;
    }

    const msg = this.mensajeTemplate
      .replace('{{nombre}}', c.nombreComercial || '¡Feliz día!')
      .replace('{{empresa}}', this.empresa);

    const url = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;

    if (this.isIOSPWA() && this.preferSameTabOnIOSPWA) {
      window.location.href = url;
      return;
    }

    try {
      if (!this.waAnchor) {
        this.waAnchor = document.createElement('a');
        this.waAnchor.target = this.waTarget;
        this.waAnchor.rel = 'noopener';
        document.body.appendChild(this.waAnchor);
      }
      this.waAnchor.href = url;
      this.waAnchor.click();
    } catch {
      this.waRef = window.open(url, this.waTarget) as Window | null;
      if (!this.waRef) {
        (await this.toastCtrl.create({
          message: 'El navegador bloqueó la ventana. Permite popups para esta página.',
          duration: 1800,
          color: 'medium'
        })).present();
      }
    }
  }

  /** ♻️ Track by */
  trackById(index: number, c: Cliente): number {
    return c?.idEmpresa ?? index; // 👈 unificado a idCliente
  }

  /** 📱 Detecta si es PWA en iOS */
  private isIOSPWA(): boolean {
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true;
    return isIOS && isStandalone;
  }
}
