import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AlertController, Platform } from '@ionic/angular';
import { ParametrosService } from './servicios/parametros.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';
import { CitasService } from './servicios/citas.service';
import { PosComponent } from './Pos/pos/pos.component';

// ===============================
// 🧭 MAPAS FRONTEND (SOLO MENÚ)
// ===============================
export const MODULO_RUTAS: Record<string, string> = {
  DASHBOARD: '/folder/Inbox',
  ORDENES: '/Ordenes',

  REPORTE_VENTA: '/reporteventa',
  REPORTE_SERVICIOS: '/reporteservicios',
  REPORTE_COMISIONES: '/comisiones',

  CATEGORIAS: '/Listadocategorias',
  PRODUCTOS: '/listproducto',
  CLIENTES: '/clientemodal',
  CUMPLEANEROS: '/clientehappy',

  GASTOS: '/listadogastos',
  INGRESOS: '/Listadoingresos',

  CITAS: '/citas',
  HORARIO_ESTILISTA: '/horarioestilista',
  CONSUMO_LAVADORES: '/consumolavador',
  AREAS: '/area',
  EMPLEADOS_COMISION: '/listadoempleadocomision',
  HISTORICO_FACTURAS: '/historicofact',
  CUENTAS_COBRAR: '/cuentaxcobrar',
  DESCUENTOS: '/Descuento',
  POS: '/pos',
  NCF_SECUENCIAS: '/ncfsecuencias',
  EMPRESA: '/empresa',
  PARAMETROS: '/ParametrosConfig',
  EMPLEADOS: '/empleados',
  USUARIOS: '/usuarios',
  PERFILES: '/perfiles'
};

// ===============================
// 🎨 ICONOS
// ===============================
export const MODULO_ICONOS: Record<string, string> = {
  DASHBOARD: 'chart-bar',
  ORDENES: 'shopping-cart',
  NCF_SECUENCIAS: 'barcode',
  REPORTE_VENTA: 'file-invoice-dollar',
  REPORTE_SERVICIOS: 'chart-line',
  REPORTE_COMISIONES: 'money-bill-wave',
  CONSUMO_LAVADORES: 'tint',
  CATEGORIAS: 'th-large',
  PRODUCTOS: 'box-open',
  CLIENTES: 'users',
  CUMPLEANEROS: 'gift',
  PARAMETROS: 'gift',
  GASTOS: 'wallet',
  INGRESOS: 'cash-register',
  HISTORICO_FACTURAS: 'file-invoice',
  CITAS: 'calendar-alt',
  HORARIO_ESTILISTA: 'clock',

  AREAS: 'layer-group',
  EMPLEADOS_COMISION: 'percentage',

  CUENTAS_COBRAR: 'file-invoice',
  DESCUENTOS: 'tags',

  EMPRESA: 'building',

  EMPLEADOS: 'user-tie',
  USUARIOS: 'user',
  PERFILES: 'user-shield'
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  // ===============================
  // 🔹 MENÚ (NO SE TOCA)
  // ===============================
  public appPages: any[] = [];
  private destroy$ = new Subject<void>();

  // ===============================
  // 🔐 INACTIVIDAD / SESIÓN
  // ===============================
  private idleTimer: any;
  private warningTimer: any;
  private warningShown = false;
  private activeAlert: HTMLIonAlertElement | null = null;

  private readonly WARNING_BEFORE_EXPIRY = 5 * 60_000; // 5 minutos

  constructor(
    private router: Router,
    public _Parametro: ParametrosService,
    private alertCtrl: AlertController,
    private platform: Platform,
    private updates: SwUpdate,
private toastCtrl: ToastController,
private citasService: CitasService
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
  private forceLogout() {
    this.activeAlert?.dismiss();
    this.activeAlert = null;
    this._Parametro.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  // ===============================
  // 📋 MENÚ (IGUAL QUE ANTES)
  // ===============================
  private cargarMenu() {

    let modulos: any[] = [];

    try {
      modulos = JSON.parse(localStorage.getItem('menu_modulos') || '[]');
      if (!Array.isArray(modulos)) modulos = [];
    } catch {
      modulos = [];
    }

    modulos.sort((a: any, b: any) => a.moduloId - b.moduloId);

    if (!modulos.length) {
      this.appPages = [{
        title: 'Salir',
        url: '/login',
        icon: 'sign-out-alt'
      }];
      return;
    }

    const menuModulos = modulos
      .map((m: any) => {
        const ruta = MODULO_RUTAS[m.codigo];
        if (!ruta) return null;

        return {
          title: m.nombre,
          url: ruta,
          icon: MODULO_ICONOS[m.codigo] || 'th-large'
        };
      })
      .filter(Boolean);

    this.appPages = [
      ...menuModulos,
      {
        title: 'Salir',
        url: '/login',
        icon: 'sign-out-alt'
      }
    ];
  }

  // ===============================
  // 🚪 LOGOUT MANUAL
  // ===============================
  logout() {
    this.forceLogout();
  }
  
}
