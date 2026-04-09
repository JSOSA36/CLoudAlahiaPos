import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { facturaheader } from 'src/app/models/facturaheader';
import { PagosFacturasClientesService } from '../servicios/PagosFacturasClientesService';
import { PagosFacturasClientes } from '../Modales/PagosFacturasClientes .models';

@Component({
  selector: 'app-pago-factura',
  templateUrl: './pago-factura.component.html',
  styleUrls: ['./pago-factura.component.scss'],
})
export class PagoFacturaComponent {
  /** 🔹 Factura recibida desde el componente padre */
  private _factura!: facturaheader;
  @Input() 
  set factura(value: facturaheader) {
    this._factura = value;
    if (value) console.log('📦 Factura recibida:', value);
  }
  get factura(): facturaheader {
    return this._factura;
  }

  /** 🔹 Si se abre en modo historial o registro */
  private _modo: 'pago' | 'historial' = 'pago';
  @Input()
  set modo(value: 'pago' | 'historial') {
    this._modo = value;
    console.log('🎯 Modo establecido:', value);

    // Si el modo cambia a historial, cargamos los pagos inmediatamente
    if (value === 'historial' && this.factura) {
      this.cargarHistorialPagos();
    }
  }
  get modo() {
    return this._modo;
  }

  /** 🔹 Campos del formulario de pago */
  montoAbono = 0;
  metodoPago = 'Efectivo';
  nota = '';

  /** 🔹 Estado */
  cargando = false;

  /** 🔹 Listado de pagos (para historial) */
  pagos: PagosFacturasClientes[] = [];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private _pagosSrv: PagosFacturasClientesService
  ) {}

  /** 📜 Cargar historial de pagos de la factura */
  cargarHistorialPagos() {
    if (!this.factura) return;
    this.cargando = true;

    this._pagosSrv.getPagosByFactura(this.factura.idFacturaHeader).subscribe({
      next: (res) => {
        this.pagos = res || [];
        this.cargando = false;
        console.log('📜 Historial de pagos cargado:', this.pagos);
      },
      error: async () => {
        this.cargando = false;
        (await this.toastCtrl.create({
          message: 'Error cargando historial de pagos',
          duration: 1500,
          color: 'danger',
        })).present();
      },
    });
  }

  /** 💵 Procesar abono o pago total */
  async procesarPago() {
    if (!this.montoAbono || this.montoAbono <= 0) {
      (await this.toastCtrl.create({
        message: 'Debe ingresar un monto válido',
        duration: 1500,
        color: 'warning',
      })).present();
      return;
    }

    if (this.montoAbono > (this.factura.pendiente || 0)) {
      (await this.toastCtrl.create({
        message: 'El abono no puede ser mayor al monto pendiente',
        duration: 1500,
        color: 'danger',
      })).present();
      return;
    }

    this.cargando = true;

    const pago: PagosFacturasClientes = {
      id: 0,
      idFacturaHeader: this.factura.idFacturaHeader,
      numeroDocumento: '',
      idCliente: this.factura.iDCliente || 0,
      formaPago: this.metodoPago,
      monto: this.montoAbono,
      fechaInseccion: new Date().toISOString(),
      nota: this.nota,
    };

    console.log('📤 Enviando pago:', pago);

    this._pagosSrv.registrarPago(this.factura.idFacturaHeader, pago).subscribe({
      next: async () => {
        this.cargando = false;
        (await this.toastCtrl.create({
          message: 'Pago registrado correctamente',
          duration: 1500,
          color: 'success',
        })).present();

        if (this.modo === 'historial') {
          this.cargarHistorialPagos();
        }

        this.modalCtrl.dismiss({ actualizado: true });
      },
      error: async (err) => {
        this.cargando = false;
        console.error('❌ Error registrando pago:', err);
        (await this.toastCtrl.create({
          message: 'Error al registrar el pago',
          duration: 1500,
          color: 'danger',
        })).present();
      },
    });
  }

  cerrarModal() {
    this.modalCtrl.dismiss();
  }
}
