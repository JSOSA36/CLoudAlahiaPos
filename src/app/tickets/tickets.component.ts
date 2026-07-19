import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ParametrosService } from '../servicios/parametros.service';
import { TicketsService } from '../servicios/tickets.service';
import {
  TICKET_CATEGORIAS,
  TICKET_PRIORIDADES,
  TicketDetalle,
  TicketListItem,
  TicketMetricas,
  claseEstado,
  clasePrioridad,
  etiquetaEstado,
  textoEstimadoAtencion
} from '../models/tickets.models';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit {
  idEmpresa = 0;
  idUsuario = 0;
  loading = false;
  vista: 'lista' | 'nuevo' | 'detalle' = 'lista';

  tickets: TicketListItem[] = [];
  metricas: TicketMetricas | null = null;
  detalle: TicketDetalle | null = null;

  asunto = '';
  descripcion = '';
  categoria = 'Error del Sistema';
  prioridad = 'MEDIA';
  archivos: File[] = [];
  categorias = TICKET_CATEGORIAS;
  prioridades = TICKET_PRIORIDADES;

  mensaje = '';
  archivosMensaje: File[] = [];
  enviando = false;

  confirmacionCreacion: { numero: string; rango: string } | null = null;

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
    this.idEmpresa = Number(this.params.IdEmpresa || this.params.GetIdEmpresa() || localStorage.getItem('IdEmpresa') || 0);
    this.idUsuario = Number(this.params.IdUsuario || localStorage.getItem('IdUsuario') || 0);
    await this.cargar();
  }

  async cargar() {
    if (!this.idEmpresa) return;
    this.loading = true;
    try {
      const [tickets, metricas] = await Promise.all([
        firstValueFrom(this.ticketsApi.listarEmpresa(this.idEmpresa)),
        firstValueFrom(this.ticketsApi.metricas(this.idEmpresa))
      ]);
      this.tickets = tickets || [];
      this.metricas = metricas;
    } catch (e: any) {
      await this.toast(e?.error?.error || 'No se pudieron cargar los tickets', 'danger');
    } finally {
      this.loading = false;
    }
  }

  irNuevo() {
    this.vista = 'nuevo';
    this.asunto = '';
    this.descripcion = '';
    this.categoria = 'Error del Sistema';
    this.prioridad = 'MEDIA';
    this.archivos = [];
  }

  async abrirDetalle(t: TicketListItem) {
    const loading = await this.loadingCtrl.create({ message: 'Cargando…' });
    await loading.present();
    try {
      this.detalle = await firstValueFrom(this.ticketsApi.obtener(t.idTicket, this.idEmpresa));
      this.vista = 'detalle';
      this.mensaje = '';
      this.archivosMensaje = [];
    } catch (e: any) {
      await this.toast(e?.error?.error || 'No se pudo abrir el ticket', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  onFiles(ev: Event, destino: 'crear' | 'mensaje') {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (destino === 'crear') this.archivos = files;
    else this.archivosMensaje = files;
  }

  async crear() {
    if (!this.asunto.trim() || !this.descripcion.trim()) {
      await this.toast('Asunto y descripción son obligatorios', 'warning');
      return;
    }
    if (!this.archivos.length) {
      await this.toast('Debe adjuntar al menos una imagen o archivo como evidencia', 'warning');
      return;
    }
    this.enviando = true;
    const loading = await this.loadingCtrl.create({ message: 'Creando ticket…' });
    await loading.present();
    try {
      const fd = new FormData();
      fd.append('IdEmpresa', String(this.idEmpresa));
      fd.append('IdUsuarioCrea', String(this.idUsuario));
      fd.append('Asunto', this.asunto.trim());
      fd.append('Descripcion', this.descripcion.trim());
      fd.append('Categoria', this.categoria);
      fd.append('Prioridad', this.prioridad);
      fd.append('VersionSistema', 'Alahia ERP Cloud');
      fd.append('Dispositivo', /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio');
      fd.append('Navegador', navigator.userAgent.slice(0, 120));
      fd.append('SistemaOperativo', navigator.platform || '');
      this.archivos.forEach(f => fd.append('Archivos', f, f.name));

      this.detalle = await firstValueFrom(this.ticketsApi.crear(fd));
      const rango =
        this.textoEstimado(this.detalle.horasEstimadasMin, this.detalle.horasEstimadasMax)
        || '2–24 horas';

      this.confirmacionCreacion = {
        numero: this.detalle.numero,
        rango
      };

      this.vista = 'detalle';
      this.mensaje = '';
      this.archivosMensaje = [];
      await this.cargar();
    } catch (e: any) {
      await this.toast(e?.error?.error || 'Error al crear el ticket', 'danger');
    } finally {
      this.enviando = false;
      await loading.dismiss();
    }
  }

  cerrarConfirmacion() {
    this.confirmacionCreacion = null;
  }

  async enviarMensaje() {
    if (!this.detalle) return;
    if (!this.mensaje.trim() && this.archivosMensaje.length === 0) {
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
      await this.cargar();
    } catch (e: any) {
      await this.toast(e?.error?.error || 'No se pudo enviar el mensaje', 'danger');
    } finally {
      this.enviando = false;
    }
  }

  volverLista() {
    this.vista = 'lista';
    this.detalle = null;
    this.confirmacionCreacion = null;
    this.cargar();
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, color, duration: 2600, position: 'top' });
    await t.present();
  }
}
