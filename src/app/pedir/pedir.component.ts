import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PedidosOnlineService } from '../servicios/pedidos-online.service';
import { aplicarManifestPwa } from '../servicios/pwa-shell-manifest';
import {
  PedidoOnlineConfirmacion,
  PedidoOnlineHistorialItem,
  PedidoOnlineLineaCarrito,
  PedidoOnlineMenu,
  PedidoOnlineProducto,
  PedidoOnlineSeguimiento
} from '../models/pedidos-online.models';

type Paso = 'menu' | 'carrito' | 'checkout' | 'ok' | 'cuenta' | 'historial';

@Component({
  selector: 'app-pedir',
  templateUrl: './pedir.component.html',
  styleUrls: ['./pedir.component.scss'],
  host: { class: 'ion-page pwa-shell-page' }
})
export class PedirComponent implements OnInit, OnDestroy {
  slug = '';
  loading = true;
  enviando = false;
  error = '';
  menu: PedidoOnlineMenu | null = null;
  categoriaId: number | null = null;
  busqueda = '';
  carrito: PedidoOnlineLineaCarrito[] = [];
  paso: Paso = 'menu';

  nombre = '';
  telefono = '';
  telefonoInput = '';
  cuentaVinculada = false;
  tipoEntrega: 'Delivery' | 'Recoger' = 'Delivery';
  direccion = '';
  referencia = '';
  metodoPago = 'Efectivo';
  observacion = '';
  confirmacion: PedidoOnlineConfirmacion | null = null;
  seguimiento: PedidoOnlineSeguimiento | null = null;
  metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];
  latitud: number | null = null;
  longitud: number | null = null;
  ubicacionEstado: 'idle' | 'pidiendo' | 'ok' | 'denegado' | 'error' = 'idle';
  editandoDatos = false;
  historial: PedidoOnlineHistorialItem[] = [];
  cargandoCuenta = false;
  guardandoDir = false;

  private idempotencyKey = '';
  private poll: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: PedidosOnlineService
  ) {}

  ngOnInit(): void {
    this.slug = (this.route.snapshot.paramMap.get('slug') || '').trim().toLowerCase();
    this.cargar();
  }

  ngOnDestroy(): void {
    this.detenerPoll();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.menu = await firstValueFrom(this.api.menu(this.slug));
      this.aplicarPwa();
      this.restaurarCliente();
      await this.sincronizarPerfil();
      await this.cargarHistorial();
      await this.restaurarUltimoPedido();
      this.asegurarPedidoActivoDesdeHistorial();
      if (this.pedidoActivo) this.iniciarPoll();
    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'Este negocio no tiene pedidos en línea.';
      this.menu = null;
    } finally {
      this.loading = false;
    }
  }

  get tituloNegocio(): string {
    if (this.menu?.nombrePublico) return this.menu.nombrePublico;
    if (this.loading) return 'Cargando…';
    return 'Alahia Pedir';
  }

  get productosFiltrados(): PedidoOnlineProducto[] {
    const list = this.menu?.productos || [];
    const q = this.busqueda.trim().toLowerCase();
    return list.filter(p => {
      if (this.categoriaId && p.idCategoria !== this.categoriaId) return false;
      if (q && !(`${p.nombre} ${p.descripcion || ''}`).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  get itemsCount(): number {
    return this.carrito.reduce((s, l) => s + l.cantidad, 0);
  }

  get total(): number {
    return this.carrito.reduce((s, l) => s + l.precioConItbis * l.cantidad, 0);
  }

  seleccionarCategoria(id: number | null): void {
    this.categoriaId = id;
  }

  qtyEnCarrito(idProducto: number): number {
    return this.carrito.find(l => l.idProducto === idProducto)?.cantidad || 0;
  }

  agregar(p: PedidoOnlineProducto): void {
    const row = this.carrito.find(l => l.idProducto === p.idProducto);
    if (row) {
      row.cantidad += 1;
    } else {
      this.carrito.push({
        idProducto: p.idProducto,
        nombre: p.nombre,
        precioConItbis: p.precioConItbis,
        cantidad: 1,
        observacion: ''
      });
    }
    this.nuevaClave();
  }

  incrementar(idProducto: number): void {
    const row = this.carrito.find(l => l.idProducto === idProducto);
    if (row) {
      row.cantidad += 1;
      this.nuevaClave();
    }
  }

  quitar(idProducto: number): void {
    const row = this.carrito.find(l => l.idProducto === idProducto);
    if (!row) return;
    row.cantidad -= 1;
    if (row.cantidad <= 0) {
      this.carrito = this.carrito.filter(l => l.idProducto !== idProducto);
    }
    this.nuevaClave();
  }

  irCarrito(): void {
    if (!this.carrito.length) return;
    this.paso = 'carrito';
  }

  irCheckout(): void {
    if (!this.carrito.length) return;
    this.paso = 'checkout';
    this.editandoDatos = !this.datosRecordados;
    if (this.tipoEntrega === 'Delivery' && this.ubicacionEstado !== 'ok') {
      void this.pedirUbicacion();
    }
  }

  setTipoEntrega(tipo: 'Delivery' | 'Recoger'): void {
    this.tipoEntrega = tipo;
    if (tipo === 'Delivery' && this.ubicacionEstado !== 'ok') {
      void this.pedirUbicacion();
    }
  }

  get etiquetaUbicacion(): string {
    if (this.ubicacionEstado === 'pidiendo') return 'Obteniendo ubicación…';
    if (this.ubicacionEstado === 'ok') return 'Ubicación compartida ✓';
    return 'Compartir mi ubicación';
  }

  pedirUbicacion(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.ubicacionEstado = 'error';
      return Promise.resolve();
    }
    this.ubicacionEstado = 'pidiendo';
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.latitud = pos.coords.latitude;
          this.longitud = pos.coords.longitude;
          this.ubicacionEstado = 'ok';
          resolve();
        },
        err => {
          this.ubicacionEstado = err?.code === 1 ? 'denegado' : 'error';
          resolve();
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
      );
    });
  }

  volverMenu(): void {
    this.paso = 'menu';
    if (this.cuentaVinculada) void this.cargarHistorial();
  }

  get telefonoVinculado(): boolean {
    return this.soloDigitos(this.telefono).length >= 10;
  }

  get datosRecordados(): boolean {
    if (!this.nombre.trim() || this.soloDigitos(this.telefono).length < 10) return false;
    if (this.tipoEntrega === 'Delivery' && !this.direccion.trim()) return false;
    return true;
  }

  get pedidoActivo(): boolean {
    const u = this.seguimiento?.estadoUnificado || this.confirmacion?.estadoUnificado || this.confirmacion?.estado || '';
    return !!this.confirmacion && this.esPedidoEnCurso(u);
  }

  get pedidosEnCurso(): PedidoOnlineHistorialItem[] {
    const vivos = (this.historial || []).filter(p => this.esPedidoEnCurso(p.estadoUnificado));
    if (vivos.length) return vivos;
    if (this.pedidoActivo && this.confirmacion) {
      return [{
        idPedidoOnline: this.confirmacion.idPedidoOnline,
        numeroPedido: this.confirmacion.numeroPedido,
        tipoEntrega: this.confirmacion.tipoEntrega,
        estadoUnificado: this.confirmacion.estadoUnificado || this.confirmacion.estado || '',
        mensaje: this.confirmacion.mensaje || this.mensajeSeguimiento,
        total: this.confirmacion.total,
        fecha: this.confirmacion.fecha,
        items: []
      }];
    }
    return [];
  }

  get pedidosAnteriores(): PedidoOnlineHistorialItem[] {
    return (this.historial || []).filter(p => !this.esPedidoEnCurso(p.estadoUnificado));
  }

  irCuenta(): void {
    this.paso = 'cuenta';
    this.error = '';
    if (this.cuentaVinculada) {
      void this.sincronizarPerfil();
      void this.cargarHistorial();
    }
  }

  irHistorial(): void {
    this.paso = 'historial';
    this.error = '';
    void this.cargarHistorial();
  }

  async vincularTelefono(): Promise<void> {
    const tel = (this.telefonoInput || this.telefono).trim();
    if (this.soloDigitos(tel).length < 10) {
      this.error = 'Indique un celular válido (10 dígitos).';
      return;
    }
    this.telefono = tel;
    this.error = '';
    this.cargandoCuenta = true;
    try {
      await this.sincronizarPerfil();
      this.cuentaVinculada = true;
      this.guardarCliente();
      await this.cargarHistorial();
    } finally {
      this.cargandoCuenta = false;
    }
  }

  cambiarTelefono(): void {
    this.nombre = '';
    this.telefono = '';
    this.telefonoInput = '';
    this.direccion = '';
    this.referencia = '';
    this.historial = [];
    this.cuentaVinculada = false;
    this.editandoDatos = true;
    try {
      localStorage.removeItem('pedir_cliente');
      localStorage.removeItem(`pedir_ultimo_${this.slug}`);
    } catch { /* ignore */ }
  }

  async guardarDireccion(): Promise<void> {
    if (this.tipoEntrega === 'Delivery' && !this.direccion.trim()) {
      this.error = 'Indique la dirección.';
      return;
    }
    this.error = '';
    this.guardandoDir = true;
    try {
      this.guardarCliente();
      if (this.telefonoVinculado) {
        try {
          await firstValueFrom(this.api.guardarPerfil(this.slug, {
            telefono: this.telefono.trim(),
            nombre: this.nombre.trim() || undefined,
            direccion: this.direccion.trim() || undefined,
            referencia: this.referencia.trim() || undefined,
            latitud: this.latitud ?? undefined,
            longitud: this.longitud ?? undefined
          }));
        } catch { /* se guarda en el dispositivo igual */ }
      }
      this.paso = 'menu';
    } finally {
      this.guardandoDir = false;
    }
  }

  async abrirPedidoHistorial(p: PedidoOnlineHistorialItem): Promise<void> {
    this.confirmacion = {
      idPedidoOnline: p.idPedidoOnline,
      idFacturaHeader: 0,
      numeroPedido: p.numeroPedido,
      total: p.total,
      tipoEntrega: p.tipoEntrega === 'Llevar' ? 'Recoger' : 'Delivery',
      estado: p.estadoUnificado,
      estadoUnificado: p.estadoUnificado,
      mensaje: p.mensaje,
      fecha: p.fecha
    };
    this.paso = 'ok';
    void this.iniciarSeguimiento();
  }

  etiquetaEstado(estado: string): string {
    if (estado === 'Nuevo') return 'Recibido';
    if (estado === 'En preparación') return 'En preparación';
    if (estado === 'Listo') return 'Listo para recoger';
    if (estado === 'Pendiente de asignación' || estado === 'Asignado a delivery' || estado === 'Recogido' || estado === 'En camino') {
      return 'En camino';
    }
    if (estado === 'Entregado') return 'Entregado';
    if (estado === 'Cancelado') return 'Cancelado';
    return estado || 'En proceso';
  }

  claseEstado(estado: string): string {
    if (estado === 'Cancelado') return 'st-cancel';
    if (estado === 'Entregado') return 'st-ok';
    if (estado === 'En camino' || estado === 'Recogido' || estado === 'Asignado a delivery' || estado === 'Pendiente de asignación') {
      return 'st-go';
    }
    if (estado === 'En preparación' || estado === 'Nuevo') return 'st-cook';
    return 'st-wait';
  }

  previewHistorial(p: PedidoOnlineHistorialItem): string {
    const items = p.items || [];
    if (!items.length) return '';
    const extra = items.length > 1 ? ` · +${items.length - 1} más` : '';
    return `${Number(items[0].cantidad)}× ${items[0].nombre}${extra}`;
  }

  private async sincronizarPerfil(): Promise<void> {
    if (!this.telefonoVinculado) return;
    try {
      const perfil = await firstValueFrom(this.api.perfil(this.slug, this.telefono));
      if (perfil.nombre) this.nombre = perfil.nombre;
      this.telefono = perfil.telefono || this.telefono;
      if (perfil.direccion) this.direccion = perfil.direccion;
      if (perfil.referencia) this.referencia = perfil.referencia;
      if (perfil.latitud && perfil.longitud) {
        this.latitud = Number(perfil.latitud);
        this.longitud = Number(perfil.longitud);
        this.ubicacionEstado = 'ok';
      }
      this.guardarCliente();
    } catch { /* teléfono nuevo en este negocio */ }
  }

  private async cargarHistorial(): Promise<void> {
    if (!this.telefonoVinculado) {
      this.historial = [];
      return;
    }
    try {
      this.historial = (await firstValueFrom(this.api.misPedidos(this.slug, this.telefono))) || [];
    } catch {
      this.historial = [];
    }
  }

  async enviar(): Promise<void> {
    if (this.enviando) return;
    const nombre = this.nombre.trim();
    const telefono = this.telefono.trim();
    if (nombre.length < 2) {
      this.error = 'Indique su nombre.';
      return;
    }
    if (this.soloDigitos(telefono).length < 10) {
      this.error = 'Indique un teléfono válido (10 dígitos).';
      return;
    }
    if (this.tipoEntrega === 'Delivery' && !this.direccion.trim()) {
      this.error = 'La dirección es obligatoria para delivery.';
      return;
    }
    if (!this.carrito.length) {
      this.error = 'Agregue al menos un producto.';
      return;
    }

    this.enviando = true;
    this.error = '';
    if (!this.idempotencyKey) this.nuevaClave();
    try {
      this.confirmacion = await firstValueFrom(this.api.crearPedido(this.slug, {
        nombre,
        telefono,
        tipoEntrega: this.tipoEntrega,
        direccion: this.tipoEntrega === 'Delivery' ? this.direccion.trim() : undefined,
        referencia: this.referencia.trim() || undefined,
        metodoPago: this.metodoPago,
        observacion: this.observacion.trim() || undefined,
        idempotencyKey: this.idempotencyKey,
        latitud: this.tipoEntrega === 'Delivery' ? this.latitud ?? undefined : undefined,
        longitud: this.tipoEntrega === 'Delivery' ? this.longitud ?? undefined : undefined,
        lineas: this.carrito.map(l => ({
          idProducto: l.idProducto,
          cantidad: l.cantidad,
          observacion: l.observacion.trim() || undefined
        }))
      }));
      this.guardarCliente();
      this.cuentaVinculada = true;
      this.guardarUltimoPedido();
      this.carrito = [];
      this.paso = 'ok';
      void this.iniciarSeguimiento();
    } catch (err: any) {
      this.error = err?.error?.message || 'No se pudo enviar el pedido. Intente de nuevo.';
    } finally {
      this.enviando = false;
    }
  }

  nuevoPedido(): void {
    this.detenerPoll();
    this.observacion = '';
    this.paso = 'menu';
    this.nuevaClave();
  }

  verSeguimiento(): void {
    if (!this.confirmacion) return;
    this.paso = 'ok';
    void this.iniciarSeguimiento();
  }

  get mensajeSeguimiento(): string {
    return this.seguimiento?.mensaje
      || this.confirmacion?.mensaje
      || 'Recibimos tu pedido. La cocina ya lo tiene.';
  }

  get pasosTrack(): { label: string; state: 'done' | 'now' | 'wait' }[] {
    const tipo = this.seguimiento?.tipoEntrega || this.confirmacion?.tipoEntrega || this.tipoEntrega;
    const recoger = this.esRecogerTipo(tipo);
    const u = this.seguimiento?.estadoUnificado || this.confirmacion?.estadoUnificado || this.confirmacion?.estado || 'Nuevo';
    const idx = this.indiceTrack(u, !recoger);
    const labels = recoger
      ? ['Recibido', 'En preparación', 'Listo para recoger']
      : ['Recibido', 'En preparación', 'En camino', 'Entregado'];
    return labels.map((label, i) => ({
      label,
      state: i < idx ? 'done' : i === idx ? 'now' : 'wait'
    }));
  }

  money(n: number): string {
    return `RD$ ${Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  waHref(): string | null {
    const wa = (this.menu?.whatsApp || '').replace(/\D/g, '');
    if (!wa) return null;
    const num = this.confirmacion?.numeroPedido || '';
    const text = encodeURIComponent(`Hola, hice un pedido${num ? ' #' + num : ''} en ${this.menu?.nombrePublico || ''}.`);
    return `https://wa.me/${wa}?text=${text}`;
  }

  private aplicarPwa(): void {
    const nombre = this.menu?.nombrePublico || 'Pedir';
    aplicarManifestPwa({
      name: nombre,
      shortName: nombre,
      startUrl: `/pedir/${this.slug}`,
      scope: '/pedir/',
      themeColor: '#1454B8',
      description: `Pide en ${nombre}`
    });
  }

  private nuevaClave(): void {
    this.idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `po-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private soloDigitos(s: string): string {
    return (s || '').replace(/\D/g, '');
  }

  private guardarCliente(): void {
    try {
      localStorage.setItem('pedir_cliente', JSON.stringify({
        nombre: this.nombre.trim(),
        telefono: this.telefono.trim(),
        direccion: this.direccion.trim(),
        referencia: this.referencia.trim()
      }));
    } catch { /* ignore */ }
  }

  private guardarUltimoPedido(): void {
    if (!this.confirmacion) return;
    try {
      localStorage.setItem(`pedir_ultimo_${this.slug}`, JSON.stringify({
        idPedidoOnline: this.confirmacion.idPedidoOnline,
        telefono: this.telefono.trim(),
        numeroPedido: this.confirmacion.numeroPedido
      }));
    } catch { /* ignore */ }
  }

  private async restaurarUltimoPedido(): Promise<void> {
    try {
      const raw = localStorage.getItem(`pedir_ultimo_${this.slug}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      const id = Number(data.idPedidoOnline);
      const tel = String(data.telefono || this.telefono || '');
      if (!id || this.soloDigitos(tel).length < 10) return;
      this.telefono = tel || this.telefono;
      this.seguimiento = await firstValueFrom(this.api.seguimiento(this.slug, id, tel));
      this.confirmacion = {
        idPedidoOnline: this.seguimiento.idPedidoOnline,
        idFacturaHeader: 0,
        numeroPedido: this.seguimiento.numeroPedido,
        total: this.seguimiento.total,
        tipoEntrega: this.seguimiento.tipoEntrega === 'Llevar' ? 'Recoger' : 'Delivery',
        estado: this.seguimiento.estadoUnificado,
        estadoUnificado: this.seguimiento.estadoUnificado,
        mensaje: this.seguimiento.mensaje,
        fecha: this.seguimiento.fecha
      };
      const fin = ['Entregado', 'Cancelado'].includes(this.seguimiento.estadoUnificado);
      if (!fin) this.iniciarPoll();
    } catch { /* ignore */ }
  }

  private async iniciarSeguimiento(): Promise<void> {
    await this.refrescarSeguimiento();
    this.iniciarPoll();
  }

  private iniciarPoll(): void {
    this.detenerPoll();
    this.poll = setInterval(() => void this.refrescarSeguimiento(), 5000);
  }

  private detenerPoll(): void {
    if (this.poll) {
      clearInterval(this.poll);
      this.poll = null;
    }
  }

  private async refrescarSeguimiento(): Promise<void> {
    if (this.cuentaVinculada) await this.cargarHistorial();
    if (!this.confirmacion && this.pedidosEnCurso.length) {
      this.asegurarPedidoActivoDesdeHistorial();
    }
    if (!this.confirmacion) return;
    try {
      this.seguimiento = await firstValueFrom(this.api.seguimiento(
        this.slug,
        this.confirmacion.idPedidoOnline,
        this.telefono
      ));
      this.confirmacion.estado = this.seguimiento.estadoUnificado;
      this.confirmacion.estadoUnificado = this.seguimiento.estadoUnificado;
      this.confirmacion.mensaje = this.seguimiento.mensaje;
      this.historial = this.historial.map(h =>
        h.idPedidoOnline === this.seguimiento!.idPedidoOnline
          ? { ...h, estadoUnificado: this.seguimiento!.estadoUnificado, mensaje: this.seguimiento!.mensaje }
          : h
      );
      if (['Entregado', 'Cancelado'].includes(this.seguimiento.estadoUnificado)) {
        this.detenerPoll();
      }
    } catch { /* ignore */ }
  }

  private esRecogerTipo(tipo: string): boolean {
    const t = (tipo || '').toLowerCase();
    return t === 'llevar' || t === 'recoger';
  }

  private indiceTrack(estado: string, delivery: boolean): number {
    if (estado === 'Cancelado') return -1;
    if (estado === 'Entregado') return delivery ? 3 : 2;
    if (estado === 'Listo') return 2;
    if (estado === 'En camino' || estado === 'Asignado a delivery' || estado === 'Recogido' || estado === 'Pendiente de asignación') {
      return delivery ? 2 : 1;
    }
    if (estado === 'En preparación') return 1;
    return 0;
  }

  private esPedidoEnCurso(estado: string): boolean {
    return !!estado && !['Entregado', 'Cancelado'].includes(estado);
  }

  private asegurarPedidoActivoDesdeHistorial(): void {
    if (this.pedidoActivo) return;
    const p = (this.historial || []).find(x => this.esPedidoEnCurso(x.estadoUnificado));
    if (!p) return;
    this.confirmacion = {
      idPedidoOnline: p.idPedidoOnline,
      idFacturaHeader: 0,
      numeroPedido: p.numeroPedido,
      total: p.total,
      tipoEntrega: p.tipoEntrega === 'Llevar' ? 'Recoger' : 'Delivery',
      estado: p.estadoUnificado,
      estadoUnificado: p.estadoUnificado,
      mensaje: p.mensaje,
      fecha: p.fecha
    };
  }

  private restaurarCliente(): void {
    try {
      const raw = localStorage.getItem('pedir_cliente');
      if (!raw) return;
      const data = JSON.parse(raw);
      this.nombre = data.nombre || '';
      this.telefono = data.telefono || '';
      this.direccion = data.direccion || '';
      this.referencia = data.referencia || '';
      this.cuentaVinculada = this.soloDigitos(this.telefono).length >= 10;
    } catch { /* ignore */ }
  }
}
