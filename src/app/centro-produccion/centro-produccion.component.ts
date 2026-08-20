import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
import { ParametroConfigService } from '../servicios/parametrosconfig.service';
import { ParametrosService } from '../servicios/parametros.service';
import { ProduccionService } from '../servicios/produccion.service';
import {
  PRODUCCION_PRIORIDADES,
  PRODUCCION_TIPO_POS_ORDEN,
  ProduccionConfiguracion,
  ProduccionDashboardResumen,
  ProduccionFlujo,
  ProduccionFlujoEstado,
  ProduccionHistorial,
  ProduccionTrabajo,
  calcularSemaforoCliente,
  claseSemaforo,
  columnasTablero,
  etiquetaEstadoFlujo,
  etiquetaSemaforo,
  formatearDuracion,
  metricasTiempoCliente,
  siguienteEstadoFlujo
} from '../models/produccion.models';

const MUTE_KEY = 'produccion_sonido_mute';

@Component({
  selector: 'app-centro-produccion',
  templateUrl: './centro-produccion.component.html',
  styleUrls: ['./centro-produccion.component.scss']
})
export class CentroProduccionComponent implements OnInit, OnDestroy {
  idEmpresa = 0;
  idUsuario = 0;
  loading = true;
  errorMsg = '';
  accionId: number | null = null;

  flujo: ProduccionFlujo | null = null;
  config: ProduccionConfiguracion | null = null;
  resumen: ProduccionDashboardResumen | null = null;
  trabajos: ProduccionTrabajo[] = [];
  columnas: ProduccionFlujoEstado[] = [];

  filtroTexto = '';
  filtroPrioridad = '';
  mute = false;
  /** Parámetro NotificacionVehiculo: anuncia por voz al pasar a Lista. */
  notificacionVehiculo = false;
  ahoraMs = Date.now();

  historialAbierto = false;
  historialLoading = false;
  historialTrabajo: ProduccionTrabajo | null = null;
  historialItems: ProduccionHistorial[] = [];

  prioridades = PRODUCCION_PRIORIDADES;
  formatearDuracion = formatearDuracion;
  claseSemaforo = claseSemaforo;
  etiquetaSemaforo = etiquetaSemaforo;

  private knownIds = new Set<number>();
  private bootstrapped = false;
  private tickTimer?: ReturnType<typeof setInterval>;
  private subs: Subscription[] = [];
  private audioCtx?: AudioContext;
  private anuncioSeq = 0;

  constructor(
    private params: ParametrosService,
    private parametroConfig: ParametroConfigService,
    private produccion: ProduccionService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit(): Promise<void> {
    this.idEmpresa = Number(
      this.params.IdEmpresa || this.params.GetIdEmpresa() || localStorage.getItem('IdEmpresa') || 0
    );
    this.idUsuario = Number(
      this.params.IdUsuario || localStorage.getItem('IdUsuario') || 0
    );
    this.mute = localStorage.getItem(MUTE_KEY) === '1';
    this.precargarVoces();
    this.cargarFlagNotificacionVehiculo();

    if (!this.idEmpresa) {
      this.loading = false;
      this.errorMsg = 'No se pudo determinar la empresa de la sesión.';
      return;
    }

    this.tickTimer = setInterval(() => {
      this.ahoraMs = Date.now();
    }, 1000);

    this.subs.push(
      this.produccion.trabajosObs$().subscribe(list => {
        this.trabajos = list || [];
        if (!this.bootstrapped) {
          this.knownIds = new Set(this.trabajos.map(t => t.idTrabajo));
          this.bootstrapped = true;
        }
      }),
      this.produccion.upsertObs$().subscribe(t => this.onUpsert(t)),
      this.produccion.reconnectHydrateObs$().subscribe(() => {
        void this.hydrate(false);
      })
    );

    await this.cargarInicial();
  }

  ngOnDestroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.subs.forEach(s => s.unsubscribe());
    this.anuncioSeq++;
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    void this.produccion.stopRealtime();
  }

  async cargarInicial(): Promise<void> {
    this.loading = true;
    this.errorMsg = '';
    try {
      await Promise.all([
        this.cargarMeta(),
        this.hydrate(true),
        this.produccion.startRealtime(this.idEmpresa)
      ]);
    } catch {
      this.errorMsg = 'No se pudo cargar el Centro de Producción.';
    } finally {
      this.loading = false;
    }
  }

