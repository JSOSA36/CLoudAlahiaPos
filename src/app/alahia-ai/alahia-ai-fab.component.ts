import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AlahiaAiService } from '../servicios/alahia-ai.service';
import { ParametrosService } from '../servicios/parametros.service';
import { TicketsService } from '../servicios/tickets.service';
import { ALAHIA_AI_TIPS, AlahiaAiChatMessage } from '../models/alahia-ai.models';

@Component({
  selector: 'app-alahia-ai-fab',
  templateUrl: './alahia-ai-fab.component.html',
  styleUrls: ['./alahia-ai-fab.component.scss']
})
export class AlahiaAiFabComponent implements OnInit, OnDestroy {
  open = false;
  visible = false;
  input = '';
  loading = false;
  conversationId: string | null = null;
  messages: AlahiaAiChatMessage[] = [];
  creatingTicket = false;
  readonly tips = ALAHIA_AI_TIPS;
  private sub?: Subscription;

  constructor(
    private parametros: ParametrosService,
    private ai: AlahiaAiService,
    private tickets: TicketsService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.refreshVisibility();
    this.sub = this.parametros.getModulosActivos$().subscribe(() => this.refreshVisibility());
    const sub2 = this.parametros.sessionStarted$.subscribe(() => this.refreshVisibility());
    this.sub.add(sub2);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private refreshVisibility(): void {
    this.visible = this.parametros.tieneModulo('ALAHIA_AI');
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open && this.messages.length === 0) {
      this.messages.push({
        role: 'assistant',
        content: 'Hola. Soy Alahia AI. ¿En qué te ayudo con tu negocio hoy?',
        at: new Date()
      });
    }
  }

  askTip(tip: string): void {
    this.input = tip;
    void this.send();
  }

  async send(): Promise<void> {
    const text = this.input.trim();
    if (!text || this.loading) return;
    this.messages.push({ role: 'user', content: text, at: new Date() });
    this.input = '';
    this.loading = true;

    this.ai.chat(text, this.conversationId).subscribe({
      next: (res) => {
        this.conversationId = res.conversationId;
        this.messages.push({
          role: 'assistant',
          content: res.answer,
          at: new Date(),
          suggestTicket: res.suggestTicket
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        const detail =
          status === 404
            ? 'El endpoint de Alahia AI no existe en la API configurada. Revisa que el frontend apunte a localhost:5139.'
            : status === 0
              ? 'No hay conexión con la API. Verifica que la API esté corriendo en localhost:5139.'
              : 'No pude responder ahora. Puedes crear un ticket con esta conversación.';
        this.messages.push({
          role: 'assistant',
          content: detail,
          at: new Date(),
          suggestTicket: true
        });
      }
    });
  }

  async crearTicket(): Promise<void> {
    if (!this.conversationId || this.creatingTicket) return;
    this.creatingTicket = true;
    this.ai.historial(this.conversationId).subscribe({
      next: async (h) => {
        try {
          const blob = new Blob([h.ticketBody || 'Historial Alahia AI'], { type: 'text/plain' });
          const file = new File([blob], `alahia-ai-${this.conversationId}.txt`, { type: 'text/plain' });
          const fd = new FormData();
          fd.append('IdEmpresa', String(this.parametros.IdEmpresa));
          fd.append('IdUsuarioCrea', String(this.parametros.IdUsuario));
          fd.append('Asunto', 'Soporte desde Alahia AI');
          fd.append('Descripcion', h.ticketBody || 'Conversación Alahia AI');
          fd.append('Categoria', 'Alahia AI');
          fd.append('Prioridad', 'MEDIA');
          fd.append('VersionSistema', 'Alahia ERP Cloud');
          fd.append('Dispositivo', /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio');
          fd.append('Navegador', navigator.userAgent.slice(0, 120));
          fd.append('SistemaOperativo', navigator.platform || '');
          fd.append('Archivos', file, file.name);
          await this.tickets.crear(fd).toPromise();
          const t = await this.toastCtrl.create({
            message: 'Ticket creado',
            duration: 2000,
            color: 'success'
          });
          await t.present();
        } catch {
          const t = await this.toastCtrl.create({
            message: 'No se pudo crear el ticket',
            duration: 2000,
            color: 'danger'
          });
          await t.present();
        } finally {
          this.creatingTicket = false;
        }
      },
      error: () => {
        this.creatingTicket = false;
      }
    });
  }
}
