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
  public NombreCliente = '';
  public NombreEmpresa = '';
  public NumeroMesa = '';
  public Buscar = '';
public nombrePlan: string = '';
  public IdMesa = 0;
  public IdZona = 0;
  public IdCategoria = 0;
  public IdFacturaHeader = 0;
  public IdFactPay = 0;
  public IdUsuario = 0;
  public IdEmpresa = 0;

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

  constructor(
    private _Zonas: ZonasService,
    private _FacturaHeader: FacturaHeaderService
  ) {}
setTipoDocumento(tipo: 'ORDEN' | 'FACTURA') {
  this.TipoDocumento = tipo;
}
  // ==================================================
  // 🧩 MÓDULOS
  // ==================================================
  setModulosActivos(modulos: number[]) {
    this.modulosActivos = new Set(modulos);
    this.modulosActivos$.next([...this.modulosActivos]);

    // 🔥 avisar a la UI que debe reconstruir menú
    this.refrescarMenu();
  }

  getModulosActivos$() {
    return this.modulosActivos$.asObservable();
  }

  puedeUsarModuloId(moduloId?: number): boolean {
    if (moduloId === undefined || moduloId === null) return true;
    return this.modulosActivos.has(moduloId);
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
    this.IdEmpresa = 0;

    // estado negocio
    this.ListadoProductosCate = [];
    this.ListadoProductoCategoria = [];
    this.ListadoOrdenes = [];
    this._ListadoZonas = [];
    this._ListadoMesas = [];
    this._Empresa = undefined;

    this.NombreCliente = '';
    this.NombreEmpresa = '';
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

    // 🔥 limpiar módulos
    this.modulosActivos.clear();
    this.modulosActivos$.next([]);

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
