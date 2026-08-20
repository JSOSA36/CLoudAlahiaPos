import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

import { productos } from '../models/productos';
import { zonas } from '../models/zonas';
import { Mesas } from '../models/mesas';
import { facturaheader } from '../models/facturaheader';
import { categorias } from '../models/categorias';
import { EmpresaDto } from '../models/empresadto.models';

import { ZonasService } from './zonas.service';
import { FacturaHeaderService } from './factura-header.service';
import { clientes } from '../models/clientes';
import { FiscalFeatureFlags } from './dgii-config.service';
import { normalizarNivelSoporte } from '../shared/nivel-soporte';

/** Features fiscales apagados (default seguro / sin config). */
export const FISCAL_FEATURES_OFF: FiscalFeatureFlags = {
  idEmpresa: 0,
  tieneConfiguracion: false,
  fiscalActivo: false,
  generar606: false,
  generar607: false,
  generarIt1: false,
  facturacionElectronicaActiva: false
};

@Injectable({
  providedIn: 'root'
})
export class ParametrosService {

  // ==================================================
  // 🔹 VARIABLES GLOBALES (ESTADO DE NEGOCIO)resetTimer
  // ==================================================
  public ListadoProductosCate: productos[] = [];
  public ListadoProductoCategoria: productos[] = [];
 
  public ListadoOrdenes: facturaheader[] = [];
   public ListadoFacturas: facturaheader[] = [];
  public IdCliente:number=0;
  public _ListadoZonas: zonas[] = [];
  public _ListadoMesas: Mesas[] = [];
  public TipoDocumento: 'ORDEN' | 'FACTURA' = 'ORDEN';
public puedeEliminarOrden: boolean = false;
  public _Empresa?: EmpresaDto;
PoliticasAceptadas: boolean = false;
  public _Cat: categorias = new categorias();
  public _Mesa: Mesas = new Mesas();
public PuedeEliminarItemCarrito: boolean = false;

public PuedeDisminuirCantidadCarrito: boolean = false;

public PuedeEditarPrecioCarrito: boolean = false;
  public NombreCliente = '';
  public NombreEmpresa = '';
  public NumeroMesa = '';
  public Buscar = '';
  public nombrePlan: string = '';
  public nivelSoporte: string = 'STANDARD';

  setNivelSoporte(valor?: string | null): void {
    this.nivelSoporte = normalizarNivelSoporte(valor);
    localStorage.setItem('nivelSoporte', this.nivelSoporte);
  }

  /** Aviso de cobro SaaS (gracia día 30→3). Null si no aplica. */
  public alertaPago: {
    tipo: string;
    mensaje: string;
    diaCobro?: number;
    diasRestantes?: number;
  } | null = null;
  private alertaPagoSubject = new BehaviorSubject<{
    tipo: string;
    mensaje: string;
    diaCobro?: number;
    diasRestantes?: number;
  } | null>(null);
  public alertaPago$ = this.alertaPagoSubject.asObservable();

  setAlertaPago(alerta: {
    tipo: string;
    mensaje: string;
    diaCobro?: number;
    diasRestantes?: number;
  } | null) {
    this.alertaPago = alerta;
    this.alertaPagoSubject.next(alerta);
    if (alerta?.mensaje) {
      sessionStorage.setItem('alerta_pago', JSON.stringify(alerta));
    } else {
      sessionStorage.removeItem('alerta_pago');
    }
  }

  restoreAlertaPago() {
    try {
      const raw = sessionStorage.getItem('alerta_pago');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.mensaje) this.setAlertaPago(parsed);
    } catch { /* ignore */ }
  }
  public IdMesa = 0;
  public IdZona = 0;
  public IdCategoria = 0;
  public IdFacturaHeader = 0;
  public IdFactPay = 0;
  public IdUsuario = 0;
  public IdEmpleados = 0;
  public IdEmpresa = 0;
  public IdPerfil = 0;

  public UserName = '';
  public Rol = '';
  public Moneda = '';

  public Total = 0;
  public Cart = 0;

  public Carga = false;
  public ExistCuenta = false;
  public _Process = false;
  public _Result = false;

  // ==================================================
  // 🔄 EVENTOS GLOBALES
  // ==================================================
  public OrdenesActualizadas$ = new Subject<void>();

  // ==================================================
  // 🔐 SISTEMA DE MÓDULOS (FUENTE DE VERDAD)
  // ==================================================
  private modulosActivos = new Set<number>();
  private modulosActivos$ = new BehaviorSubject<number[]>([]);
  private modulosCodigos = new Set<string>();

  /** Flags DGII (cargados al login vía FiscalFeatureService API). Sin config = off. */
  private fiscalFeatures: FiscalFeatureFlags = { ...FISCAL_FEATURES_OFF };
  private fiscalFeatures$ = new BehaviorSubject<FiscalFeatureFlags>({ ...FISCAL_FEATURES_OFF });

  // ==================================================
  // 🔄 REFRESH DE MENÚ (EVENTO PURO)
  // ==================================================
  private menuRefresh$ = new Subject<void>();
  public menuRefreshObservable$ = this.menuRefresh$.asObservable();

  // ==================================================
  // 🔐 SESIÓN
  // ==================================================
  private readonly SESSION_MINUTES = 40;
  public sessionStarted$ = new Subject<void>();
  ApiPrint: string = '';
  /** Si true, al cobrar/guardar factura se envía el ticket de lavador al agente. */
  PrintTicketLavador = false;

  constructor(
    private _Zonas: ZonasService,
    private _FacturaHeader: FacturaHeaderService
  ) {
    this.ensureSessionFromStorage();
  }
