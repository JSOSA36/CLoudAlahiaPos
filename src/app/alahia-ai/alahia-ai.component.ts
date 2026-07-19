import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AlahiaAiService } from '../servicios/alahia-ai.service';
import { TicketsService } from '../servicios/tickets.service';
import { ParametrosService } from '../servicios/parametros.service';
import { ALAHIA_AI_TIPS, AlahiaAiChatMessage } from '../models/alahia-ai.models';

@Component({
  selector: 'app-alahia-ai',
  templateUrl: './alahia-ai.component.html',
  styleUrls: ['./alahia-ai.component.scss']
})
export class AlahiaAiComponent implements OnInit {
  messages: AlahiaAiChatMessage[] = [];
  input = '';
  loading = false;
  conversationId: string | null = null;
  lastSuggestTicket = false;
  creatingTicket = false;

  readonly tips = ALAHIA_AI_TIPS;

  constructor(
    private ai: AlahiaAiService,
    private tickets: TicketsService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.messages.push({
      role: 'assistant',
      content:
        'Soy Alahia AI, tu asesor empresarial. Pregúntame sobre ventas, cobros, inventario, utilidad o gastos usando los datos reales de tu ERP.',
      at: new Date()
    });

    const q = (this.route.snapshot.queryParamMap.get('q') || '').trim();
    if (q) {
      this.askTip(q);
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
        this.lastSuggestTicket = !!res.suggestTicket;
        this.messages.push({
          role: 'assistant',
          content: res.answer,
          at: new Date(),
          suggestTicket: res.suggestTicket
        });
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        this.messages.push({
          role: 'assistant',
          content: 'No pude consultar Alahia AI en este momento. Verifica la API o crea un ticket de soporte.',
          at: new Date(),
          suggestTicket: true
        });
        this.lastSuggestTicket = true;
        const t = await this.toastCtrl.create({
          message: 'Error al consultar Alahia AI',
          duration: 2200,
          color: 'danger'
        });
        await t.present();
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
          fd.append('Asunto', 'Consulta Alahia AI — necesita soporte humano');
          fd.append(
            'Descripcion',
            'Ticket generado automáticamente desde Alahia AI.\n\n' + (h.ticketBody || '')
          );
          fd.append('Categoria', 'Alahia AI');
          fd.append('Prioridad', 'MEDIA');
          fd.append('VersionSistema', 'Alahia ERP Cloud');
          fd.append('Dispositivo', /Mobi|Android/i.test(navigator.userAgent) ? 'Móvil' : 'Escritorio');
          fd.append('Navegador', navigator.userAgent.slice(0, 120));
          fd.append('SistemaOperativo', navigator.platform || '');
          fd.append('Archivos', file, file.name);

          await this.tickets.crear(fd).toPromise();
          const t = await this.toastCtrl.create({
            message: 'Ticket creado con el historial de la conversación',
            duration: 2500,
            color: 'success'
          });
          await t.present();
        } catch {
          const t = await this.toastCtrl.create({
            message: 'No se pudo crear el ticket',
            duration: 2200,
            color: 'danger'
          });
          await t.present();
        } finally {
          this.creatingTicket = false;
        }
      },
      error: async () => {
        this.creatingTicket = false;
        const t = await this.toastCtrl.create({
          message: 'No se pudo obtener el historial',
          duration: 2200,
          color: 'danger'
        });
        await t.present();
      }
    });
  }
}
