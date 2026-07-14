import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { FacturaCompra, PagoProveedor } from 'src/app/models/compras.models';
import { CuentaFinanciera } from 'src/app/models/CuentaFinanciera.models';
import { ComprasService } from 'src/app/servicios/compras.service';
import { CuentaFinancieraService } from 'src/app/servicios/cuenta-financiera.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-historial-pagos-proveedor',
  templateUrl: './historial-pagos-proveedor.component.html',
  styleUrls: ['./historial-pagos-proveedor.component.scss'],
})
export class HistorialPagosProveedorComponent implements OnInit {
  @Input() factura!: FacturaCompra;

  pagos: PagoProveedor[] = [];
  cuentas: CuentaFinanciera[] = [];
  cargando = true;

  constructor(
    private modalCtrl: ModalController,
    private comprasService: ComprasService,
    private cuentaService: CuentaFinancieraService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const idEmpresa = this.parametros.GetIdEmpresa();

    this.cuentaService.getByEmpresa(idEmpresa).subscribe(d => {
      this.cuentas = d || [];
    });

    this.comprasService.obtenerPagos(this.factura.idOrdenCompraHeader, idEmpresa).subscribe({
      next: (data) => {
        this.pagos = data || [];
        this.cargando = false;
      },
      error: async () => {
        this.cargando = false;
        const t = await this.toastCtrl.create({
          message: 'No se pudo cargar el historial de pagos',
          duration: 2200,
          color: 'warning'
        });
        await t.present();
      }
    });
  }

  get totalPagado(): number {
    return this.pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
  }

  nombreCuenta(id?: number | null): string {
    if (!id) {
      return '—';
    }
    return this.cuentas.find(c => c.idCuentaFinanciera === id)?.nombre || `Cuenta #${id}`;
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
