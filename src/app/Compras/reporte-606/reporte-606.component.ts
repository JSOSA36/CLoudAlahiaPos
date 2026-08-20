import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Reporte606 } from 'src/app/models/reporte606.models';
import { ComprasService } from 'src/app/servicios/compras.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import {
  FORMAS_PAGO_606,
  TIPOS_BIENES_SERVICIOS_606,
  etiquetaFormaPagoDgii
} from '../shared/dgii-606.catalog';
import { pdfFecha, pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-reporte-606',
  templateUrl: './reporte-606.component.html',
  styleUrls: ['./reporte-606.component.scss'],
})
export class Reporte606Component implements OnInit {
  readonly tiposBienes = TIPOS_BIENES_SERVICIOS_606;
  readonly formasPago = FORMAS_PAGO_606;

  desde = '';
  hasta = '';
  periodo = '';
  cargando = false;
  data: Reporte606 | null = null;

  constructor(
    private comprasService: ComprasService,
    public parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.desde = primero.toISOString().substring(0, 10);
    this.hasta = hoy.toISOString().substring(0, 10);
    this.periodo = hoy.toISOString().substring(0, 7).replace('-', '');
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.comprasService
      .reporte606(
        this.parametro.GetIdEmpresa(),
        this.desde,
        this.hasta,
        this.periodo || undefined
      )
      .subscribe({
        next: (res) => {
          this.data = res;
          if (res?.periodo) {
            this.periodo = res.periodo;
          }
          this.cargando = false;
        },
        error: async (err) => {
          this.cargando = false;
          this.data = null;
          const t = await this.toastCtrl.create({
            message: err?.error?.message || 'No se pudo generar el reporte 606',
            color: 'danger',
            duration: 2500
          });
          t.present();
        }
      });
  }

  etiquetaTipoBienes(codigo: number): string {
    return this.tiposBienes.find(t => t.codigo === codigo)?.etiqueta || String(codigo || '—');
  }

  etiquetaFormaPago(codigo: number): string {
    return etiquetaFormaPagoDgii(codigo);
  }

  descargarTxt(): void {
    if (!this.data?.contenidoTxt) {
      return;
    }
    const rnc = (this.data.rncEmpresa || 'SINRNC').replace(/\D/g, '');
    const periodo = this.data.periodo || this.periodo || '000000';
    const blob = new Blob([this.data.contenidoTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DGII_F_606_${rnc}_${periodo}.TXT`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportarPdf(): void {
    if (!this.data?.lineas?.length) {
      return;
    }
    emitirReporteTabla({
      titulo: 'Formato 606 — Compras DGII',
      empresa: this.data.nombreEmpresa,
      subtitulo: `RNC ${this.data.rncEmpresa || '—'} · Período ${this.data.periodo} · ${pdfFecha(this.data.desde)} — ${pdfFecha(this.data.hasta)}`,
      landscape: true,
      kpis: [
        { label: 'Registros', value: String(this.data.cantidadRegistros) },
        { label: 'Con alertas', value: String(this.data.cantidadConAlertas) },
        { label: 'Total facturado', value: pdfMoneda(this.data.totalMontoFacturado) },
        { label: 'ITBIS', value: pdfMoneda(this.data.totalItbisFacturado) }
      ],
      secciones: [{
        columnas: [
          { header: 'Fecha', width: 55 },
          { header: 'Origen', width: 45 },
          { header: 'Doc', width: 50 },
          { header: 'Proveedor', width: '*' },
          { header: 'RNC', width: 70 },
          { header: 'NCF', width: 80 },
          { header: 'Tipo', width: 55 },
          { header: 'Servicios', width: 58, align: 'right' },
          { header: 'Bienes', width: 58, align: 'right' },
          { header: 'ITBIS', width: 55, align: 'right' },
          { header: 'Pago', width: 50 },
          { header: 'TXT', width: 70 }
        ],
        filas: this.data.lineas.map(l => [
          pdfFecha(l.fechaComprobante),
          l.origenDocumento === 'Gasto' ? 'Gasto' : 'Compra',
          l.numeroDocumento || ('#' + l.idOrdenCompraHeader),
          l.proveedorNombre || '—',
          l.rncCedula || '—',
          l.ncf || '—',
          this.etiquetaTipoBienes(l.tipoBienesServicios),
          pdfNumero(l.montoFacturadoServicios),
          pdfNumero(l.montoFacturadoBienes),
          pdfNumero(l.itbisFacturado),
          this.etiquetaFormaPago(l.formaPagoDgii),
          l.esValidaParaEnvio ? 'OK' : (l.alertas?.[0] || 'Revisar')
        ])
      }],
      nombreArchivo: `606_${this.data.periodo || this.periodo}.pdf`
    });
  }
}
