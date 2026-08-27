import { Component, OnDestroy, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../servicios/auth.service';
import { ParametrosService } from '../servicios/parametros.service';
import { PedidosOnlineService } from '../servicios/pedidos-online.service';
import { NotificacionesService } from '../servicios/notificaciones.service';
import { aplicarManifestPwa } from '../servicios/pwa-shell-manifest';
import { PedidoDeliveryListado, urlMapaPedido } from '../models/pedidos-online.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reparto',
  templateUrl: './reparto.component.html',
  styleUrls: ['./reparto.component.scss'],
  host: { class: 'ion-page pwa-shell-page' }
})
export class RepartoComponent implements OnInit, OnDestroy {
  usuario = '';
  password = '';
  loadingLogin = false;
  loading = false;
  error = '';
  okMsg = '';
  pedidos: PedidoDeliveryListado[] = [];
  detalle: PedidoDeliveryListado | null = null;
  accionId: number | null = null;
  private okTimer: ReturnType<typeof setTimeout> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private notifSub?: Subscription;
  private cargaSeq = 0;

  constructor(
    private auth: AuthService,
    private parametros: ParametrosService,
    private api: PedidosOnlineService,
    private notificaciones: NotificacionesService
  ) {}

  get haySesion(): boolean {
    this.parametros.ensureSessionFromStorage();
    return !!(this.parametros.IdUsuario && this.parametros.IdEmpresa);
  }

  get idEmpresa(): number {
    return Number(this.parametros.IdEmpresa || localStorage.getItem('IdEmpresa') || 0);
  }

  get idUsuario(): number {
    return Number(this.parametros.IdUsuario || localStorage.getItem('IdUsuario') || 0);
  }

  ngOnInit(): void {
    aplicarManifestPwa({
      name: 'Alahia Reparto',
      shortName: 'Reparto',
      startUrl: '/reparto',
      scope: '/reparto',
      themeColor: '#1454B8',
      description: 'Pedidos asignados al repartidor'
    });
    if (this.haySesion) {
      void this.iniciar();
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.okTimer) clearTimeout(this.okTimer);
    this.notifSub?.unsubscribe();
  }

  async login(): Promise<void> {
    if (!this.usuario.trim() || !this.password) {
      this.error = 'Usuario y contraseña son obligatorios.';
      return;
    }
    this.loadingLogin = true;
    this.error = '';
    try {
      const deviceId = this.deviceId();
      const resp: any = await firstValueFrom(this.auth.login(this.usuario.trim(), this.password, deviceId));
      if (resp?.errorSesion) {
        this.error = 'Este usuario ya está conectado en otro dispositivo.';
        return;
      }
      if (resp?.requiereUpgrade || resp?.bloqueado) {
        this.error = resp?.mensaje || 'No se puede iniciar sesión ahora.';
        return;
      }
      const empresa = resp?.empresa || {};
      const usuario = resp?.usuario || {};
      const modulosRaw = resp?.modulos || [];
      const modulos = (Array.isArray(modulosRaw) ? modulosRaw : []).map((m: any) => ({
        moduloId: m?.moduloId ?? m?.ModuloId ?? null,
        codigo: String(m?.codigo ?? m?.Codigo ?? '').trim().toUpperCase(),
        nombre: m?.nombre ?? m?.Nombre ?? ''
      })).filter((m: any) => !!m.codigo);

      if (resp?.token) localStorage.setItem('token_sesion', resp.token);
      this.parametros.IdEmpresa = empresa.idEmpresa || 0;
      this.parametros.NombreEmpresa = empresa.nombreComercial || '';
      localStorage.setItem('NombreEmpresa', this.parametros.NombreEmpresa || '');
      localStorage.setItem('menu_modulos', JSON.stringify(modulos));
      this.parametros.setLoginData(
        usuario.userName || this.usuario,
        this.password,
        empresa.idEmpresa || 0,
        resp?.token || '',
        usuario.rol || usuario.nombrePerfil || '',
        usuario.idUsuario || 0,
        usuario
      );
      this.parametros.setModulosActivos(
        modulos.map((m: any) => m.moduloId).filter((id: any) => id != null),
        modulos.map((m: any) => m.codigo).filter((c: string) => !!c)
      );
      await this.iniciar();
    } catch (err: any) {
      this.error = err?.error?.mensaje || err?.error || 'No se pudo iniciar sesión.';
      if (typeof this.error !== 'string') this.error = 'No se pudo iniciar sesión.';
    } finally {
      this.loadingLogin = false;
    }
  }

  salir(): void {
    try {
      if (this.idUsuario) this.auth.logout(this.idUsuario).subscribe({ error: () => undefined });
    } catch { /* ignore */ }
    this.parametros.logout();
    localStorage.removeItem('token_sesion');
    this.pedidos = [];
    this.detalle = null;
    this.okMsg = '';
  }

