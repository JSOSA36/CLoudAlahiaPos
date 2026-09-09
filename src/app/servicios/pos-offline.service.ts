import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { crearGuidCobro, esErrorRedCobro } from './cobro-idempotencia';
import { FacturaHeaderService } from './factura-header.service';
import { MetodoPagoCuentaService } from './metodo-pago-cuenta.service';
import { ClienteService } from './cliente.service';
import { categorias } from '../models/categorias';
import { productos } from '../models/productos';
import { facturaheader } from '../models/facturaheader';

export const NOTA_TICKET_LOCAL =
  'Documento local. Se registrará en el ERP al reconectar.';

export type PosColaTipo = 'orden' | 'factura';
export type PosColaEstado = 'pendiente' | 'error' | 'sincronizado';

export interface PosSecuenciaCache {
  idTipoDocumento: number;
  prefijo: string;
  secuenciaActual: number;
}

export interface PosColaItem {
  id: string;
  idEmpresa: number;
  tipo: PosColaTipo;
  estado: PosColaEstado;
  creado: string;
  idLocal: number;
  payload: any;
  ticket?: any;
  error?: string;
}

export interface PosOfflineEstado {
  modoLocal: boolean;
  pendientes: number;
  sincronizando: boolean;
}

const DB_NAME = 'alahia-pos-offline';
const DB_VERSION = 1;
const STORE_KV = 'kv';
const STORE_COLA = 'cola';

@Injectable({ providedIn: 'root' })
export class PosOfflineService implements OnDestroy {
  private idEmpresa = 0;
  private apiOk = typeof navigator === 'undefined' ? true : navigator.onLine;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private onOnlineCb?: () => void;
  private boundOnline = () => this.marcarApi(true);
  private boundOffline = () => this.marcarApi(false);

  readonly estado$ = new BehaviorSubject<PosOfflineEstado>({
    modoLocal: false,
    pendientes: 0,
    sincronizando: false
  });

  get modoLocal(): boolean {
    return this.habilitado && this.estado$.value.modoLocal;
  }

  private get habilitado(): boolean {
    return this.appConfig.posOfflineHabilitado === true;
  }

  constructor(
    private appConfig: AppConfigService,
    private facturaHeader: FacturaHeaderService,
    private metodosPago: MetodoPagoCuentaService,
    private clientes: ClienteService
  ) {}

  start(idEmpresa: number, onOnline?: () => void): void {
    if (!this.habilitado) {
      return;
    }
    this.idEmpresa = idEmpresa;
    this.onOnlineCb = onOnline;
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('online', this.boundOnline);
    window.addEventListener('offline', this.boundOffline);
    if (!navigator.onLine) {
      this.marcarApi(false);
    }
    void this.refrescarPendientes();
    void this.purgarSincronizados();
    if (!this.syncTimer) {
      this.syncTimer = setInterval(() => {
        if (this.apiOk) {
          void this.sincronizar();
        }
      }, 15 * 60 * 1000);
    }
  }