  async refrescar(): Promise<void> {
    this.cargarFlagNotificacionVehiculo();
    await this.hydrate(false);
    await this.cargarMeta();
  }

  async handleRefresh(ev: any): Promise<void> {
    try {
      await this.refrescar();
    } finally {
      ev?.target?.complete?.();
    }
  }

  toggleMute(): void {
    this.mute = !this.mute;
    localStorage.setItem(MUTE_KEY, this.mute ? '1' : '0');
  }

  trabajosEnColumna(codigo: string): ProduccionTrabajo[] {
    return this.trabajosFiltrados()
      .filter(t => t.codigoEstadoActual === codigo)
      .sort((a, b) => this.prioridadRank(b.prioridad) - this.prioridadRank(a.prioridad)
        || new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime());
  }

  trabajosFiltrados(): ProduccionTrabajo[] {
    const q = (this.filtroTexto || '').trim().toLowerCase();
    return this.trabajos.filter(t => {
      if (this.filtroPrioridad && t.prioridad !== this.filtroPrioridad) return false;
      if (!q) return true;
      const blob = [
        t.numeroVisible,
        t.nombreVisible,
        t.referencia,
        t.etiquetaContexto,
        t.observacion,
        ...(t.items || []).map(i => i.nombreItem)
      ].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }

  semaforo(t: ProduccionTrabajo): string {
    return calcularSemaforoCliente(t, this.ahoraMs);
  }

  elapsed(t: ProduccionTrabajo): string {
    const m = metricasTiempoCliente(t, this.ahoraMs);
    const sem = this.semaforo(t);
    if (sem === 'EN_COLA') return formatearDuracion(m.segundosEnCola);
    return formatearDuracion(m.segundosSla);
  }

  metricas(t: ProduccionTrabajo) {
    return metricasTiempoCliente(t, this.ahoraMs);
  }

  siguiente(t: ProduccionTrabajo): ProduccionFlujoEstado | null {
    return siguienteEstadoFlujo(this.flujo, t.codigoEstadoActual);
  }

  etiquetaAvance(t: ProduccionTrabajo): string {
    const next = this.siguiente(t);
    if (!next) return '';
    if (next.codigo === 'EN_PREPARACION') return 'Iniciar';
    if (next.codigo === 'LISTA') return 'Marcar lista';
    if (next.codigo === 'ENTREGADA') return 'Entregar';
    return `Pasar a ${etiquetaEstadoFlujo(next.codigo, next.nombreVisible)}`;
  }

  etiquetaTipoOrden(raw: string | null | undefined): string {
    if (!raw) return '';
    const map: Record<string, string> = {
      Llevar: 'Para llevar',
      ComerAqui: 'Comer aquí',
      Delivery: 'Delivery',
      DeliveryExterno: 'Delivery externo'
    };
    return map[raw] || raw;
  }

  async avanzar(t: ProduccionTrabajo): Promise<void> {
    const next = this.siguiente(t);
    if (!next) return;
    this.accionId = t.idTrabajo;
    try {
      const updated = await firstValueFrom(this.produccion.transicionar(this.idEmpresa, t.idTrabajo, {
        codigoEstadoEsperado: t.codigoEstadoActual,
        codigoEstadoNuevo: next.codigo,
        rowVersion: t.rowVersion,
        idUsuario: this.idUsuario
      }));
      this.produccion.aplicarTrabajoLocal(updated);
      if (next.codigo === 'LISTA') {
        this.anunciarVehiculoListo(updated || t);
      }
      await this.cargarResumen();
    } catch (err) {
      await this.handleAccionError(err);
    } finally {
      this.accionId = null;
    }
  }

  async pedirCancelar(t: ProduccionTrabajo): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar trabajo',
      message: `Indica el motivo para cancelar ${t.numeroVisible}.`,
      inputs: [
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Motivo (obligatorio)'
        }
      ],
      buttons: [
        { text: 'Volver', role: 'cancel' },
        {
          text: 'Cancelar trabajo',
          role: 'destructive',
          handler: (data) => {
            const motivo = String(data?.motivo || '').trim();
            if (!motivo) {
              void this.toast('El motivo es obligatorio.', 'warning');
              return false;
            }
            void this.cancelar(t, motivo);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async cambiarPrioridad(t: ProduccionTrabajo, prioridad: string): Promise<void> {
    if (!prioridad || prioridad === t.prioridad) return;
    this.accionId = t.idTrabajo;
    try {
      const updated = await firstValueFrom(this.produccion.prioridad(this.idEmpresa, t.idTrabajo, {
        prioridad,
        rowVersion: t.rowVersion,
        codigoEstadoEsperado: t.codigoEstadoActual,
        idUsuario: this.idUsuario
      }));
      this.produccion.aplicarTrabajoLocal(updated);
    } catch (err) {
      await this.handleAccionError(err);
    } finally {
      this.accionId = null;
    }
  }

  async abrirHistorial(t: ProduccionTrabajo): Promise<void> {
    this.historialTrabajo = t;
    this.historialAbierto = true;
    this.historialLoading = true;
    this.historialItems = [];
    try {
      this.historialItems = await firstValueFrom(
        this.produccion.historial(this.idEmpresa, t.idTrabajo)
      ) || [];
    } catch {
      await this.toast('No se pudo cargar el historial.', 'danger');
    } finally {
      this.historialLoading = false;
    }
  }

  cerrarHistorial(): void {
    this.historialAbierto = false;
    this.historialTrabajo = null;
    this.historialItems = [];
  }

  private async cancelar(t: ProduccionTrabajo, motivo: string): Promise<void> {
    this.accionId = t.idTrabajo;
    try {
      const updated = await firstValueFrom(this.produccion.cancelar(this.idEmpresa, t.idTrabajo, {
        codigoEstadoEsperado: t.codigoEstadoActual,
        rowVersion: t.rowVersion,
        motivo,
        idUsuario: this.idUsuario
      }));
      this.produccion.aplicarTrabajoLocal(updated);
      await this.cargarResumen();
      await this.toast('Trabajo cancelado.', 'medium');
    } catch (err) {
      await this.handleAccionError(err);
    } finally {
      this.accionId = null;
    }
  }

  private async cargarMeta(): Promise<void> {
    const [flujo, config] = await Promise.all([
      firstValueFrom(this.produccion.obtenerFlujoActivo(this.idEmpresa, PRODUCCION_TIPO_POS_ORDEN)),
      firstValueFrom(this.produccion.obtenerConfig(this.idEmpresa)).catch(() => null)
    ]);
    this.flujo = flujo;
    this.config = config;
    this.columnas = columnasTablero(flujo);
    await this.cargarResumen();
  }

  private async cargarResumen(): Promise<void> {
    try {
      this.resumen = await firstValueFrom(
        this.produccion.dashboard(this.idEmpresa, PRODUCCION_TIPO_POS_ORDEN)
      );
    } catch {
      this.resumen = null;
    }
  }

  private async hydrate(resetKnown: boolean): Promise<void> {
    const list = await this.produccion.hydrateActivos(this.idEmpresa, PRODUCCION_TIPO_POS_ORDEN);
    if (resetKnown) {
      this.knownIds = new Set(list.map(t => t.idTrabajo));
      this.bootstrapped = true;
    } else {
      list.forEach(t => this.knownIds.add(t.idTrabajo));
    }
    await this.cargarResumen();
  }

  private onUpsert(t: ProduccionTrabajo): void {
    if (!this.bootstrapped || !t) return;
    const isNew = !this.knownIds.has(t.idTrabajo);
    this.knownIds.add(t.idTrabajo);
    if (isNew && t.activoEnTablero) {
      this.playNuevoTrabajo();
      void this.cargarResumen();
    }
  }

  private cargarFlagNotificacionVehiculo(): void {
    if (!this.idEmpresa) return;
    this.parametroConfig.getParametrosEmpresa(this.idEmpresa).subscribe({
      next: (params) => {
        const p = (params || []).find(x =>
          String(x.clave || '').trim().toLowerCase() === 'notificacionvehiculo'
        );
        const valor = String(p?.valor ?? '').trim().toLowerCase();
        this.notificacionVehiculo = valor === 'true' || valor === '1';
      },
      error: () => {
        this.notificacionVehiculo = false;
      }
    });
  }

  private precargarVoces(): void {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.getVoices();
      synth.onvoiceschanged = () => synth.getVoices();
    } catch { /* ignore */ }
  }

  private anunciarVehiculoListo(t: ProduccionTrabajo): void {
    if (!this.notificacionVehiculo) return;
    const nombre = (t?.nombreVisible || '').trim();
    if (!nombre) return;
    const texto = `${this.nombreParaVoz(nombre)}. Su vehículo está listo.`;
    const seq = ++this.anuncioSeq;
    void this.hablarConRepeticion(texto, seq);
  }

  private async hablarConRepeticion(texto: string, seq: number): Promise<void> {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      await this.esperarVoces(synth);
      if (seq !== this.anuncioSeq) return;
      synth.cancel();
      const primero = this.crearUtterance(texto);
      primero.onend = () => {
        if (seq !== this.anuncioSeq) return;
        setTimeout(() => {
          if (seq !== this.anuncioSeq || !this.notificacionVehiculo) return;
          synth.speak(this.crearUtterance(texto));
        }, 1000);
      };
      synth.speak(primero);
    } catch { /* ignore */ }
  }

  private esperarVoces(synth: SpeechSynthesis): Promise<void> {
    if ((synth.getVoices() || []).length) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => resolve();
      const timer = setTimeout(done, 400);
      synth.onvoiceschanged = () => {
        clearTimeout(timer);
        done();
      };
    });
  }

