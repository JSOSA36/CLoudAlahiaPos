import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { IngresosService } from 'src/app/servicios/ingresos.service';
import { Ingresos } from 'src/app/models/ingresos.models';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { IngresosAddComponent } from '../ingresos-add/ingresos-add.component';

@Component({
  selector: 'app-ingresos-list',
  templateUrl: './ingresos-list.component.html',
  styleUrls: ['./ingresos-list.component.scss'],
})
export class IngresosListComponent implements OnInit {

  ingresos: Ingresos[] = [];
  ingresosFiltrados: Ingresos[] = [];
  cargando = false;
  totalGeneral = 0;

  // 🔹 Filtros
  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = new Date().toISOString().split('T')[0];
  categoria: string = '';
  formaPago: string = '';

  categorias: string[] = [
    'Abono a Factura',
    'Saldo de Factura de Crédito',
    'Pago de Contado',
    'Pago por Arrendamiento',
    'Venta de Producto',
    'Servicio Prestado',
    'Ingreso Extraordinario',
    'Otro'
  ];

  formasPago: string[] = [
    'Efectivo',
    'Tarjeta',
    'Transferencia',
    'Cheque',
    'Depósito'
  ];

  constructor(
    private ingresoSrv: IngresosService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
     private modalCtrl: ModalController 
  ) {}

  ngOnInit() {
   const hoy = new Date();
  this.fechaInicio = hoy.toISOString().split('T')[0];
  this.fechaFin = hoy.toISOString().split('T')[0];

  // 🔹 Cargar solo los ingresos del día actual (si existen)
  this.cargarIngresos(true);
    
  }
async openModalAddIngreso() {
  const modal = await this.modalCtrl.create({
    component: IngresosAddComponent,
    cssClass: 'modal-small'
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  // Si se registró un ingreso → recargar la lista
  if (data?.recargar) {
    this.cargarIngresos();
  }
}

  ionViewWillEnter() {
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.fechaFin = new Date().toISOString().split('T')[0];
  }

  /** 🔹 Cargar ingresos desde el servidor */
async cargarIngresos(autoFiltroHoy: boolean = false) {
  const loading = await this.loadingCtrl.create({
    message: 'Cargando ingresos...',
    spinner: 'crescent'
  });

  await loading.present();

  const idEmpresa = this.parametro.GetIdEmpresa();

  this.ingresoSrv.getAllIngresos(idEmpresa)
    .pipe(
      timeout(30000),
      catchError(err => {
        console.error('❌ Error cargando ingresos:', err);
        this.mostrarError('Error al cargar los ingresos');
        return of([]);
      })
    )
    .subscribe({
      next: (res) => {
        this.ingresos = res || [];

        if (autoFiltroHoy) {
          // 🔹 Filtrar automáticamente solo los del día actual
          const hoy = new Date().toISOString().split('T')[0];
          this.ingresosFiltrados = this.ingresos.filter(
            i => i.fechaRegistro?.startsWith(hoy)
          );
        } else {
          this.ingresosFiltrados = [...this.ingresos];
        }

        this.calcularTotal();
      },
      complete: async () => {
        await loading.dismiss();
      }
    });
}


  /** 🔹 Aplicar filtros */
filtrar() {
  if (!this.ingresos || this.ingresos.length === 0) {
    console.warn('⚠️ No hay ingresos cargados todavía.');
    return;
  }

  console.log('🟦 --- DEPURACIÓN DE FILTRO ---');
  console.log('📅 fechaInicio:', this.fechaInicio);
  console.log('📅 fechaFin:', this.fechaFin);
  console.log('📦 categoria:', this.categoria);
  console.log('💳 formaPago:', this.formaPago);
  console.log('🔢 Total registros:', this.ingresos.length);

  // 🔹 Normalizar fechas sin zona horaria
  const inicio = this.fechaInicio
    ? new Date(this.fechaInicio.split('T')[0] + 'T00:00:00')
    : null;
  const fin = this.fechaFin
    ? new Date(this.fechaFin.split('T')[0] + 'T23:59:59')
    : null;

  console.log('🕐 Inicio normalizado:', inicio);
  console.log('🕐 Fin normalizado:', fin);

  // 🔹 Limpiar texto de categoría y forma de pago
  const categoriaSeleccionada =
    this.categoria && this.categoria !== 'Todas'
      ? this.categoria.trim().toLowerCase()
      : '';

  const formaPagoSeleccionada =
    this.formaPago && this.formaPago !== 'Todas'
      ? this.formaPago.trim().toLowerCase()
      : '';

  this.ingresosFiltrados = this.ingresos.filter((ing, i) => {
    const fechaCruda = ing.fechaRegistro;
    const fechaIngreso = new Date(
      fechaCruda.split('T')[0] + 'T12:00:00'
    ); // Evita error de zona horaria

    const dentroRango =
      (!inicio || fechaIngreso >= inicio) &&
      (!fin || fechaIngreso <= fin);

    const categoriaOk =
      !categoriaSeleccionada ||
      ing.categoria?.trim().toLowerCase() === categoriaSeleccionada;

    const formaPagoOk =
      !formaPagoSeleccionada ||
      ing.formaPago?.trim().toLowerCase() === formaPagoSeleccionada;

    // 🔹 Mostrar detalle de cada registro
    console.log(
      `#${i + 1} ➜ Fecha: ${fechaCruda} | ${fechaIngreso.toLocaleDateString()} | Cat: ${ing.categoria} | FP: ${ing.formaPago} | Rango: ${dentroRango} | CatOK: ${categoriaOk} | FPok: ${formaPagoOk}`
    );

    return dentroRango && categoriaOk && formaPagoOk;
  });

  console.log('✅ Filtrados:', this.ingresosFiltrados.length);
  this.calcularTotal();
}




  /** 🔹 Limpiar todos los filtros */
  limpiarFiltros() {
    this.fechaInicio = new Date().toISOString().split('T')[0];
    this.fechaFin = new Date().toISOString().split('T')[0];
    this.categoria = '';
    this.formaPago = '';
    this.ingresosFiltrados = [...this.ingresos];
    this.calcularTotal();
  }

  /** 🔹 Calcular el total general de los ingresos filtrados */
  calcularTotal() {
    this.totalGeneral = this.ingresosFiltrados.reduce(
      (acc, i) => acc + (i.monto || 0),
      0
    );
  }

  /** 🔹 Refrescar manualmente (por botón) */
  async Refrescar() {
    await this.cargarIngresos();

    const toast = await this.toastCtrl.create({
      message: 'Lista actualizada ✅',
      color: 'success',
      duration: 1200,
      position: 'bottom'
    });
    toast.present();
  }

  /** 🔹 Mostrar errores */
  private async mostrarError(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      color: 'danger',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
    this.cargando = false;
    this.loadingCtrl.dismiss();
  }
}
