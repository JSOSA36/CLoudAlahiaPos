import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { EstadoCuentaProveedor } from 'src/app/models/compras.models';
import { Proveedor } from 'src/app/models/proveedores';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ProveedoresService } from 'src/app/servicios/proveedores.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-estado-cuenta-proveedor',
  templateUrl: './estado-cuenta-proveedor.component.html',
  styleUrls: ['./estado-cuenta-proveedor.component.scss'],
})
export class EstadoCuentaProveedorComponent implements OnInit {
  proveedores: Proveedor[] = [];
  idProveedor = 0;
  desde = '';
  hasta = '';
  cargando = false;
  reporte: EstadoCuentaProveedor | null = null;

  constructor(
    private comprasService: ComprasService,
    private proveedoresService: ProveedoresService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.hasta = hoy.toISOString().substring(0, 10);
    this.desde = inicioMes.toISOString().substring(0, 10);
  }

  ngOnInit(): void {
    this.proveedoresService.listar(this.parametro.GetIdEmpresa()).subscribe({
      next: (d) => (this.proveedores = d || []),
      error: () => this.toast('No se pudieron cargar proveedores')
    });
  }

  consultar() {
    if (!this.idProveedor) {
      this.toast('Seleccione un proveedor');
      return;
    }
    if (!this.desde || !this.hasta) {
      this.toast('Indique el rango de fechas');
      return;
    }

    this.cargando = true;
    this.comprasService.estadoCuentaProveedor(
      this.parametro.GetIdEmpresa(),
      Number(this.idProveedor),
      this.desde,
      this.hasta
    ).subscribe({
      next: (data) => {
        this.reporte = data;
        this.cargando = false;
      },
      error: (e) => {
        this.cargando = false;
        this.reporte = null;
        this.toast(e?.error?.message || 'Error cargando estado de cuenta');
      }
    });
  }

  imprimir() {
    if (!this.reporte) {
      return;
    }
    window.print();
  }

  volver() {
    this.router.navigate(['/compras/cxp']);
  }

  etiquetaDias(dias?: number | null): string {
    if (dias == null) {
      return '—';
    }
    if (dias > 0) {
      return `${dias} día(s) vencido`;
    }
    if (dias < 0) {
      return `Vence en ${Math.abs(dias)} día(s)`;
    }
    return 'Vence hoy';
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'dark' });
    await t.present();
  }
}
