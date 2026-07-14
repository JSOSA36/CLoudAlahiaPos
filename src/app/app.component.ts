import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AlertController, Platform } from '@ionic/angular';
import { ParametrosService } from './servicios/parametros.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { AuthService } from 'src/app/servicios/auth.service';
import { filter } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { CitasService } from './servicios/citas.service';
import { PosComponent } from './Pos/pos/pos.component';
import {
  MENU_GRUPOS,
  MENU_GRUPO_OTROS,
  MODULOS_EXCLUIDOS_MENU,
  CONTABILIDAD_MODULO_PADRE,
  CONTABILIDAD_SUBMODULOS_TITULOS
} from './config/menu-grupos.config';
import { MenuGrupoView, MenuItemView, MenuSalirView } from './models/menu.models';

// ===============================
// 🧭 MAPAS FRONTEND (SOLO MENÚ)
// ===============================
export const MODULO_RUTAS: Record<string, string> = {
  DASHBOARD: '/dashboard-gerencial',
  ORDENES: '/Ordenes',
  REPORTE_607: '/reporte607',
  REPORTE_VENTA: '/reporteventa',
  REPORTE_SERVICIOS: '/reporteservicios',
  REPORTE_COMISIONES: '/comisiones',
  MOVIMIENTO_INVENTARIO: '/movimientosinventario',
  REPORTE_PERDIDAS: '/reporteperdidas',
  CATEGORIAS: '/Listadocategorias',
  PRODUCTOS: '/listproducto',
  CLIENTES: '/clientemodal',
  CUMPLEANEROS: '/clientehappy',

  GASTOS: '/listadogastos',
  INGRESOS: '/Listadoingresos',
  LISTADO_PAGOS: '/listadopago',
  CITAS: '/citas',
  HORARIO_ESTILISTA: '/horarioestilista',
  CONSUMO_LAVADORES: '/consumolavador',
  AREAS: '/area',
  ALMACENES: '/almacenes',
  CIERRE_CAJA: '/cierrecaja',
  EMPLEADOS_COMISION: '/listadoempleadocomision',
  HISTORICO_FACTURAS: '/historicofact',
  LISTADO_DEVOLUCIONES: '/listadodevoluciones',
  NOTAS_CREDITO_APLICADAS: '/notascreditoaplicadas',
  CUENTAS_COBRAR: '/cuentaxcobrar',
  DESCUENTOS: '/Descuento',
  BIZCOCHO_ENCARGO: '/bizcocho',
  LISTADO_CAJA: '/listadocaja',
  MOVIMIENTO_CAJA: '/movimientocaja',
  CUENTAS_FINANCIERAS: '/cuentafinanciera',
  MOVIMIENTO_FINANCIERO: '/movimientosfinancieros',
  METODO_PAGO_CUENTAS: '/metodopagocuentas',
  TRANSFERENCIAS_FINANCIERAS: '/transferenciasfinancieras',
  POS: '/pos',
  NCF_SECUENCIAS: '/ncfsecuencias',
  EMPRESA: '/empresa',
  PARAMETROS: '/ParametrosConfig',
  EMPLEADOS: '/empleados',
  USUARIOS: '/usuarios',
  PERFILES: '/perfiles',
  DOCUMENTOS_CLINICOS: '/documentosclinicos',
  HISTORIAL_SERVICIOS: '/historialservicios',
  CONTABILIDAD: '/contabilidad',
  CONTABILIDAD_CUENTAS: '/contabilidadcuentas',
  CONTABILIDAD_ASIENTOS: '/contabilidadasientos',
  CONTABILIDAD_LIBRO_DIARIO: '/contabilidadlibrodiario',
  CONTABILIDAD_MAYOR_GENERAL: '/contabilidadmayorgeneral',
  CONTABILIDAD_BALANCE_COMPROBACION: '/contabilidadbalancecomprobacion',
  CONTABILIDAD_ESTADO_RESULTADOS: '/contabilidadestadoresultados',
  CONTABILIDAD_BALANCE_GENERAL: '/contabilidadbalancegeneral',
  CONTABILIDAD_CONSULTA_ASIENTOS: '/contabilidadconsultaasientos',
  CONTABILIDAD_CIERRE: '/contabilidadcierre',
  CONTABILIDAD_CONFIGURACION_INTEGRACION: '/contabilidadconfiguracionintegracion',
  PROVEEDORES: '/proveedores',
  ORDENES_COMPRA: '/compras/ordenes',
  FACTURAS_COMPRA: '/compras/facturas',
  ANALISIS_COMPRAS_PRODUCTO: '/compras/analisis-producto',
  REPORTE_606: '/compras/reporte-606',
  CUENTAS_PAGAR_PROVEEDOR: '/compras/cxp',
  ACTIVOS_FIJOS: '/activos-fijos',
  REPORTE_PRODUCTOS: '/reportes/productos',
  REPORTE_PROVEEDORES: '/reportes/proveedores',
  REPORTE_CLIENTES: '/reportes/clientes',
  REPORTE_EMPLEADOS: '/reportes/empleados'
};

