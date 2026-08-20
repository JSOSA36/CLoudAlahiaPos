import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { EstadoCuentaProveedor } from 'src/app/models/compras.models';
import { Proveedor } from 'src/app/models/proveedores';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ProveedoresService } from 'src/app/servicios/proveedores.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { pdfFecha, pdfMoneda } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

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
    emitirReporteTabla({
      titulo: 'Estado de Cuenta del Proveedor',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: `${this.reporte.proveedorNombre || ''} · RNC ${this.reporte.proveedorRnc || '—'} · ${pdfFecha(this.reporte.desde)} — ${pdfFecha(this.reporte.hasta)}`,
      kpis: [
        { label: 'Comprado', value: pdfMoneda(this.reporte.totalComprado) },
        { label: 'Pagado', value: pdfMoneda(this.reporte.totalPagado) },
        { label: 'Balance pendiente', value: pdfMoneda(this.reporte.balancePendiente) }
      ],
      secciones: [
        {
          titulo: 'Movimientos',
          columnas: [
            { header: 'Fecha', width: 62 },
            { header: 'Documento', width: 70 },
            { header: 'Concepto', width: '*' },
            { header: 'Débito', width: 70, align: 'right' },
            { header: 'Crédito', width: 70, align: 'right' },
            { header: 'Balance', width: 75, align: 'right' }
          ],
          filas: (this.reporte.movimientos || []).map(m => [
            pdfFecha(m.fecha),
            m.numeroDocumento || '',
            m.concepto,
            m.debito ? pdfMoneda(m.debito) : '',
            m.credito ? pdfMoneda(m.credito) : '',
            pdfMoneda(m.balance)
          ])
        },
        {
          titulo: 'Facturas pendientes',
          columnas: [
            { header: 'Fecha', width: 62 },
            { header: 'Documento', width: 80 },
            { header: 'Original', width: 75, align: 'right' },
            { header: 'Pagado', width: 75, align: 'right' },
            { header: 'Pendiente', width: 75, align: 'right' },
            { header: 'Vencimiento', width: '*' }
          ],
          filas: (this.reporte.facturasPendientes || []).map(f => [
            pdfFecha(f.fecha),
            f.numeroDocumento || '',
            pdfMoneda(f.montoOriginal),
            pdfMoneda(f.pagado),
            pdfMoneda(f.pendiente),
            `${pdfFecha(f.fechaVencimiento)} · ${this.etiquetaDias(f.diasVencimiento)}`
          ])
        }
      ],
      nombreArchivo: `EstadoCuentaProv_${(this.reporte.proveedorNombre || 'proveedor').replace(/\s+/g, '_')}.pdf`,
      modo: 'open'
    });
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