setTipoDocumento(tipo: 'ORDEN' | 'FACTURA') {
  this.TipoDocumento = tipo;
}
  // ==================================================
  // 🧩 MÓDULOS
  // ==================================================
  setModulosActivos(modulos: number[], codigos?: string[], emitRefresh = true) {
    this.modulosActivos = new Set(modulos);
    if (codigos) {
      this.modulosCodigos = new Set(
        codigos
          .filter((c) => !!c)
          .map((c) => String(c).trim().toUpperCase())
      );
    }
    this.modulosActivos$.next([...this.modulosActivos]);
    if (emitRefresh) {
      this.refrescarMenu();
    }
  }

  getModulosActivos$() {
    return this.modulosActivos$.asObservable();
  }

  puedeUsarModuloId(moduloId?: number): boolean {
    if (moduloId === undefined || moduloId === null) return true;
    return this.modulosActivos.has(moduloId);
  }

  tieneModulo(codigo: string): boolean {
    if (!codigo) return false;
    const key = codigo.trim().toUpperCase();
    if (this.modulosCodigos.has(key) || this.modulosCodigos.has(codigo)) return true;
    for (const c of this.modulosCodigos) {
      if (String(c).trim().toUpperCase() === key) return true;
    }
    return false;
  }

  getModulosCodigos(): string[] {
    return Array.from(this.modulosCodigos);
  }

  // ==================================================
  // 🏛 FLAGS FISCALES DGII
  // ==================================================
  setFiscalFeatures(features: FiscalFeatureFlags | null | undefined) {
    this.fiscalFeatures = features
      ? { ...FISCAL_FEATURES_OFF, ...features, idEmpresa: features.idEmpresa || this.IdEmpresa }
      : { ...FISCAL_FEATURES_OFF, idEmpresa: this.IdEmpresa };
    this.fiscalFeatures$.next(this.fiscalFeatures);
    this.refrescarMenu();
  }

  getFiscalFeatures(): FiscalFeatureFlags {
    return this.fiscalFeatures;
  }

  getFiscalFeatures$() {
    return this.fiscalFeatures$.asObservable();
  }

  isFiscalActivo(): boolean {
    return !!this.fiscalFeatures.fiscalActivo;
  }

  isGenerarIt1(): boolean {
    return !!this.fiscalFeatures.fiscalActivo && !!this.fiscalFeatures.generarIt1;
  }

  /**
   * IT-1 / config fiscal: módulo comercial (Empresa_Modulos) + flag DGII.
   * REPORTE_606 / REPORTE_607 no usan este filtro (siguen solo por módulo).
   */
  puedeMostrarMenuFiscal(codigoModulo: string, tieneModuloComercial: boolean): boolean {
    if (!tieneModuloComercial) return false;
    if (codigoModulo === 'IT1' || codigoModulo === 'DGII_FISCAL') {
      return this.isGenerarIt1();
    }
    if (codigoModulo === 'CONFIGURACION_DGII' || codigoModulo === 'CONFIGURACION_FISCAL') {
      return this.isFiscalActivo() || (this.Rol || '').toLowerCase() === 'admin';
    }
    return true;
  }

  /** Catálogos / nómina de personal (no el listado EMPLEADOS de comisiones). */
  tieneModuloRrhh(): boolean {
    return this.getModulosCodigos().some(c =>
      String(c || '').trim().toUpperCase().startsWith('RRHH_')
    );
  }

  // ==================================================
  // 🔄 MENÚ
  // ==================================================
  refrescarMenu() {
    this.menuRefresh$.next();
  }

  // ==================================================
  // 🔐 LOGIN
  // ==================================================
  setLoginData(
    usuario: string,
    password: string,
    idEmpresa: number,
    token: string,
    rol: string = '',
    idUsuario: number = 0,
    rawUsuario?: any
  ) {
    localStorage.setItem('Usuario', usuario);
    localStorage.setItem('Password', password);
    localStorage.setItem('IdEmpresa', idEmpresa.toString());
    localStorage.setItem('IdUsuario', idUsuario.toString());
    const idEmp = Number(rawUsuario?.idEmpleado ?? rawUsuario?.IdEmpleado ?? 0) || 0;
    this.IdEmpleados = idEmp;
    if (idEmp) localStorage.setItem('IdEmpleados', String(idEmp));
    localStorage.setItem('token', token || 'ok');

    const expiry = Date.now() + this.SESSION_MINUTES * 60 * 1000;
    localStorage.setItem('token_expiry', expiry.toString());

    if (rawUsuario) {
      localStorage.setItem('usuario', JSON.stringify(rawUsuario));
    }

    this.UserName = usuario;
    this.Rol = rol;
    this.IdUsuario = idUsuario;
    this.IdEmpresa = idEmpresa;
    this.IdPerfil = Number(rawUsuario?.idPerfil ?? rawUsuario?.IdPerfil ?? 0) || 0;
    if (this.IdPerfil) {
      localStorage.setItem('IdPerfil', String(this.IdPerfil));
    }

    // 🔥 eventos CLAVE
    this.sessionStarted$.next();
    this.refrescarMenu();
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('token_expiry');
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  }

  // ==================================================
  // 🚪 LOGOUT (LIMPIEZA TOTAL)
  // ==================================================
  logout() {
    localStorage.clear();

    // estado usuario
    this.UserName = '';
    this.Rol = '';
    this.IdUsuario = 0;
    this.IdEmpleados = 0;
    this.IdEmpresa = 0;
    this.IdPerfil = 0;

    // estado negocio
    this.ListadoProductosCate = [];
    this.ListadoProductoCategoria = [];
    this.ListadoOrdenes = [];
    this._ListadoZonas = [];
    this._ListadoMesas = [];
    this._Empresa = undefined;

    this.NombreCliente = '';
    this.NombreEmpresa = '';
    this.nombrePlan = '';
    this.nivelSoporte = 'STANDARD';
    this.ApiPrint = '';
    this.PrintTicketLavador = false;
    this.NumeroMesa = '';
    this.Buscar = '';

    this.IdMesa = 0;
    this.IdZona = 0;
    this.IdCategoria = 0;
    this.IdFacturaHeader = 0;
    this.IdFactPay = 0;

    this.Total = 0;
    this.Cart = 0;
    this.Carga = false;
    this.ExistCuenta = false;
    this._Process = false;
    this._Result = false;

    this._Cat = new categorias();
    this._Mesa = new Mesas();

    this.modulosActivos.clear();
    this.modulosCodigos.clear();
    this.modulosActivos$.next([]);
    this.setFiscalFeatures(null);
    this.setAlertaPago(null);

    // 🔥 reconstruir menú
    this.refrescarMenu();
  }

  // ==================================================
  // 🔄 SESIÓN
  // ==================================================
  refreshSession() {
    if (localStorage.getItem('token')) {
      const expiry = Date.now() + this.SESSION_MINUTES * 60 * 1000;
      localStorage.setItem('token_expiry', expiry.toString());
    }
  }

  GetIdEmpresa(): number {
    return parseInt(localStorage.getItem('IdEmpresa') ?? '0', 10);
  }

  /** Restaura empresa/usuario/perfil desde localStorage (refresh de página). */
  ensureSessionFromStorage(): void {
    if (this.IdUsuario && this.IdEmpresa) return;

    this.IdEmpresa = parseInt(localStorage.getItem('IdEmpresa') ?? '0', 10) || 0;
    this.IdUsuario = parseInt(localStorage.getItem('IdUsuario') ?? '0', 10) || 0;
    this.IdEmpleados = parseInt(localStorage.getItem('IdEmpleados') ?? '0', 10) || 0;
    this.IdPerfil = parseInt(localStorage.getItem('IdPerfil') ?? '0', 10) || 0;
    this.UserName = localStorage.getItem('Usuario') || this.UserName;
    this.NombreEmpresa = localStorage.getItem('NombreEmpresa') || this.NombreEmpresa;
    this.nombrePlan = localStorage.getItem('nombrePlan') || this.nombrePlan;
    this.setNivelSoporte(localStorage.getItem('nivelSoporte') || this.nivelSoporte);

    try {
      const raw = localStorage.getItem('usuario');
      if (!raw) return;
      const u = JSON.parse(raw);
      this.IdPerfil = Number(u?.idPerfil ?? u?.IdPerfil ?? this.IdPerfil) || this.IdPerfil;
      this.Rol = String(u?.nombrePerfil ?? u?.NombrePerfil ?? u?.rol ?? this.Rol ?? '');
      if (!this.UserName) this.UserName = String(u?.userName ?? u?.UserName ?? '');
      if (this.IdPerfil) localStorage.setItem('IdPerfil', String(this.IdPerfil));
    } catch {
      /* ignore */
    }
  }

  // ==================================================
  // 🔹 NEGOCIO
  // ==================================================
  ListadoMesasByZona(IdZona: number) {
    this.Carga = true;
    this._ListadoMesas = [];

    this._Zonas.GetListadoMesas(IdZona).subscribe(res => {
      this._ListadoMesas = res;
      this.Carga = false;
    });
  }

  LoadListaFactura() {
    this.Carga = true;

    this._FacturaHeader
      .GetListadoOrdenes(this.GetIdEmpresa())
      .subscribe(c => {
        console.log('Órdenes cargadas:', c);
        this.ListadoOrdenes = [...c];
        this.ExistCuenta = c.length > 0;
        this.Carga = false;
        this.OrdenesActualizadas$.next();
      });
  }

  reloadPageData() {
    this.LoadListaFactura();

    if (this.IdZona > 0) {
      this.ListadoMesasByZona(this.IdZona);
    }
  }
}