// ===============================
// 🎨 ICONOS
// ===============================
export const MODULO_ICONOS: Record<string, string> = {
  DASHBOARD: 'chart-bar',
  ORDENES: 'shopping-cart',
  NCF_SECUENCIAS: 'barcode',
  REPORTE_607: 'file-invoice',
  REPORTE_606: 'file-invoice',
  REPORTE_VENTA: 'file-invoice-dollar',
  REPORTE_SERVICIOS: 'chart-line',
  REPORTE_COMISIONES: 'money-bill-wave',
  CONSUMO_LAVADORES: 'tint',
  MOVIMIENTO_CAJA: 'wallet',
  CATEGORIAS: 'th-large',
  PRODUCTOS: 'box-open',
  CUENTAS_FINANCIERAS: 'wallet',
  TRANSFERENCIAS_FINANCIERAS: 'exchange-alt',
  MOVIMIENTO_FINANCIERO: 'chart-line',
  METODO_PAGO_CUENTAS: 'credit-card',
  CLIENTES: 'users',
  CUMPLEANEROS: 'gift',
  PARAMETROS: 'gift',
  LISTADO_CAJA: 'wallet',
  MOVIMIENTO_INVENTARIO: 'box-open',
  REPORTE_PERDIDAS: 'exclamation-triangle',
  GASTOS: 'wallet',
  INGRESOS: 'cash-register',
  HISTORICO_FACTURAS: 'file-invoice',
  LISTADO_DEVOLUCIONES: 'undo',
  NOTAS_CREDITO_APLICADAS: 'file-invoice-dollar',
  CITAS: 'calendar-alt',
  HORARIO_ESTILISTA: 'clock',
  LISTADO_PAGOS: 'list',
  BIZCOCHO_ENCARGO: 'birthday-cake',
  AREAS: 'layer-group',
  ALMACENES: 'warehouse',
  EMPLEADOS_COMISION: 'percentage',
  CIERRE_CAJA: 'cash-register',
  CUENTAS_COBRAR: 'file-invoice',
  DESCUENTOS: 'tags',

  EMPRESA: 'building',

  EMPLEADOS: 'user-tie',
  USUARIOS: 'user',
  PERFILES: 'user-shield',
  DOCUMENTOS_CLINICOS: 'file-medical',
  HISTORIAL_SERVICIOS: 'clipboard-list',
  CONTABILIDAD: 'calculator',
  CONTABILIDAD_CUENTAS: 'sitemap',
  CONTABILIDAD_ASIENTOS: 'book',
  CONTABILIDAD_LIBRO_DIARIO: 'book-open',
  CONTABILIDAD_MAYOR_GENERAL: 'balance-scale',
  CONTABILIDAD_BALANCE_COMPROBACION: 'table',
  CONTABILIDAD_ESTADO_RESULTADOS: 'chart-pie',
  CONTABILIDAD_BALANCE_GENERAL: 'landmark',
  CONTABILIDAD_CONSULTA_ASIENTOS: 'search',
  CONTABILIDAD_CIERRE: 'calendar-check',
  CONTABILIDAD_CONFIGURACION_INTEGRACION: 'sliders-h',
  PROVEEDORES: 'truck',
  ORDENES_COMPRA: 'clipboard-list',
  FACTURAS_COMPRA: 'file-invoice',
  ANALISIS_COMPRAS_PRODUCTO: 'chart-line',
  CUENTAS_PAGAR_PROVEEDOR: 'hand-holding-usd',
  ACTIVOS_FIJOS: 'file-invoice-dollar',
  REPORTE_PRODUCTOS: 'box',
  REPORTE_PROVEEDORES: 'truck',
  REPORTE_CLIENTES: 'users',
  REPORTE_EMPLEADOS: 'user-tie'
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  // ===============================
  // 🔹 MENÚ AGRUPADO
  // ===============================
  public menuGrupos: MenuGrupoView[] = [];
  public menuSalir: MenuSalirView = {
    title: 'Salir',
    url: '/login',
    icon: 'sign-out-alt',
    iconFa: ['fas', 'sign-out-alt']
  };
  private destroy$ = new Subject<void>();

  // ===============================
  // 🔐 INACTIVIDAD / SESIÓN
  // ===============================
  private idleTimer: any;
  private warningTimer: any;
  private warningShown = false;
  private activeAlert: HTMLIonAlertElement | null = null;

  private readonly WARNING_BEFORE_EXPIRY = 5 * 60_000; // 5 minutos
getPlanColor(plan: string): string {
  switch (plan?.toLowerCase()) {
    case 'básico':
    case 'basico':
      return 'primary'; // azul

    case 'standard':
      return 'success'; // verde

    case 'gold':
      return 'warning'; // amarillo

    case 'platinum':
      return 'medium'; // gris

    case 'elite':
      return 'dark'; // negro

    default:
      return 'warning'; // demo fallback
  }
}
  constructor(
    private router: Router,
    public _Parametro: ParametrosService,
    private alertCtrl: AlertController,
    private platform: Platform,
    private updates: SwUpdate,
private toastCtrl: ToastController,
private citasService: CitasService,private authService: AuthService
  ) {}

  // ===============================
  // 🔄 INIT
  // ===============================
  ngOnInit() {

  this.citasService.nuevaCita$
  .pipe(takeUntil(this.destroy$))
  .subscribe(async (cita) => {

  const toast = await this.toastCtrl.create({
  message: `📅 Nueva cita para ${cita.nombreCliente}`,
  duration: 6000,
  position: 'top',
  cssClass: 'toast-nueva-cita',
  animated: true,
  buttons: [
    {
      text: 'Ver',
      role: 'info',
      handler: () => {
        this.router.navigate(['/citas']);
      }
    }
  ]
});



    await toast.present();
  });

if (this.updates.isEnabled) {

  // 🔄 Revisar updates cada 60 segundos (PC de recepción abierta todo el día)
setInterval(async () => {
  try {
    const updateFound = await this.updates.checkForUpdate();
    console.log('🔎 Buscando nueva versión...', updateFound);
  } catch (err) {
    console.error('❌ Error buscando update', err);
  }
}, 60000);


  this.updates.versionUpdates
    .pipe(
      filter((event): event is VersionReadyEvent =>
        event.type === 'VERSION_READY'
      )
    )
    .subscribe(async () => {

      const toast = await this.toastCtrl.create({
        message: '🔄 El sistema fue actualizado. Recargando...',
        duration: 3000,
        position: 'bottom'
      });

      await toast.present();

      setTimeout(() => {
        this.updates.activateUpdate().then(() => {
          document.location.reload();
        });
      }, 3000);

    });
}

  window.addEventListener('beforeinstallprompt', (event: any) => {
    event.preventDefault(); // 🚫 bloquea que el navegador lo muestre solo
  });

  // lo demás que ya tienes


    // 🔥 menú (igual que antes)
    this.cargarMenu();

    this._Parametro.menuRefreshObservable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cargarMenu());

    this._Parametro.sessionStarted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarMenu();
        this.startIdleWatcher();
      });

    // 🔥 arrancar watcher si hay sesión
    this.startIdleWatcher();

    // 🔥 cuando la app vuelve del background
   this.platform.resume.subscribe(() => {

  if (this.isPublicRoute()) {
    return; // 🚫 No hacer logout en catálogo / citas públicas
  }

  this.checkSessionOnResume();

});
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.idleTimer);
    clearTimeout(this.warningTimer);
  }

  // ===============================
  // 🖱️ ACTIVIDAD DEL USUARIO
  // ===============================
  @HostListener('document:click')
