import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AppConfigService } from './app-config.service';
import { NotificacionItem, toastColorPrioridad } from '../models/notificaciones.models';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

const LIST_TOP = 40;

@Injectable({ providedIn: 'root' })
export class NotificacionesService implements OnDestroy {
  private readonly baseUrl: string;
  private readonly hubBase: string;
  private hub?: signalR.HubConnection;

  private unread$ = new BehaviorSubject<number>(0);
  private items$ = new BehaviorSubject<NotificacionItem[]>([]);
  private panelOpen$ = new BehaviorSubject<boolean>(false);

  private idEmpresa = 0;
  private idUsuario = 0;
  private seenIds = new Set<number>();
  private refreshSeq = 0;

  constructor(
    private http: HttpClient,
    private config: AppConfigService,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.baseUrl = `${this.config.apiUrl}/Notificaciones`;
    this.hubBase = this.config.apiUrl.replace(/\/api\/?$/, '');
  }

  unreadCount$(): Observable<number> {
    return this.unread$.asObservable();
  }

  list$(): Observable<NotificacionItem[]> {
    return this.items$.asObservable();
  }

  panelOpenObs$(): Observable<boolean> {
    return this.panelOpen$.asObservable();
  }

  setUnreadCount(n: number) {
    this.unread$.next(Math.max(0, Number(n) || 0));
  }

  seedUnreadFromLogin(n: number) {
    this.setUnreadCount(n);
  }

  togglePanel(open?: boolean) {
    const next = open !== undefined ? open : !this.panelOpen$.value;
    this.panelOpen$.next(next);
    if (next) {
      // Inbox abierto: lista es la verdad del badge (evita badge > 0 con panel vacío)
      void this.refreshList();
    }
  }

  async start(idEmpresa: number, idUsuario: number, unreadFromLogin?: number) {
    this.idEmpresa = Number(idEmpresa) || 0;
    this.idUsuario = Number(idUsuario) || 0;
    this.ensureSession();
    if (!this.idEmpresa) return;

    if (typeof unreadFromLogin === 'number') {
      this.setUnreadCount(unreadFromLogin);
    }

    await this.refreshUnreadCount();
    await this.connectHub();
  }

  async stop() {
    this.panelOpen$.next(false);
    this.items$.next([]);
    this.seenIds.clear();
    this.setUnreadCount(0);
    this.idEmpresa = 0;
    this.idUsuario = 0;
    if (this.hub) {
      try { await this.hub.stop(); } catch { /* ignore */ }
      this.hub = undefined;
    }
  }

  /** Fuente de verdad del badge en reposo: GET /contador */
  async refreshUnreadCount() {
    this.ensureSession();
    if (!this.idEmpresa) return;
    try {
      const res = await firstValueFrom(
        this.http.get<Record<string, unknown>>(`${this.baseUrl}/contador/${this.idEmpresa}`, {
          params: new HttpParams().set('idUsuario', String(this.idUsuario || 0))
        })
      );
      this.setUnreadCount(this.readNoLeidas(res));
    } catch { /* ignore */ }
  }

  async refreshList() {
    this.ensureSession();
    if (!this.idEmpresa) {
      this.items$.next([]);
      this.setUnreadCount(0);
      return;
    }

    const seq = ++this.refreshSeq;
    try {
      const raw = await firstValueFrom(
        this.http.get<unknown>(`${this.baseUrl}/listar/${this.idEmpresa}`, {
          params: new HttpParams()
            .set('idUsuario', String(this.idUsuario || 0))
            .set('soloNoLeidas', 'true')
            .set('top', String(LIST_TOP))
        })
      );
      if (seq !== this.refreshSeq) return;

      const list = this.normalizeList(raw);
      this.items$.next(list);

      // Si trajimos todas las no leídas (o no hay), el badge = lo que ve el usuario
      if (list.length < LIST_TOP) {
        this.setUnreadCount(list.length);
      } else {
        await this.refreshUnreadCount();
      }
    } catch {
      if (seq !== this.refreshSeq) return;
      this.items$.next([]);
      await this.refreshUnreadCount();
    }
  }

