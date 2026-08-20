import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AlahiaAiService, EmpresaAiConfigDto } from '../servicios/alahia-ai.service';
import { ParametrosService } from '../servicios/parametros.service';

@Component({
  selector: 'app-alahia-ai-config',
  templateUrl: './alahia-ai-config.component.html',
  styleUrls: ['./alahia-ai-config.component.scss']
})
export class AlahiaAiConfigComponent implements OnInit {
  loading = true;
  saving = false;
  hasApiKey = false;

  provider = 'OpenAI';
  model = 'gpt-4o-mini';
  baseUrl = '';
  apiKey = '';
  activo = true;
  clearApiKey = false;

  readonly providers = [
    { id: 'OpenAI', label: 'OpenAI' },
    { id: 'Ollama', label: 'Ollama (local)' },
    { id: 'AzureOpenAI', label: 'Azure OpenAI (próximamente)' }
  ];

  constructor(
    private ai: AlahiaAiService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ai.getConfig().subscribe({
      next: (c: EmpresaAiConfigDto) => {
        this.applyConfig(c);
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        await this.toast('No se pudo cargar la configuración de IA.');
      }
    });
  }

  private applyConfig(c: EmpresaAiConfigDto): void {
    this.provider = c.provider || 'OpenAI';
    this.model = c.model || 'gpt-4o-mini';
    this.baseUrl = c.baseUrl || '';
    this.activo = !!c.activo;
    this.hasApiKey = !!c.hasApiKey;
    this.apiKey = '';
    this.clearApiKey = false;
  }

  async guardar(): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.ai
      .saveConfig({
        provider: this.provider,
        model: this.model,
        baseUrl: this.baseUrl || null,
        activo: this.activo,
        apiKey: this.apiKey?.trim() || null,
        clearApiKey: this.clearApiKey
      })
      .subscribe({
        next: async (c) => {
          this.applyConfig(c);
          this.saving = false;
          await this.toast('Configuración de IA guardada.');
        },
        error: async () => {
          this.saving = false;
          await this.toast('No se pudo guardar. Revisa la API.');
        }
      });
  }

  irAlChat(): void {
    void this.router.navigateByUrl('/alahia-ai');
  }

  private async toast(message: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'dark' });
    await t.present();
  }
}
