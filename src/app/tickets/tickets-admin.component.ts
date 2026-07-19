import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ParametrosService } from '../servicios/parametros.service';
import { TicketsService } from '../servicios/tickets.service';
import {
  TICKET_CATEGORIAS,
  TICKET_ESTADOS,
  TICKET_PRIORIDADES,
  TicketDetalle,
  TicketFiltroAdmin,
  TicketListItem,
  TicketMetricas,
  claseEstado,
  clasePrioridad,
  etiquetaEstado,
  textoEstimadoAtencion
} from '../models/tickets.models';

@Component({
  selector: 'app-tickets-admin',
  templateUrl: './tickets-admin.component.html',
  styleUrls: ['./tickets-admin.component.scss']
})
export class TicketsAdminComponent implements OnInit {
  idEmpresa = 0;
  idUsuario = 0;
  loading = false;
  enviando = false;

  tickets: TicketListItem[] = [];
  metricas: TicketMetricas | null = null;
  detalle: TicketDetalle | null = null;

  filtro: TicketFiltroAdmin = {
    q: '',
    estado: '',
    prioridad: '',
    categoria: '',
    orden: 'recientes'
  };

  estados = TICKET_ESTADOS;
  prioridades = TICKET_PRIORIDADES;
  categorias = TICKET_CATEGORIAS;
  ordenes = [
    { value: 'recientes', label: 'Más recientes' },
    { value: 'antiguos', label: 'Más antiguos' },
    { value: 'prioridad', label: 'Mayor prioridad' },
    { value: 'sin_responder', label: 'Sin responder' }
  ];

  mensaje = '';
  archivosMensaje: File[] = [];
  nuevoEstado = '';

  etiquetaEstado = etiquetaEstado;
  claseEstado = claseEstado;
  clasePrioridad = clasePrioridad;
  textoEstimado = textoEstimadoAtencion;

  constructor(
    private ticketsApi: TicketsService,
    private params: ParametrosService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    this.idEmpresa = Number(this.params.IdEmpresa || this.params.GetIdEmpresa() || 0);
    this.idUsuario = Number(this.params.IdUsuario || localStorage.getItem('IdUsuario') || 0);
    await this.cargar();
  }

  async cargar() {
    this.loading = true;
    try {
      const [tickets, metricas] = await Promise.all([
        firstValueFrom(this.ticketsApi.listarAdmin(this.filtro)),
        firstValueFrom(this.ticketsApi.metricas(null))
      ]);
      this.tickets = tickets || [];
      this.metricas = metricas;
    } catch (e: any) {
      await this.toast(e?.error?.error || 'No se pudo cargar el inbox', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async abrir(t: TicketListItem) {
    const loading = await this.loadingCtrl.create({ message: 'Cargando…' });
    await loading.present();
    try {
      this.detalle = await firstValueFrom(this.ticketsApi.obtener(t.idTicket));
      this.nuevoEstado = this.detalle.estado;
      this.mensaje = '';
      this.archivosMensaje = [];
    } catch (e: any) {
      await this.toast(e?.error?.error || 'No se pudo abrir', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  cerrarDetalle() {
    this.detalle = null;
    this.cargar();
  }

  onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.archivosMensaje = Array.from(input.files || []);
  }

  async enviarMensaje() {
    if (!this.detalle) return;
    if (!this.mensaje.trim() && !this.archivosMensaje.length) {
      await this.toast('Escriba un mensaje o adjunte un archivo', 'warning');
      return;
    }
    this.enviando = true;
    try {
      const fd = new FormData();
      fd.append('IdUsuario', String(this.idUsuario));
      fd.append('IdEmpresaUsuario', String(this.idEmpresa));
      fd.append('Mensaje', this.mensaje.trim());
      this.archivosMensaje.forEach(f => fd.append('Archivos', f, f.name));
      this.detalle = await firstValueFrom(this.ticketsApi.mensaje(this.detalle.idTicket, fd));
      this.mensaje = '';
      this.archivosMensaje = [];
      this.nuevoEstado = this.detalle.estado;
      await this.toast('Respuesta enviada', 'success');
    } catch (e: any) {
      await this.toast(e?.error?.error || 'Error al responder', 'danger');
    } finally {
      this.enviando = false;
    }
  }

  async cambiarEstado() {
    if (!this.detalle || !this.nuevoEstado) return;
    this.enviando = true;
    try {
      this.detalle = await firstValueFrom(this.ticketsApi.cambiarEstado(this.detalle.idTicket, {
        estado: this.nuevoEstado,
        idUsuario: this.idUsuario
      }));
      await this.toast('Estado actualizado', 'success');
      await this.cargar();
    } catch (e: any) {
      await this.toast(e?.error?.error || 'No se pudo cambiar el estado', 'danger');
    } finally {
      this.enviando = false;
    }
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, color, duration: 2600, position: 'top' });
    await t.present();
  }
}
