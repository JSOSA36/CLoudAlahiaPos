import { Component, OnInit } from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { Ingresos } from '../models/ingresos.models';
import { IngresosService } from 'src/app/servicios/ingresos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-ingresos-add',
  templateUrl: './ingresos-add.component.html',
  styleUrls: ['./ingresos-add.component.scss'],
})
export class IngresosAddComponent implements OnInit {

  ingreso: Ingresos = new Ingresos();
  cargando = false;

  categorias: string[] = [
    'Abono a Factura',
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
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    // ✅ Inicializar datos base
    this.inicializarIngreso();
  }

  /** 🔹 Inicializa el modelo con valores por defecto */
  inicializarIngreso() {
    this.ingreso = new Ingresos();
    this.ingreso.idEmpresa = this.parametro.GetIdEmpresa();
    this.ingreso.fechaRegistro = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    this.ingreso.formaPago = 'Efectivo';
    this.ingreso.categoria = 'Otro';
  }

  /** 🔹 Registrar ingreso */
  async guardarIngreso() {
    if (!this.ingreso.descripcion?.trim() || !this.ingreso.monto || this.ingreso.monto <= 0) {
      (await this.toastCtrl.create({
        message: 'Debe ingresar una descripción y un monto válido.',
        color: 'warning',
        duration: 1800,
        position: 'bottom'
      })).present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando ingreso...',
      spinner: 'crescent'
    });
    await loading.present();

    // ✅ Armar objeto completo
    const ingresoCompleto: Ingresos = {
      idIngreso: this.ingreso.idIngreso || 0,
      idEmpresa: this.parametro.GetIdEmpresa(),
      fechaRegistro: this.ingreso.fechaRegistro || new Date().toISOString().split('T')[0],
      descripcion: this.ingreso.descripcion.trim(),
      categoria: this.ingreso.categoria || 'Otro',
      origen: this.ingreso.origen?.trim() || '',
      monto: Number(this.ingreso.monto),
      formaPago: this.ingreso.formaPago || 'Efectivo',
      referencia: this.ingreso.referencia?.trim() || '',
      idUsuario: this.parametro.IdUsuario || 0,
      idFacturaHeader: this.ingreso.idFacturaHeader || 0,
      idCliente: this.ingreso.idCliente || 0,
      nota: this.ingreso.nota?.trim() || ''
    };

    console.log('📤 Enviando ingreso:', ingresoCompleto);

    this.ingresoSrv.insertIngreso(ingresoCompleto).subscribe({
      next: async () => {
        await loading.dismiss();
        (await this.toastCtrl.create({
          message: '✅ Ingreso registrado correctamente',
          color: 'success',
          duration: 1500,
          position: 'bottom'
        })).present();

        // 🔁 Reiniciar el formulario
        this.inicializarIngreso();
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('❌ Error al registrar el ingreso:', err);
        const detalle = err?.error?.message || err?.message || 'Error desconocido';
        (await this.toastCtrl.create({
          message: `Error al registrar el ingreso: ${detalle}`,
          color: 'danger',
          duration: 2500,
          position: 'bottom'
        })).present();
      }
    });
  }
}