@HostListener('document:touchstart')
@HostListener('document:keydown')
resetTimer() {

  if (this.isPublicRoute()) {
    return; // 🚫 NO refrescar sesión en citainicio, cita o catálogo
  }

  this._Parametro.refreshSession();
  this.startIdleWatcher();
}
private isPublicRoute(): boolean {
  const publicRoutes = [
    '/catalogo',
    '/cita',
    '/citainicio'
  ];

  return publicRoutes.some(r => this.router.url.includes(r));
}

  // ===============================
  // ⏱️ WATCHER DE INACTIVIDAD
  // ===============================
private startIdleWatcher() {

  if (this.isPublicRoute()) {
    return; // 🚫 No activar watcher en rutas públicas
  }

  clearTimeout(this.idleTimer);
  clearTimeout(this.warningTimer);
  this.warningShown = false;

  const expiry = localStorage.getItem('token_expiry');
  if (!expiry) return;

  const tiempoRestante = parseInt(expiry, 10) - Date.now();

  if (tiempoRestante <= 0) {
    this.forceLogout();
    return;
  }

  if (tiempoRestante > this.WARNING_BEFORE_EXPIRY) {
    this.warningTimer = setTimeout(
      () => this.showExpiryWarning(),
      tiempoRestante - this.WARNING_BEFORE_EXPIRY
    );
  }

  this.idleTimer = setTimeout(
    () => this.forceLogout(),
    tiempoRestante
  );
}

  // ===============================
  // ⚠️ MODAL DE AVISO
  // ===============================
  private async showExpiryWarning() {
    if (this.warningShown) return;
    this.warningShown = true;

    const alert = await this.alertCtrl.create({
      header: 'Sesión inactiva',
      message: 'Tu sesión está por expirar. ¿Deseas continuar activo?',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => this.forceLogout()
        },
        {
          text: 'Seguir activo',
          handler: () => {
            this._Parametro.refreshSession();
            this.startIdleWatcher();
            this.activeAlert?.dismiss();
            this.activeAlert = null;
          }
        }
      ]
    });

    this.activeAlert = alert;
    await alert.present();
  }

  // ===============================
  // 🔁 REANUDAR APP
  // ===============================
  private checkSessionOnResume() {
    const expiry = localStorage.getItem('token_expiry');
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      this.forceLogout();
    } else {
      this.startIdleWatcher();
    }
  }

  // ===============================
  // 🚪 LOGOUT FORZADO
  // ===============================
  private async forceLogout() {

  this.activeAlert?.dismiss();
  this.activeAlert = null;

  const idUsuario = this._Parametro.IdUsuario;

  try {
    if (idUsuario) {
      await this.authService.logout(idUsuario).toPromise();
    }
  } catch (error) {
    console.warn('Error cerrando sesión en backend', error);
  }

  // 🔥 LIMPIAR TODO
  this._Parametro.logout();
  localStorage.clear();

  this.router.navigateByUrl('/login', { replaceUrl: true });
}

  // ===============================
  // 📋 MENÚ AGRUPADO POR ÁREA FUNCIONAL
  // ===============================
  private cargarMenu(): void {
    let modulos: any[] = [];

    try {
      modulos = JSON.parse(localStorage.getItem('menu_modulos') || '[]');
      if (!Array.isArray(modulos)) modulos = [];
    } catch {
      modulos = [];
    }

    if (!modulos.length) {
      this.menuGrupos = [];
      return;
    }

    const modulosUsuario = new Map<string, { title: string; codigo: string }>();
    let tieneContabilidadHub = false;

    modulos.forEach((m: any) => {
      const codigo = m.codigo;
      if (!codigo) return;

      if (codigo === CONTABILIDAD_MODULO_PADRE) {
        tieneContabilidadHub = true;
        return;
      }

      if (MODULOS_EXCLUIDOS_MENU.includes(codigo)) return;

      const ruta = MODULO_RUTAS[codigo];
      if (!ruta) return;

      modulosUsuario.set(codigo, {
        codigo,
        title: m.nombre || codigo
      });
    });

    const codigosAsignados = new Set<string>();
    const grupos: MenuGrupoView[] = [];

    const gruposOrdenados = [...MENU_GRUPOS].sort((a, b) => a.orden - b.orden);

    gruposOrdenados.forEach(grupoConfig => {
      const items: MenuItemView[] = [];

      grupoConfig.modulos.forEach(codigo => {
        const modulo = modulosUsuario.get(codigo);
        const incluirPorHub =
          !modulo &&
          tieneContabilidadHub &&
          grupoConfig.id === 'contabilidad' &&
          !!MODULO_RUTAS[codigo];

        if (!modulo && !incluirPorHub) return;

        items.push({
          codigo,
          title: modulo?.title || CONTABILIDAD_SUBMODULOS_TITULOS[codigo] || codigo,
          url: MODULO_RUTAS[codigo],
          icon: MODULO_ICONOS[codigo] || 'th-large',
          iconFa: this.crearIconFa(MODULO_ICONOS[codigo] || 'th-large')
        });
        codigosAsignados.add(codigo);
      });

      if (items.length > 0) {
        grupos.push({
          id: grupoConfig.id,
          titulo: grupoConfig.titulo,
          icono: grupoConfig.icono,
          iconFa: this.crearIconFa(grupoConfig.icono),
          expandido: false,
          items
        });
      }
    });

    const otrosItems: MenuItemView[] = [];
    modulosUsuario.forEach((modulo, codigo) => {
      if (codigosAsignados.has(codigo)) return;

      otrosItems.push({
        codigo,
        title: modulo.title,
        url: MODULO_RUTAS[codigo],
        icon: MODULO_ICONOS[codigo] || 'th-large',
        iconFa: this.crearIconFa(MODULO_ICONOS[codigo] || 'th-large')
      });
    });

    if (otrosItems.length > 0) {
      grupos.push({
        id: MENU_GRUPO_OTROS.id,
        titulo: MENU_GRUPO_OTROS.titulo,
        icono: MENU_GRUPO_OTROS.icono,
        iconFa: this.crearIconFa(MENU_GRUPO_OTROS.icono),
        expandido: false,
        items: otrosItems
      });
    }

    this.menuGrupos = grupos;
    this.expandirGrupoActivo();
  }

  toggleGrupo(grupoId: string): void {
    const grupo = this.menuGrupos.find(g => g.id === grupoId);
    if (grupo) {
      grupo.expandido = !grupo.expandido;
    }
  }

  private crearIconFa(nombre: string): [string, string] {
    return ['fas', nombre];
  }

  private expandirGrupoActivo(): void {
    const rutaActual = this.router.url.split('?')[0];

    this.menuGrupos.forEach(grupo => {
      grupo.expandido = grupo.items.some(item =>
        rutaActual === item.url || rutaActual.startsWith(item.url + '/')
      );
    });
  }

  // ===============================
  // 🚪 LOGOUT MANUAL
  // ===============================
  logout() {
    this.forceLogout();
  }
  
}
