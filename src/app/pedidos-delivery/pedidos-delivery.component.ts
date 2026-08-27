import { Component, OnDestroy, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PedidosOnlineService } from '../servicios/pedidos-online.service';
import { AppConfigService } from '../servicios/app-config.service';
import { UsuariosService } from '../servicios/usuarios.service';
import { ParametrosService } from '../servicios/parametros.service';
import { ToastController } from '@ionic/angular';
import {
  DeliveryRepartidor,
  PedidoDeliveryListado,
  PedidoOnlineCanalEmpresa,
  urlMapaPedido
} from '../models/pedidos-online.models';

type Tab = 'cola' | 'recoger' | 'curso' | 'todos' | 'repartidores';

@Component({
  selector: 'app-pedidos-delivery',
  templateUrl: './pedidos-delivery.component.html',
  styleUrls: ['./pedidos-delivery.component.scss']
})
export class PedidosDeliveryComponent implements OnInit, OnDestroy {
  tab: Tab = 'cola';
  loading = true;
  error = '';
  pedidos: PedidoDeliveryListado[] = [];
  cola: PedidoDeliveryListado[] = [];
  repartidores: DeliveryRepartidor[] = [];
  usuarios: { idusuario?: number; idUsuario?: number; nombre: string; correo: string }[] = [];
  usuarioNuevo = 0;
  canal: PedidoOnlineCanalEmpresa | null = null;
  asignando: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private api: PedidosOnlineService,
    private usuariosApi: UsuariosService,
    private parametros: ParametrosService,
    private config: AppConfigService,
    private toastCtrl: ToastController
  ) {}

  get idEmpresa(): number {
    return Number(this.parametros.IdEmpresa || localStorage.getItem('IdEmpresa') || 0);
  }

  get idUsuario(): number {
    return Number(this.parametros.IdUsuario || localStorage.getItem('IdUsuario') || 0);
  }

  get urlPedir(): string {
    const slug = (this.canal?.slug || '').trim();
    if (!slug) return '';
    return `${this.config.pedirPublicUrl.replace(/\/$/, '')}/${slug}`;
  }

  get urlReparto(): string {
    return this.config.repartoPublicUrl.replace(/\/$/, '');
  }

  get hintPedir(): string {
    const nombre = (this.canal?.nombrePublico || '').trim();
    return nombre
      ? `Envíe este link a sus clientes para que pidan en línea en ${nombre}.`
      : 'Envíe este link a sus clientes para que pidan en línea.';
  }

  get textoPedir(): string {
    const nombre = this.canal?.nombrePublico || 'nuestro menú';
    return `Pide en línea en ${nombre}:`;
  }

  get textoReparto(): string {
    return 'Alahia Reparto — abre esta app e inicia sesión con tu usuario:';
  }

  get recoger(): PedidoDeliveryListado[] {
    return this.pedidos.filter(p =>
      this.esRecoger(p) && (p.estadoCocina === 'LISTA' || p.estadoUnificado === 'Listo')
        && p.estadoLogistico !== 'Entregado' && p.estadoLogistico !== 'Cancelado');
  }

  get enCurso(): PedidoDeliveryListado[] {
    return this.pedidos.filter(p =>
      ['Asignado', 'Recogido', 'EnCamino'].includes(p.estadoLogistico));
  }

  ngOnInit(): void {
    void this.cargar();
    this.timer = setInterval(() => void this.cargar(true), 12000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async cargar(silencio = false): Promise<void> {
    if (!silencio) this.loading = true;
    this.error = '';
    try {
      const [todos, cola, reps, canal] = await Promise.all([
        firstValueFrom(this.api.listar(this.idEmpresa)),
        firstValueFrom(this.api.cola(this.idEmpresa)),
        firstValueFrom(this.api.repartidores(this.idEmpresa)),
        firstValueFrom(this.api.canal(this.idEmpresa)).catch(() => null)
      ]);
      this.pedidos = todos || [];
      this.cola = cola || [];
      this.repartidores = reps || [];
      this.canal = canal;
    } catch (err: any) {
      this.error = err?.error?.message || 'No se pudieron cargar los pedidos.';
    } finally {
      this.loading = false;
    }
  }

  async cargarUsuarios(): Promise<void> {
    try {
      this.usuarios = (await firstValueFrom(this.usuariosApi.getUsuarios(this.idEmpresa))) || [];
    } catch {
      this.usuarios = [];
    }
  }

  esRecoger(p: PedidoDeliveryListado): boolean {
    const t = (p.tipoEntrega || '').toLowerCase();
    return t === 'llevar' || t === 'recoger';
  }

  etiquetaTipo(p: PedidoDeliveryListado): string {
    return this.esRecoger(p) ? 'Recoger' : 'Delivery';
  }

  money(n: number): string {
    return `RD$ ${Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  mapsUrl(p: PedidoDeliveryListado): string | null {
    return urlMapaPedido(p);
  }

  async copiar(url: string, okMsg: string): Promise<void> {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      await this.toast(okMsg);
    } catch {
      await this.toast(url);
    }
  }

  whatsapp(url: string, texto: string): void {
    if (!url) return;
    const msg = `${texto} ${url}`.trim();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  abrir(url: string): void {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  }

  async asignar(p: PedidoDeliveryListado, idUsuarioRepartidor: number): Promise<void> {
    if (!idUsuarioRepartidor) return;
    this.asignando = p.idPedidoOnline;
    try {
      await firstValueFrom(this.api.asignar(this.idEmpresa, {
        idPedidoOnline: p.idPedidoOnline,
        idUsuarioRepartidor,
        idUsuarioAsigna: this.idUsuario
      }));
      await this.cargar(true);
      await this.toast('Pedido asignado');
    } catch (err: any) {
      await this.toast(err?.error?.message || 'No se pudo asignar', 'danger');
    } finally {
      this.asignando = null;
    }
  }

  async altaRepartidor(): Promise<void> {
    if (!this.usuarioNuevo) return;
    try {
      await firstValueFrom(this.api.upsertRepartidor(this.idEmpresa, {
        idUsuario: this.usuarioNuevo,
        disponible: true,
        activo: true
      }));
      this.usuarioNuevo = 0;
      await this.cargar(true);
      await this.toast('Repartidor agregado');
    } catch (err: any) {
      await this.toast(err?.error?.message || 'No se pudo agregar', 'danger');
    }
  }

  async toggleDisponible(r: DeliveryRepartidor): Promise<void> {
    try {
      await firstValueFrom(this.api.upsertRepartidor(this.idEmpresa, {
        idUsuario: r.idUsuario,
        disponible: !r.disponible,
        activo: true
      }));
      await this.cargar(true);
    } catch (err: any) {
      await this.toast(err?.error?.message || 'No se pudo actualizar', 'danger');
    }
  }

  idUsuarioDe(u: { idusuario?: number; idUsuario?: number }): number {
    return Number(u.idusuario ?? u.idUsuario ?? 0);
  }

  private async toast(message: string, color: string = 'success'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2200, color });
    await t.present();
  }
}
