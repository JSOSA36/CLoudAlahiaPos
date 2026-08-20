import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { PrintService, PrinterAgentStatus } from 'src/app/servicios/print.services';
import { EmpresaService } from 'src/app/servicios/empresa.services';
import {
  PRINTER_AGENT_MIN_VERSION,
  PRINTER_AGENT_SETUP_ZIP_URL,
  PrinterAgentService
} from 'src/app/servicios/printer-agent.service';

type PasoId = 1 | 2 | 3 | 4 | 5;

@Component({
  selector: 'app-agente-impresion',
  templateUrl: './agente-impresion.component.html',
  styleUrls: ['./agente-impresion.component.scss']
})
export class AgenteImpresionComponent implements OnInit {
  /** Tab principal: impresora | guía */
  tab: 'impresora' | 'guia' = 'impresora';
  paso: PasoId = 1;
  readonly minVersion = PRINTER_AGENT_MIN_VERSION;
  readonly downloadUrl = PRINTER_AGENT_SETUP_ZIP_URL;
  readonly urlSugerida = 'http://localhost:5045';
  readonly urlLoopback = 'http://127.0.0.1:5045';

  apiPrint = '';
  impresoras: string[] = [];
  impresoraFactura = '';
  impresoraLavador = '';
  mismaImpresora = true;
  cargandoImpresoras = false;
  guardandoImpresora = false;

  verificando = false;
  guardando = false;
  estado: 'idle' | 'ok' | 'offline' | 'outdated' = 'idle';
  versionDetectada = '';
  mensajeEstado = '';
  urlDetectada = '';

  readonly pasos: { id: PasoId; titulo: string; corto: string }[] = [
    { id: 1, titulo: 'Qué es el agente', corto: 'Intro' },
    { id: 2, titulo: 'Descargar', corto: 'Descarga' },
    { id: 3, titulo: 'Instalar en Windows', corto: 'Instalar' },
    { id: 4, titulo: 'Conectar con Alahia', corto: 'Conectar' },
    { id: 5, titulo: 'Verificar', corto: 'Verificar' }
  ];

  constructor(
    public parametros: ParametrosService,
    private print: PrintService,
    private empresaSrv: EmpresaService,
    private agent: PrinterAgentService,
    private toastCtrl: ToastController
  ) {}

  get agenteEnEjecucion(): boolean {
    return this.estado === 'ok' || this.estado === 'outdated';
  }

  ngOnInit(): void {
    this.apiPrint = (this.parametros.ApiPrint || '').trim() || this.urlSugerida;
    this.tab = 'impresora';
    void this.iniciar();
  }

  private async iniciar(): Promise<void> {
    await this.verificar(false);
  }

  irA(p: PasoId): void {
    this.paso = p;
  }

  siguiente(): void {
    if (this.paso < 5) this.paso = (this.paso + 1) as PasoId;
  }

  anterior(): void {
    if (this.paso > 1) this.paso = (this.paso - 1) as PasoId;
  }

  descargar(): void {
    window.open(this.downloadUrl, '_blank', 'noopener');
    this.toast('Descarga iniciada. Si no abre, use el enlace alternativo abajo.');
    this.paso = 3;
  }

  async copiarUrl(): Promise<void> {
    const text = this.apiPrint.trim() || this.urlSugerida;
    try {
      await navigator.clipboard.writeText(text);
      this.toast('URL copiada');
    } catch {
      this.toast('No se pudo copiar. Seleccione la URL manualmente.', 'warning');
    }
  }

  usarSugerida(): void {
    this.apiPrint = this.urlSugerida;
  }

  async guardarYContinuar(): Promise<void> {
    const url = (this.apiPrint || '').trim().replace(/\/$/, '');
    if (!url) {
      this.toast('Indique la URL del agente (ej. http://localhost:5045)');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      this.toast('La URL debe empezar por http:// o https://');
      return;
    }

    const id = this.parametros.IdEmpresa;
    if (!id) {
      this.toast('No hay empresa en sesión. Vuelva a iniciar sesión.');
      return;
    }

    this.guardando = true;
    try {
      await firstValueFrom(this.empresaSrv.setApiPrint(id, url));
      this.parametros.ApiPrint = url;
      this.apiPrint = url;
      this.toast('ApiPrint guardado.');
      this.paso = 5;
      await this.verificar(true);
      await this.cargarImpresoras(false);
      this.tab = 'impresora';
    } catch {
      this.parametros.ApiPrint = url;
      this.toast(
        'URL aplicada en esta sesión. No se pudo guardar en el servidor; contacte soporte si persiste.',
        'warning'
      );
      this.paso = 5;
      await this.cargarImpresoras(false);
    } finally {
      this.guardando = false;
    }
  }

  async cargarImpresoras(avisar = true): Promise<void> {
    const url = (this.parametros.ApiPrint || this.urlDetectada || this.apiPrint || '').trim();
    if (!url) {
      this.impresoras = [];
      return;
    }
    this.parametros.ApiPrint = url.replace(/\/$/, '');
    this.cargandoImpresoras = true;
    try {
      const res = await firstValueFrom(this.print.getPrinterSettingsAt(this.parametros.ApiPrint));
      this.impresoras = res?.printers || [];
      this.impresoraFactura = (res?.factura || '').trim();
      this.impresoraLavador = (res?.lavador || this.impresoraFactura).trim();
      this.mismaImpresora =
        !this.impresoraLavador || this.impresoraLavador === this.impresoraFactura;
      if (!this.impresoraFactura && this.impresoras.length === 1) {
        this.impresoraFactura = this.impresoras[0];
      }
    } catch {
      this.impresoras = [];
      if (avisar) {
        this.toast(
          'El agente responde, pero no listó impresoras. Escriba el nombre exacto de Windows.',
          'warning'
        );
      }
    } finally {
      this.cargandoImpresoras = false;
    }
  }