  async iniciar(): Promise<void> {
    await this.cargar();
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => void this.cargar(true), 8000);
    try {
      await this.notificaciones.start(this.idEmpresa, this.idUsuario);
      this.notifSub?.unsubscribe();
      this.notifSub = this.notificaciones.list$().subscribe(() => void this.cargar(true));
    } catch { /* polling cubre */ }
  }

  async cargar(silencio = false): Promise<void> {
    if (!this.haySesion || this.accionId) return;
    const seq = ++this.cargaSeq;
    if (!silencio) this.loading = true;
    try {
      const pedidos = (await firstValueFrom(this.api.mios(this.idEmpresa, this.idUsuario))) || [];
      if (seq !== this.cargaSeq || this.accionId) return;
      this.pedidos = pedidos;
      if (this.detalle) {
        this.detalle = this.pedidos.find(p => p.idPedidoOnline === this.detalle?.idPedidoOnline) || this.detalle;
      }
    } catch (err: any) {
      if (!silencio) this.error = err?.error?.message || 'No se pudieron cargar los pedidos.';
    } finally {
      if (seq === this.cargaSeq) this.loading = false;
    }
  }

  puedeRecoger(p: PedidoDeliveryListado): boolean {
    return this.normLogistico(p.estadoLogistico) === 'Asignado';
  }

  puedeMarcarEnCamino(p: PedidoDeliveryListado): boolean {
    return this.normLogistico(p.estadoLogistico) === 'Recogido';
  }

  puedeEntregar(p: PedidoDeliveryListado): boolean {
    const e = this.normLogistico(p.estadoLogistico);
    return e === 'Recogido' || e === 'EnCamino';
  }

  hintAccion(p: PedidoDeliveryListado): string {
    const e = this.normLogistico(p.estadoLogistico);
    if (e === 'Asignado') return 'Toque cuando salga del local con el pedido.';
    if (e === 'Recogido') return 'Llévelo al cliente. Cuando lo reciba, toque Ya lo entregué.';
    if (e === 'EnCamino') return 'Toque cuando el cliente reciba el pedido.';
    return '';
  }

  pasoActivo(p: PedidoDeliveryListado): number {
    const e = this.normLogistico(p.estadoLogistico);
    if (e === 'Entregado') return 4;
    if (e === 'EnCamino') return 3;
    if (e === 'Recogido') return 2;
    return 1;
  }

  mapsUrl(p: PedidoDeliveryListado): string | null {
    return urlMapaPedido(p);
  }

  telHref(p: PedidoDeliveryListado): string {
    return `tel:${(p.telefono || '').replace(/\s/g, '')}`;
  }

  money(n: number): string {
    return `RD$ ${Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  abrirDetalle(p: PedidoDeliveryListado): void {
    this.detalle = p;
  }

  volverLista(): void {
    this.detalle = null;
  }

  previewItems(p: PedidoDeliveryListado): string {
    const items = p.items || [];
    if (!items.length) return '';
    const shown = items.slice(0, 2).map(i => `${Number(i.cantidad)}× ${i.nombre}`);
    const extra = items.length > 2 ? ` y ${items.length - 2} más` : '';
    return shown.join(' · ') + extra;
  }

  async transicionar(p: PedidoDeliveryListado, dest: string): Promise<void> {
    if (!dest) return;
    this.accionId = p.idPedidoOnline;
    this.error = '';
    this.cargaSeq++;
    try {
      const updated = await firstValueFrom(this.api.transicionar(this.idEmpresa, p.idPedidoOnline, {
        idUsuario: this.idUsuario,
        estado: dest
      }));
      const numero = p.numeroPedido;
      if (dest === 'Entregado') {
        this.pedidos = this.pedidos.filter(x => x.idPedidoOnline !== p.idPedidoOnline);
        this.detalle = null;
        this.mostrarOk(`Pedido #${numero} entregado.`);
      } else {
        this.pedidos = this.pedidos.map(x => x.idPedidoOnline === updated.idPedidoOnline ? updated : x);
        this.detalle = updated;
        if (dest === 'Recogido') {
          this.mostrarOk('Pedido marcado como recogido. Cuando lo entregue, toque Ya lo entregué.');
        } else {
          this.mostrarOk('En camino. El cliente ya puede ver este estado.');
        }
      }
    } catch (err: any) {
      this.error = err?.error?.message || err?.error?.mensaje || 'No se pudo actualizar el estado.';
      if (typeof this.error !== 'string') this.error = 'No se pudo actualizar el estado.';
    } finally {
      this.accionId = null;
    }
  }

  private mostrarOk(msg: string): void {
    this.okMsg = msg;
    if (this.okTimer) clearTimeout(this.okTimer);
    this.okTimer = setTimeout(() => {
      if (this.okMsg === msg) this.okMsg = '';
    }, 8000);
  }

  private normLogistico(e: string): string {
    const x = (e || '').replace(/\s/g, '').toLowerCase();
    if (x === 'encamino') return 'EnCamino';
    if (x === 'recogido') return 'Recogido';
    if (x === 'asignado') return 'Asignado';
    if (x === 'entregado') return 'Entregado';
    return e || '';
  }

  private deviceId(): string {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('device_id', id);
    }
    return id;
  }
}