  async marcarLeida(n: NotificacionItem) {
    const id = n?.idNotificacion;
    if (!id) return;

    if (!n.leida) {
      try {
        this.ensureSession();
        await firstValueFrom(
          this.http.post(`${this.baseUrl}/${id}/leer`, {}, {
            params: new HttpParams()
              .set('idEmpresa', String(this.idEmpresa))
              .set('idUsuario', String(this.idUsuario || 0))
          })
        );
      } catch { /* ignore */ }
    }

    this.items$.next(this.items$.value.filter(x => x.idNotificacion !== id));
    this.syncBadgeFromInboxOrServer();
  }

  async marcarNoLeida(n: NotificacionItem) {
    if (!n?.idNotificacion || !n.leida) return;
    try {
      this.ensureSession();
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/${n.idNotificacion}/no-leida`, {}, {
          params: new HttpParams()
            .set('idEmpresa', String(this.idEmpresa))
            .set('idUsuario', String(this.idUsuario || 0))
        })
      );
      n.leida = false;
      this.items$.next([n, ...this.items$.value.filter(x => x.idNotificacion !== n.idNotificacion)]);
      await this.refreshUnreadCount();
    } catch { /* ignore */ }
  }

  async archivar(n: NotificacionItem) {
    if (!n?.idNotificacion) return;
    try {
      this.ensureSession();
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/${n.idNotificacion}/archivar`, {}, {
          params: new HttpParams()
            .set('idEmpresa', String(this.idEmpresa))
            .set('idUsuario', String(this.idUsuario || 0))
        })
      );
      this.items$.next(this.items$.value.filter(x => x.idNotificacion !== n.idNotificacion));
      this.syncBadgeFromInboxOrServer();
    } catch { /* ignore */ }
  }

  async marcarTodas() {
    try {
      this.ensureSession();
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/leer-todas`, {}, {
          params: new HttpParams()
            .set('idEmpresa', String(this.idEmpresa))
            .set('idUsuario', String(this.idUsuario || 0))
        })
      );
      this.setUnreadCount(0);
      this.items$.next([]);
    } catch { /* ignore */ }
  }

  async abrirNotificacion(n: NotificacionItem) {
    await this.marcarLeida(n);
    this.togglePanel(false);
    if (n.ruta) {
      this.router.navigateByUrl(n.ruta);
    }
  }

  private syncBadgeFromInboxOrServer() {
    const inbox = this.items$.value;
    if (this.panelOpen$.value && inbox.length < LIST_TOP) {
      this.setUnreadCount(inbox.length);
      return;
    }
    void this.refreshUnreadCount();
  }

  /** Recupera empresa/usuario si start() aún no corrió o se perdió el contexto. */
  private ensureSession() {
    if (this.idEmpresa > 0) return;
    const idEmpresa = Number(localStorage.getItem('IdEmpresa') || 0);
    const idUsuario = Number(localStorage.getItem('IdUsuario') || 0);
    if (idEmpresa > 0) {
      this.idEmpresa = idEmpresa;
      this.idUsuario = idUsuario;
    }
  }

  private readNoLeidas(res: Record<string, unknown> | null | undefined): number {
    if (!res) return 0;
    const raw = res['noLeidas'] ?? res['NoLeidas'] ?? 0;
    return Math.max(0, Number(raw) || 0);
  }

  private normalizeList(raw: unknown): NotificacionItem[] {
    const arr = Array.isArray(raw) ? raw : [];
    return arr
      .map(x => this.normalizeItem(x))
      .filter((x): x is NotificacionItem => !!x);
  }

  private normalizeItem(raw: any): NotificacionItem | null {
    if (!raw || typeof raw !== 'object') return null;
    const idNotificacion = Number(raw.idNotificacion ?? raw.IdNotificacion ?? 0);
    if (!idNotificacion) return null;

    return {
      idNotificacion,
      idEmpresa: Number(raw.idEmpresa ?? raw.IdEmpresa ?? 0),
      destinoTipo: String(raw.destinoTipo ?? raw.DestinoTipo ?? 'EMPRESA'),
      idUsuarioDestino: raw.idUsuarioDestino ?? raw.IdUsuarioDestino ?? null,
      idRolDestino: raw.idRolDestino ?? raw.IdRolDestino ?? null,
      rolCodigo: raw.rolCodigo ?? raw.RolCodigo ?? null,
      tipo: String(raw.tipo ?? raw.Tipo ?? ''),
      prioridad: String(raw.prioridad ?? raw.Prioridad ?? 'INFO'),
      titulo: String(raw.titulo ?? raw.Titulo ?? ''),
      mensaje: String(raw.mensaje ?? raw.Mensaje ?? ''),
      ruta: raw.ruta ?? raw.Ruta ?? null,
      referenciaTipo: raw.referenciaTipo ?? raw.ReferenciaTipo ?? null,
      referenciaId: raw.referenciaId ?? raw.ReferenciaId ?? null,
      leida: !!(raw.leida ?? raw.Leida),
      archivada: !!(raw.archivada ?? raw.Archivada),
      fechaCreacion: String(raw.fechaCreacion ?? raw.FechaCreacion ?? '')
    };
  }

  private esParaMi(payload: NotificacionItem): boolean {
    if (!payload || payload.idEmpresa !== this.idEmpresa) return false;
    const tipo = (payload.destinoTipo || 'EMPRESA').toUpperCase();
    if (tipo === 'USUARIO') {
      return !!payload.idUsuarioDestino && payload.idUsuarioDestino === this.idUsuario;
    }
    return true;
  }

  private async connectHub() {
    if (this.hub) {
      try { await this.hub.stop(); } catch { /* ignore */ }
    }

    const url = `${this.hubBase}/hubs/notificaciones?idEmpresa=${this.idEmpresa}&idUsuario=${this.idUsuario || 0}`;
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .build();

    this.hub.on('notificacion:nueva', async (payload: unknown) => {
      const n = this.normalizeItem(payload);
      if (!n || !this.esParaMi(n)) return;
      if (this.seenIds.has(n.idNotificacion)) return;
      this.seenIds.add(n.idNotificacion);

      // Optimista + reconciliación (evita badge fantasma si el contador real difiere)
      this.setUnreadCount(this.unread$.value + 1);
      if (this.panelOpen$.value && !n.leida) {
        this.items$.next([n, ...this.items$.value.filter(x => x.idNotificacion !== n.idNotificacion)]);
      }
      void this.refreshUnreadCount();

      try {
        const t = await this.toastCtrl.create({
          header: n.titulo,
          message: n.mensaje,
          duration: 3200,
          position: 'top',
          color: toastColorPrioridad(n.prioridad),
          buttons: [{ text: 'Ver', handler: () => this.togglePanel(true) }]
        });
        await t.present();
      } catch { /* ignore */ }
    });

    this.hub.on('notificacion:leida', (payload: unknown) => {
      const raw = payload as any;
      const id = Number(raw?.idNotificacion ?? raw?.IdNotificacion ?? 0);
      if (!id) {
        void this.refreshUnreadCount();
        return;
      }
      this.items$.next(this.items$.value.filter(x => x.idNotificacion !== id));
      this.syncBadgeFromInboxOrServer();
    });

    this.hub.onreconnected(() => {
      void this.refreshUnreadCount();
      if (this.panelOpen$.value) void this.refreshList();
    });

    try {
      await this.hub.start();
    } catch {
      setTimeout(() => this.connectHub(), 5000);
    }
  }

  ngOnDestroy() {
    this.stop();
  }
}
