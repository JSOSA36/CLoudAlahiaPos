import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AppConfigService } from './app-config.service';
import { NotificacionItem, toastColorPrioridad } from '../models/notificaciones.models';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

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
  private seededFromLogin = false;

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
    this.unread$.next(Math.max(0, n || 0));
  }

  seedUnreadFromLogin(n: number) {
    this.seededFromLogin = true;
    this.setUnreadCount(n);
  }

  togglePanel(open?: boolean) {
    const next = open !== undefined ? open : !this.panelOpen$.value;
    this.panelOpen$.next(next);
    if (next) this.refreshList();
  }

  async start(idEmpresa: number, idUsuario: number, unreadFromLogin?: number) {
    this.idEmpresa = idEmpresa;
    this.idUsuario = idUsuario;
    if (!idEmpresa) return;

    if (typeof unreadFromLogin === 'number') {
      this.setUnreadCount(unreadFromLogin);
      this.seededFromLogin = false;
    } else if (!this.seededFromLogin) {
      try {
        const res = await firstValueFrom(
          this.http.get<{ noLeidas: number }>(`${this.baseUrl}/contador/${idEmpresa}`, {
            params: new HttpParams().set('idUsuario', String(idUsuario || 0))
          })
        );
        this.setUnreadCount(res?.noLeidas ?? 0);
      } catch { /* ignore */ }
    } else {
      this.seededFromLogin = false;
    }

    await this.connectHub();
  }

  async stop() {
    this.panelOpen$.next(false);
    this.items$.next([]);
    this.seenIds.clear();
    this.setUnreadCount(0);
    if (this.hub) {
      try { await this.hub.stop(); } catch { /* ignore */ }
      this.hub = undefined;
    }
  }

  async refreshList() {
    if (!this.idEmpresa) return;
    try {
      const list = await firstValueFrom(
        this.http.get<NotificacionItem[]>(`${this.baseUrl}/listar/${this.idEmpresa}`, {
          params: new HttpParams()
            .set('idUsuario', String(this.idUsuario || 0))
            .set('soloNoLeidas', 'true')
            .set('top', '40')
        })
      );
      this.items$.next(list || []);
    } catch {
      this.items$.next([]);
    }
  }

  async marcarLeida(n: NotificacionItem) {
    if (!n.leida) {
      try {
        await firstValueFrom(
          this.http.post(`${this.baseUrl}/${n.idNotificacion}/leer`, {}, {
            params: new HttpParams()
              .set('idEmpresa', String(this.idEmpresa))
              .set('idUsuario', String(this.idUsuario || 0))
          })
        );
        this.setUnreadCount(this.unread$.value - 1);
      } catch { /* ignore */ }
    }
    // Inbox = solo no leídas: al leer, sale del panel (sigue en BD)
    this.items$.next(this.items$.value.filter(x => x.idNotificacion !== n.idNotificacion));
  }

  async marcarNoLeida(n: NotificacionItem) {
    if (n.leida) {
      try {
        await firstValueFrom(
          this.http.post(`${this.baseUrl}/${n.idNotificacion}/no-leida`, {}, {
            params: new HttpParams()
              .set('idEmpresa', String(this.idEmpresa))
              .set('idUsuario', String(this.idUsuario || 0))
          })
        );
        this.setUnreadCount(this.unread$.value + 1);
        n.leida = false;
        this.items$.next([n, ...this.items$.value.filter(x => x.idNotificacion !== n.idNotificacion)]);
      } catch { /* ignore */ }
    }
  }

  async archivar(n: NotificacionItem) {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/${n.idNotificacion}/archivar`, {}, {
          params: new HttpParams()
            .set('idEmpresa', String(this.idEmpresa))
            .set('idUsuario', String(this.idUsuario || 0))
        })
      );
      if (!n.leida) this.setUnreadCount(this.unread$.value - 1);
      this.items$.next(this.items$.value.filter(x => x.idNotificacion !== n.idNotificacion));
    } catch { /* ignore */ }
  }

  async marcarTodas() {
    try {
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

  private esParaMi(payload: NotificacionItem): boolean {
    if (!payload || payload.idEmpresa !== this.idEmpresa) return false;
    const tipo = (payload.destinoTipo || 'EMPRESA').toUpperCase();
    if (tipo === 'USUARIO') {
      return !!payload.idUsuarioDestino && payload.idUsuarioDestino === this.idUsuario;
    }
    // EMPRESA y ROL (filtro fino de rol pendiente)
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

    this.hub.on('notificacion:nueva', async (payload: NotificacionItem) => {
      if (!this.esParaMi(payload)) return;
      if (this.seenIds.has(payload.idNotificacion)) return;
      this.seenIds.add(payload.idNotificacion);

      this.setUnreadCount(this.unread$.value + 1);
      this.items$.next([payload, ...this.items$.value.filter(x => x.idNotificacion !== payload.idNotificacion)]);

      try {
        const t = await this.toastCtrl.create({
          header: payload.titulo,
          message: payload.mensaje,
          duration: 3200,
          position: 'top',
          color: toastColorPrioridad(payload.prioridad),
          buttons: [{ text: 'Ver', handler: () => this.togglePanel(true) }]
        });
        await t.present();
      } catch { /* ignore */ }
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