  private crearUtterance(texto: string): SpeechSynthesisUtterance {
    const utter = new SpeechSynthesisUtterance(texto);
    const voz = this.vozLatina(window.speechSynthesis?.getVoices() || []);
    utter.voice = voz || null;
    utter.lang = voz?.lang || 'es-MX';
    utter.rate = 0.92;
    utter.pitch = 1.05;
    return utter;
  }

  private nombreParaVoz(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/(^|\s)\S/g, c => c.toUpperCase());
  }

  /** Prefiere acento latino (MX/US/Caribe). Evita español de España. */
  private vozLatina(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    const ranked = (voices || [])
      .map(v => ({ v, score: this.puntajeVozLatina(v) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.v;
  }

  private puntajeVozLatina(v: SpeechSynthesisVoice): number {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = (v.name || '').toLowerCase();
    const blob = `${lang} ${name}`;

    if (/\ben[-_]|english|inglés/.test(blob) && !/español|spanish/.test(blob)) return 0;
    if (/españa|spain|helena|pablo|es-es/.test(blob)) return 15;

    let score = 40;
    if (/es-do|dominican|dominic|ramona|emilio/.test(blob)) score = 100;
    else if (/sabina|raul/.test(name)) score = 92;
    else if (/es-mx|méxico|mexico|mexican/.test(blob)) score = 88;
    else if (/es-us|estados unidos/.test(blob)) score = 82;
    else if (/es-pr|es-cu|es-co|es-ve|es-pa|latino|latina/.test(blob)) score = 80;
    else if (/es-ar|es-cl|es-pe|es-gt|es-hn|es-ni|es-sv|es-uy/.test(blob)) score = 72;
    else if (lang.startsWith('es') || /español|spanish/.test(blob)) score = 45;
    else return 0;

    if (/natural|neural|online/.test(name)) score += 8;
    if (/female|mujer|sabina|dalia|catalina|laura|monica|paulina/.test(name)) score += 3;
    return score;
  }

  private playNuevoTrabajo(): void {
    if (this.mute) return;
    if (this.config && this.config.sonidoActivo === false) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!this.audioCtx) this.audioCtx = new Ctx();
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      // Notificación tipo alerta operativa: 3 pings ascendentes + eco corto
      const notas = [784, 988, 1175]; // G5 – B5 – D6
      const now = ctx.currentTime;
      notas.forEach((freq, i) => {
        const t0 = now + i * 0.16;
        this.tocarPing(ctx, freq, t0, 0.22, 0.18);
        this.tocarPing(ctx, freq * 2, t0, 0.12, 0.05); // armónico agudo
      });
      // Segundo golpe más corto (refuerzo “llegó orden”)
      this.tocarPing(ctx, 1319, now + 0.58, 0.28, 0.16);
    } catch { /* ignore */ }
  }

  private tocarPing(
    ctx: AudioContext,
    frequency: number,
    startAt: number,
    durationSec: number,
    peakGain: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, startAt);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + durationSec + 0.02);
  }

  private prioridadRank(p: string): number {
    if (p === 'Urgente') return 3;
    if (p === 'Alta') return 2;
    return 1;
  }

  private async handleAccionError(err: unknown): Promise<void> {
    if (this.produccion.esConflicto(err)) {
      await this.hydrate(false);
    }
    await this.toast(this.produccion.mensajeError(err), 'danger');
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2800, color, position: 'top' });
    await t.present();
  }
}
