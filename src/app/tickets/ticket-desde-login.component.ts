import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { TicketsService } from '../servicios/tickets.service';
import {
  TICKET_CATEGORIAS,
  TICKET_PRIORIDADES,
  textoEstimadoAtencion
} from '../models/tickets.models';

@Component({
  selector: 'app-ticket-desde-login',
  templateUrl: './ticket-desde-login.component.html',
  styleUrls: ['./ticket-desde-login.component.scss']
})
export class TicketDesdeLoginComponent implements OnInit {
  /** Prefill desde login / pantallas de bloqueo */
  @Input() userName = '';
  @Input() password = '';

  asunto = '';
  descripcion = '';
  categoria: string = 'Acceso al Sistema';
  prioridad: string = 'ALTA';
  archivo: File | null = null;
  enviando = false;
  exitoNumero: string | null = null;
  exitoRango = '';

  categorias = TICKET_CATEGORIAS;
  prioridades = TICKET_PRIORIDADES;

  constructor(
    private modalCtrl: ModalController,
    private ticketsApi: TicketsService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.userName = (this.userName || '').trim();
    this.password = this.password || '';
  }

  cerrar() {
    this.modalCtrl.dismiss({ creado: !!this.exitoNumero, numero: this.exitoNumero });
  }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.archivo = (input.files && input.files[0]) || null;
  }

  async enviar() {
    if (!this.userName.trim() || !this.password) {
      await this.toast('Usuario y contraseña son obligatorios', 'warning');
      return;
    }
    if (!this.asunto.trim() || !this.descripcion.trim()) {
      await this.toast('Asunto y descripción son obligatorios', 'warning');
      return;
    }
    if (!this.archivo) {
      await this.toast('Debe adjuntar al menos una imagen o archivo como evidencia', 'warning');
      return;
    }

    this.enviando = true;
    const loading = await this.loadingCtrl.create({ message: 'Creando ticket…' });
    await loading.present();
    try {
      const fd = new FormData();
      fd.append('UserName', this.userName.trim());
      fd.append('Password', this.password);
      fd.append('Asunto', this.asunto.trim());
      fd.append('Descripcion', this.descripcion.trim());
      fd.append('Categoria', this.categoria || 'Acceso al Sistema');
      fd.append('Prioridad', this.prioridad || 'ALTA');
      fd.append('VersionSistema', 'Alahia ERP Cloud');
      fd.append('Dispositivo', /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio');
      fd.append('Navegador', navigator.userAgent.slice(0, 120));
      fd.append('SistemaOperativo', navigator.platform || '');
      fd.append('Archivos', this.archivo, this.archivo.name);

      const ticket = await firstValueFrom(this.ticketsApi.crearDesdeLogin(fd));
      this.exitoNumero = ticket.numero;
      this.exitoRango =
        textoEstimadoAtencion(ticket.horasEstimadasMin, ticket.horasEstimadasMax) || '2–24 horas';
      await this.toast(`Ticket ${ticket.numero} creado correctamente`, 'success');
    } catch (e: any) {
      await this.toast(e?.error?.error || 'No se pudo crear el ticket', 'danger');
    } finally {
      this.enviando = false;
      await loading.dismiss();
    }
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 3500, color, position: 'top' });
    await t.present();
  }
}