  async guardarImpresora(): Promise<void> {
    if (!this.impresoraFactura?.trim()) {
      this.toast('Seleccione la impresora de tickets / facturas.', 'warning');
      return;
    }
    this.guardandoImpresora = true;
    try {
      const lavador = this.mismaImpresora
        ? this.impresoraFactura
        : this.impresoraLavador || this.impresoraFactura;
      const res = await firstValueFrom(
        this.print.savePrinterSettings(this.impresoraFactura.trim(), lavador.trim())
      );
      this.impresoraFactura = (res?.factura || this.impresoraFactura).trim();
      this.impresoraLavador = (res?.lavador || this.impresoraFactura).trim();
      this.toast('Impresora guardada. Los tickets usarán esta impresora.', 'success');
    } catch (e: any) {
      const msg =
        e?.error?.message ||
        e?.message ||
        'No se pudo guardar la impresora en el agente.';
      this.toast(msg, 'warning');
    } finally {
      this.guardandoImpresora = false;
    }
  }

  async verificar(avisar = true): Promise<void> {
    this.verificando = true;
    this.estado = 'idle';
    this.versionDetectada = '';
    this.mensajeEstado = 'Buscando el agente en este PC…';
    this.urlDetectada = '';

    const urlGuardada = (this.parametros.ApiPrint || '').trim().replace(/\/$/, '');
    const hallado = await this.buscarAgenteEnEjecucion();

    if (!hallado) {
      this.estado = 'offline';
      this.mensajeEstado =
        'No hay respuesta en este PC (se probó localhost:5045 y 127.0.0.1:5045' +
        (urlGuardada ? ` y ${urlGuardada}` : '') +
        '). Si el servicio AlahiaPrinterApi ya está en ejecución, pulse Verificar de nuevo. No reinstale.';
      if (avisar) this.toast(this.mensajeEstado, 'warning');
      this.verificando = false;
      return;
    }

    const estadoHallado = this.aplicarHallazgo(hallado.url, hallado.status);
    await this.persistirUrlSiVacia(hallado.url, urlGuardada);
    await this.cargarImpresoras(false);

    if (avisar) {
      this.toast(
        this.mensajeEstado,
        estadoHallado === 'ok' ? 'success' : 'warning'
      );
    }
    this.verificando = false;
  }

  private urlsCandidatas(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    const add = (raw: string) => {
      const n = (raw || '').trim().replace(/\/$/, '');
      if (!n || !/^https?:\/\//i.test(n)) return;
      const key = n.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(n);
    };
    add(this.parametros.ApiPrint);
    add(this.apiPrint);
    add(this.urlLoopback);
    add(this.urlSugerida);
    return out;
  }

  private async buscarAgenteEnEjecucion(): Promise<{
    url: string;
    status: PrinterAgentStatus;
  } | null> {
    for (const url of this.urlsCandidatas()) {
      const status = await this.pingConReintento(url);
      if (status) {
        return { url, status };
      }
    }
    return null;
  }

  private async pingConReintento(url: string): Promise<PrinterAgentStatus | null> {
    for (let i = 0; i < 2; i++) {
      try {
        const status = await firstValueFrom(this.print.pingAt(url));
        if (status) return status;
      } catch {
        if (i === 0) {
          await new Promise((r) => setTimeout(r, 700));
        }
      }
    }
    return null;
  }

  private aplicarHallazgo(url: string, status: PrinterAgentStatus): 'ok' | 'outdated' {
    this.urlDetectada = url;
    this.parametros.ApiPrint = url;
    this.apiPrint = url;

    const version = (status?.version || '').toString().trim();
    this.versionDetectada = version;

    if (version && this.agent.isOlder(version, this.minVersion)) {
      this.estado = 'outdated';
      this.mensajeEstado =
        `Agente en ejecución (v${version}) en ${url}. No instale de nuevo. ` +
        `Se recomienda v${this.minVersion} cuando haya actualización.`;
      return 'outdated';
    }

    this.estado = 'ok';
    this.mensajeEstado = version
      ? `Agente en ejecución (v${version}) en ${url}. No hace falta instalar.`
      : `Agente en ejecución en ${url}. No hace falta instalar.`;
    return 'ok';
  }

  private async persistirUrlSiVacia(url: string, urlGuardada: string): Promise<void> {
    if (urlGuardada) return;
    const id = this.parametros.IdEmpresa;
    if (!id) return;
    try {
      await firstValueFrom(this.empresaSrv.setApiPrint(id, url));
    } catch {
      // La sesión ya apunta al agente encontrado.
    }
  }

  private async toast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'medium' = 'medium'
  ): Promise<void> {
    (
      await this.toastCtrl.create({
        message,
        duration: 3200,
        color,
        position: 'top'
      })
    ).present();
  }
}
