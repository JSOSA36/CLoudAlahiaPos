import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { clientes } from 'src/app/models/clientes';
import { EstadoCuentaCliente } from 'src/app/models/estado-cuenta-cliente.models';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { PagosFacturasClientesService } from 'src/app/servicios/PagosFacturasClientesService';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { pdfFecha, pdfMoneda } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-estado-cuenta-cliente',
  templateUrl: './estado-cuenta-cliente.component.html',
  styleUrls: ['./estado-cuenta-cliente.component.scss'],
})
export class EstadoCuentaClienteComponent implements OnInit {
  clientesList: clientes[] = [];
  idCliente = 0;
  desde = '';
  hasta = '';
  cargando = false;
  reporte: EstadoCuentaCliente | null = null;

  constructor(
    private pagosService: PagosFacturasClientesService,
    private clienteService: ClienteService,
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
    this.clienteService.GetListadoClientes(this.parametro.GetIdEmpresa()).subscribe({
      next: (d) => (this.clientesList = d || []),
      error: () => this.toast('No se pudieron cargar clientes'),
    });
  }

  consultar() {
    if (!this.idCliente) {
      this.toast('Seleccione un cliente');
      return;
    }
    if (!this.desde || !this.hasta) {
      this.toast('Indique el rango de fechas');
      return;
    }

    this.cargando = true;
    this.pagosService
      .estadoCuentaCliente(
        this.parametro.GetIdEmpresa(),
        Number(this.idCliente),
        this.desde,
        this.hasta
      )
      .subscribe({
        next: (data) => {
          this.reporte = data;
          this.cargando = false;
        },
        error: (e) => {
          this.cargando = false;
          this.reporte = null;
          this.toast(e?.error?.message || 'Error cargando estado de cuenta');
        },
      });
  }

  imprimir() {
    if (!this.reporte) return;
    emitirReporteTabla({
      titulo: 'Estado de Cuenta del Cliente',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: `${this.reporte.clienteNombre || ''} · Doc ${this.reporte.clienteDocumento || '—'} · ${pdfFecha(this.reporte.desde)} — ${pdfFecha(this.reporte.hasta)}`,
      kpis: [
        { label: 'Facturado', value: pdfMoneda(this.reporte.totalFacturado) },
        { label: 'Cobrado', value: pdfMoneda(this.reporte.totalCobrado) },
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
      nombreArchivo: `EstadoCuenta_${(this.reporte.clienteNombre || 'cliente').replace(/\s+/g, '_')}.pdf`,
      modo: 'open'
    });
  }

  volver() {
    this.router.navigate(['/cuentaxcobrar']);
  }

  etiquetaDias(dias?: number | null): string {
    if (dias == null) return '—';
    if (dias > 0) return `${dias} día(s) vencido`;
    if (dias < 0) return `Vence en ${Math.abs(dias)} día(s)`;
    return 'Vence hoy';
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2500, color: 'dark' });
    await t.present();
  }
}