  stop(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.removeEventListener('online', this.boundOnline);
    window.removeEventListener('offline', this.boundOffline);
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  marcarApi(ok: boolean): void {
    if (!this.habilitado) {
      return;
    }
    const wasOk = this.apiOk;
    this.apiOk = ok;
    this.emitEstado();
    if (ok && !wasOk) {
      this.onOnlineCb?.();
      void this.sincronizar();
    }
  }

  async guardarCatalogo(
    idEmpresa: number,
    cats: categorias[],
    prods: productos[]
  ): Promise<void> {
    await this.putKv(`cat:${idEmpresa}`, cats || []);
    await this.putKv(`prod:${idEmpresa}`, prods || []);
    await this.putKv(`meta:${idEmpresa}`, { guardado: new Date().toISOString() });
  }

  async leerCatalogo(idEmpresa: number): Promise<{
    categorias: categorias[];
    productos: productos[];
  } | null> {
    const cats = await this.getKv<categorias[]>(`cat:${idEmpresa}`);
    const prods = await this.getKv<productos[]>(`prod:${idEmpresa}`);
    if (!cats?.length && !prods?.length) {
      return null;
    }
    return { categorias: cats || [], productos: prods || [] };
  }

  async guardarMetodos(idEmpresa: number, metodos: any[]): Promise<void> {
    await this.putKv(`metodos:${idEmpresa}`, metodos || []);
  }

  async leerMetodos(idEmpresa: number): Promise<any[]> {
    return (await this.getKv<any[]>(`metodos:${idEmpresa}`)) || [];
  }

  async guardarClientes(idEmpresa: number, lista: any[]): Promise<void> {
    const lite = (lista || []).slice(0, 400).map((c: any) => ({
      idCliente: c.idCliente || c.id,
      id: c.idCliente || c.id,
      nombreComercial: c.nombreComercial || c.nombre,
      nombre: c.nombreComercial || c.nombre,
      cedulaRNC: c.cedulaRNC || c.rnc || '',
      telefono: c.telefono || c.celular || '',
      celular: c.celular || c.telefono || ''
    }));
    await this.putKv(`clientes:${idEmpresa}`, lite);
  }

  async buscarClientes(idEmpresa: number, texto: string): Promise<any[]> {
    const q = (texto || '').trim().toLowerCase();
    if (!q) {
      return [];
    }
    const lista = (await this.getKv<any[]>(`clientes:${idEmpresa}`)) || [];
    return lista.filter(c =>
      String(c.nombreComercial || c.nombre || '').toLowerCase().includes(q)
      || String(c.telefono || '').includes(q)
      || String(c.celular || '').includes(q)
      || String(c.cedulaRNC || '').includes(q)
    ).slice(0, 30);
  }

  async refrescarApoyos(idEmpresa: number): Promise<void> {
    try {
      const metodos = await firstValueFrom(this.metodosPago.getByEmpresa(idEmpresa));
      await this.guardarMetodos(idEmpresa, (metodos || []).filter((x: any) => x.activo));
      this.marcarApi(true);
    } catch {
      this.marcarApi(false);
    }
    try {
      const lista = await firstValueFrom(this.clientes.GetListadoClientes(idEmpresa));
      await this.guardarClientes(idEmpresa, lista || []);
    } catch {
      /* catálogo de clientes es apoyo; no fuerza modo local si el POS ya cargó */
    }
    await this.refrescarSecuencias(idEmpresa);
  }

  async refrescarSecuencias(idEmpresa: number): Promise<void> {
    if (!this.habilitado || !idEmpresa) {
      return;
    }
    try {
      const lista = await firstValueFrom(
        this.facturaHeader.getSecuenciasDocumento(idEmpresa)
      );
      await this.mergeSecuenciasServidor(idEmpresa, lista || []);
    } catch {
      /* se conserva la caché local */
    }
  }

  sinFiscal(dto: any): any {
    const copia = JSON.parse(JSON.stringify(dto || {}));
    if (copia.header) {
      copia.header.tipoComprobante = 'FACT';
      if (Number(copia.header.idFacturaHeader) < 0) {
        copia.header.idFacturaHeader = 0;
      }
    }
    if (copia.tipoComprobante) {
      copia.tipoComprobante = 'FACT';
    }
    delete copia.tipoEcfDgii;
    return copia;
  }

  async encolarOrden(idEmpresa: number, header: any, ticket?: any, idLocalExistente?: number): Promise<PosColaItem> {
    if (!this.habilitado) {
      throw new Error('Modo local deshabilitado');
    }
    const existente = idLocalExistente && idLocalExistente < 0
      ? await this.buscarPorIdLocal(idEmpresa, idLocalExistente)
      : null;
    const idTipo = Number(header?.idTipoDocumentos) === 2 ? 2 : 10;
    const numeroPrevio =
      existente?.payload?.numeroDocumento ||
      existente?.ticket?.numeroDocumento ||
      header?.numeroDocumento ||
      ticket?.numeroDocumento;
    const numero = this.esNumeroDocumentoRaro(numeroPrevio)
      ? await this.tomarSiguienteNumero(idEmpresa, idTipo)
      : String(numeroPrevio).trim();
    const ticketFinal = {
      ...(ticket || existente?.ticket || {}),
      numeroDocumento: numero
    };
    const payload = this.clonar(header || {});
    payload.idFacturaHeader = 0;
    payload.numeroDocumento = numero;
    const item: PosColaItem = existente
      ? {
          ...existente,
          payload,
          ticket: ticketFinal,
          estado: 'pendiente',
          error: undefined
        }
      : {
          id: crearGuidCobro(),
          idEmpresa,
          tipo: 'orden',
          estado: 'pendiente',
          creado: new Date().toISOString(),
          idLocal: this.nuevoIdLocal(),
          payload,
          ticket: ticketFinal
        };
    await this.putCola(item);
    await this.refrescarPendientes();
    return item;
  }

  async encolarFactura(idEmpresa: number, dto: any, ticket?: any): Promise<PosColaItem> {
    if (!this.habilitado) {
      throw new Error('Modo local deshabilitado');
    }
    const limpio = this.sinFiscal(dto);
    if (!limpio.idempotencyKey) {
      limpio.idempotencyKey = crearGuidCobro();
    }
    if (!limpio.header) {
      limpio.header = {};
    }
    const numeroPrevio = limpio.header.numeroDocumento;
    const numero = this.esNumeroDocumentoRaro(numeroPrevio)
      ? await this.tomarSiguienteNumero(idEmpresa, 1)
      : String(numeroPrevio).trim();
    limpio.header.numeroDocumento = numero;
    const ticketFinal = { ...(ticket || {}), numeroDocumento: numero };
    const item: PosColaItem = {
      id: limpio.idempotencyKey,
      idEmpresa,
      tipo: 'factura',
      estado: 'pendiente',
      creado: new Date().toISOString(),
      idLocal: this.nuevoIdLocal(),
      payload: limpio,
      ticket: ticketFinal
    };
    await this.putCola(item);
    await this.refrescarPendientes();
    return item;
  }

  async eliminarLocal(idEmpresa: number, idLocal: number): Promise<void> {
    const item = await this.buscarPorIdLocal(idEmpresa, idLocal);
    if (item) {
      await this.deleteCola(item.id);
      await this.refrescarPendientes();
    }
  }

  async listarOrdenesLocales(idEmpresa: number): Promise<facturaheader[]> {
    if (!this.habilitado) {
      return [];
    }
    const items = (await this.getAllCola())
      .filter(x => x.idEmpresa === idEmpresa && x.tipo === 'orden' && x.estado !== 'sincronizado');
    return items
      .sort((a, b) => b.creado.localeCompare(a.creado))
      .map(item => this.aVista(item));
  }

  async listarFacturasLocales(idEmpresa: number): Promise<facturaheader[]> {
    if (!this.habilitado) {
      return [];
    }
    const items = (await this.getAllCola())
      .filter(x => x.idEmpresa === idEmpresa && x.tipo === 'factura' && x.estado !== 'sincronizado');
    return items
      .sort((a, b) => b.creado.localeCompare(a.creado))
      .map(item => this.aVista(item));
  }

  async sincronizar(): Promise<{ ok: number; error: number }> {
    if (!this.habilitado) {
      return { ok: 0, error: 0 };
    }
    const actual = this.estado$.value;
    if (actual.sincronizando || !this.apiOk || !this.idEmpresa) {
      return { ok: 0, error: 0 };
    }
    this.emitEstado(undefined, true);
    let ok = 0;
    let error = 0;
    const pendientes = (await this.getAllCola())
      .filter(x => x.idEmpresa === this.idEmpresa && x.estado !== 'sincronizado')
      .sort((a, b) => a.creado.localeCompare(b.creado));

    for (const item of pendientes) {
      try {
        if (item.tipo === 'orden') {
          const header = this.clonar(item.payload);
          header.idFacturaHeader = 0;
          await firstValueFrom(this.facturaHeader.Enviarorden(header));
        } else {
          await firstValueFrom(
            this.facturaHeader.createFacturaDirecta(this.sinFiscal(item.payload))
          );
        }
        item.estado = 'sincronizado';
        item.error = undefined;
        await this.putCola(item);
        ok += 1;
        this.marcarApi(true);
      } catch (err) {
        if (esErrorRedCobro(err)) {
          this.marcarApi(false);
          item.estado = 'pendiente';
          item.error = 'Sin conexión al servidor';
        } else {
          item.estado = 'error';
          item.error = this.mensajeError(err);
        }
        await this.putCola(item);
        error += 1;
        if (!this.apiOk) {
          break;
        }
      }
    }

    await this.purgarSincronizados();
    await this.refrescarPendientes(false);
    if (ok > 0 && this.apiOk) {
      await this.refrescarSecuencias(this.idEmpresa);
    }
    return { ok, error };
  }

  private aVista(item: PosColaItem): facturaheader {
    const h = item.tipo === 'factura'
      ? (item.payload?.header || item.payload || {})
      : (item.payload || {});
    const ticket = item.ticket || {};
    const total = Number(h.total ?? ticket.total ?? 0);
    const esFactura = item.tipo === 'factura';
    const vista: any = {
      ...h,
      idFacturaHeader: item.idLocal,
      idTipoDocumentos: esFactura ? 1 : (h.idTipoDocumentos || 10),
      numeroDocumento: ticket.numeroDocumento
        || h.numeroDocumento
        || `LOC-${Math.abs(item.idLocal)}`,
      nombreCuenta: h.nombreCuenta || ticket.clientes?.nombreComercial || 'Al Portador',
      nombreEmpresa: h.nombreEmpresa || h.nombreCuenta || 'Al Portador',
      total,
      subTotal: h.subTotal ?? ticket.subTotal ?? total,
      totalItbis: h.totalItbis ?? ticket.totalItbis ?? 0,
      totalDescuento: h.totalDescuento ?? 0,
      pagado: esFactura ? Number(ticket.pagado ?? total) : 0,
      pendiente: esFactura ? Number(ticket.pendiente ?? 0) : total,
      facturaDetalles: ticket.facturaDetalles || h.facturaDetalles || [],
      clientes: ticket.clientes || {
        nombreComercial: h.nombreCuenta || h.nombreEmpresa || 'Al Portador'
      },
      _offlineLocal: true,
      _offlineId: item.id,
      fechaInseccion: ticket.fechaInseccion || item.creado,
      fechaBencimiento: h.fechaBencimiento || item.creado
    };
    return vista;
  }

  private async buscarPorIdLocal(idEmpresa: number, idLocal: number): Promise<PosColaItem | null> {
    const items = await this.getAllCola();
    return items.find(x => x.idEmpresa === idEmpresa && x.idLocal === idLocal) || null;
  }

  private async refrescarPendientes(sincronizando?: boolean): Promise<void> {
    const n = (await this.getAllCola())
      .filter(x => x.idEmpresa === this.idEmpresa && x.estado !== 'sincronizado')
      .length;
    this.emitEstado(n, sincronizando);
  }

  private async purgarSincronizados(): Promise<void> {
    const limite = Date.now() - 24 * 60 * 60 * 1000;
    const items = await this.getAllCola();
    for (const item of items) {
      if (item.estado === 'sincronizado' && Date.parse(item.creado) < limite) {
        await this.deleteCola(item.id);
      }
    }
  }

  private emitEstado(pendientes?: number, sincronizando?: boolean): void {
    if (!this.habilitado) {
      this.estado$.next({ modoLocal: false, pendientes: 0, sincronizando: false });
      return;
    }
    this.estado$.next({
      modoLocal: !this.apiOk,
      pendientes: pendientes ?? this.estado$.value.pendientes,
      sincronizando: sincronizando ?? this.estado$.value.sincronizando
    });
  }

  private nuevoIdLocal(): number {
    return -(Date.now() * 10 + Math.floor(Math.random() * 10));
  }

  private esNumeroDocumentoRaro(n: unknown): boolean {
    const v = String(n || '').trim();
    if (!v) {
      return true;
    }
    if (/^LOC-/i.test(v)) {
      return true;
    }
    if (/^\d{10,}$/.test(v)) {
      return true;
    }
    return false;
  }

  private prefijoPorTipo(idTipoDocumento: number): string {
    switch (idTipoDocumento) {
      case 1:
        return 'Fact-';
      case 2:
        return 'COT-';
      case 10:
        return 'PFACT-';
      default:
        return 'DOC-';
    }
  }

  private normalizarPrefijo(prefijo: string | undefined): string {
    const p = (prefijo || '').trim();
    if (!p) {
      return '';
    }
    const lastDash = p.lastIndexOf('-');
    if (lastDash < 0) {
      return p;
    }
    const suffix = p.slice(lastDash + 1);
    if (suffix.length > 0 && [...suffix].every(c => c === '0')) {
      return p.slice(0, lastDash + 1);
    }
    return p;
  }

  private formatearNumero(prefijo: string, actual: number): string {
    return `${this.normalizarPrefijo(prefijo)}${String(actual).padStart(4, '0')}`;
  }

  private async mergeSecuenciasServidor(
    idEmpresa: number,
    servidor: Array<{ idTipoDocumento: number; prefijo?: string; secuenciaActual?: number }>
  ): Promise<void> {
    const local = (await this.getKv<PosSecuenciaCache[]>(`seq:${idEmpresa}`)) || [];
    const byTipo = new Map<number, PosSecuenciaCache>();
    for (const s of local) {
      byTipo.set(s.idTipoDocumento, { ...s });
    }
    for (const s of servidor) {
      const tipo = Number(s.idTipoDocumento);
      if (!tipo) {
        continue;
      }
      const prev = byTipo.get(tipo);
      const actualServidor = Number(s.secuenciaActual) || 0;
      byTipo.set(tipo, {
        idTipoDocumento: tipo,
        prefijo: this.normalizarPrefijo(s.prefijo) || prev?.prefijo || this.prefijoPorTipo(tipo),
        secuenciaActual: Math.max(prev?.secuenciaActual ?? 0, actualServidor)
      });
    }
    await this.putKv(`seq:${idEmpresa}`, [...byTipo.values()]);
  }

  private async tomarSiguienteNumero(
    idEmpresa: number,
    idTipoDocumento: number
  ): Promise<string> {
    const lista = (await this.getKv<PosSecuenciaCache[]>(`seq:${idEmpresa}`)) || [];
    let s = lista.find(x => x.idTipoDocumento === idTipoDocumento);
    if (!s) {
      s = {
        idTipoDocumento,
        prefijo: this.prefijoPorTipo(idTipoDocumento),
        secuenciaActual: 0
      };
      lista.push(s);
    }
    s.secuenciaActual += 1;
    s.prefijo = this.normalizarPrefijo(s.prefijo) || this.prefijoPorTipo(idTipoDocumento);
    await this.putKv(`seq:${idEmpresa}`, lista);
    return this.formatearNumero(s.prefijo, s.secuenciaActual);
  }

  private clonar<T>(v: T): T {
    return JSON.parse(JSON.stringify(v ?? null));
  }

  private mensajeError(err: unknown): string {
    const e = err as { error?: { message?: string }; message?: string };
    return e?.error?.message || e?.message || 'No se pudo sincronizar';
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV);
        }
        if (!db.objectStoreNames.contains(STORE_COLA)) {
          db.createObjectStore(STORE_COLA, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async putKv(key: string, value: unknown): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_KV, 'readwrite');
      tx.objectStore(STORE_KV).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  private async getKv<T>(key: string): Promise<T | null> {
    const db = await this.openDb();
    const value = await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_KV, 'readonly');
      const req = tx.objectStore(STORE_KV).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  }

  private async putCola(item: PosColaItem): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_COLA, 'readwrite');
      tx.objectStore(STORE_COLA).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  private async getAllCola(): Promise<PosColaItem[]> {
    const db = await this.openDb();
    const rows = await new Promise<PosColaItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_COLA, 'readonly');
      const req = tx.objectStore(STORE_COLA).getAll();
      req.onsuccess = () => resolve((req.result as PosColaItem[]) || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows;
  }

  private async deleteCola(id: string): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_COLA, 'readwrite');
      tx.objectStore(STORE_COLA).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }
}
