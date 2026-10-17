import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Reporte607, Reporte607Linea } from 'src/app/models/reporte607.models';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { pdfFecha, pdfMoneda, pdfNumero } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-reporte607',
  templateUrl: './reporte607.component.html',
  styleUrls: ['./reporte607.component.scss'],
})
export class Reporte607Component implements OnInit {
  desde = '';
  hasta = '';
  periodo = '';
  filtroTipo: 'TODOS' | 'E31' | 'E32' | 'NC' = 'TODOS';
  cargando = false;
  data: Reporte607 | null = null;

  constructor(
    private facturaService: FacturaHeaderService,
    public parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.desde = primero.toISOString().substring(0, 10);
    this.hasta = hoy.toISOString().substring(0, 10);
    this.periodo = hoy.toISOString().substring(0, 7).replace('-', '');
    this.cargarReporte();
  }

  get lineasDetalle(): Reporte607Linea[] {
    const lineas = this.data?.lineas || [];
    if (this.filtroTipo === 'TODOS') return lineas;
    return lineas.filter(l => this.prefijoNcf(l) === this.filtroTipo
      || (this.filtroTipo === 'NC' && this.esNotaCredito(l)));
  }

  get lineasExportables(): Reporte607Linea[] {
    return (this.data?.lineas || []).filter(l => this.esExportableTxt(l));
  }

  prefijoNcf(l: Reporte607Linea): string {
    return (l.ncf || '').trim().toUpperCase().slice(0, 3);
  }

  esNotaCredito(l: Reporte607Linea): boolean {
    const p = this.prefijoNcf(l);
    return l.tipoDocumentoAlahia === 'NotaCredito' || p === 'E33' || p === 'E34';
  }

  esExportableTxt(l: Reporte607Linea): boolean {
    const p = this.prefijoNcf(l);
    if (this.esNotaCredito(l)) return p === 'E33' || p === 'E34';
    return p === 'E31';
  }

  cargarReporte(): void {
    this.cargando = true;
    this.facturaService
      .GetReporte607(
        this.desde,
        this.hasta,
        this.parametro.GetIdEmpresa(),
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
            message: err?.error?.message || err?.error?.error || 'No se pudo generar el reporte 607',
            color: 'danger',
            duration: 2800
          });
          t.present();
        }
      });
  }

  etiquetaTipoDoc(l: Reporte607Linea): string {
    const p = this.prefijoNcf(l);
    if (p === 'E31') return 'E31';
    if (p === 'E32') return 'E32';
    if (p === 'E33' || p === 'E34' || l.tipoDocumentoAlahia === 'NotaCredito') return 'NC';
    return p || (l.tipoDocumentoAlahia === 'NotaCredito' ? 'NC' : 'Venta');
  }

  etiquetaEstadoTxt(l: Reporte607Linea): string {
    if (this.esExportableTxt(l)) {
      return l.esValidaParaEnvio ? 'OK' : (l.alertas?.[0] || 'Revisar');
    }
    if (this.prefijoNcf(l) === 'E32') return 'Consulta';
    return 'No TXT';
  }

  etiquetaTipoId(codigo: number): string {
    switch (codigo) {
      case 1: return 'RNC';
      case 2: return 'Cédula';
      case 3: return 'Pasaporte';
      default: return '—';
    }
  }

  descargarTxt(): void {
    if (!this.data?.contenidoTxt || !this.lineasExportables.length) {
      return;
    }
    const rnc = (this.data.rncEmpresa || 'SINRNC').replace(/\D/g, '');
    const periodo = this.data.periodo || this.periodo || '000000';
    const blob = new Blob([this.data.contenidoTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DGII_F_607_${rnc}_${periodo}.TXT`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportarPdf(): void {
    if (!this.lineasExportables.length) {
      return;
    }
    const r = this.data;
    emitirReporteTabla({
      titulo: 'Formato 607 — Ventas DGII',
      empresa: r?.nombreEmpresa,
      subtitulo: `RNC ${r?.rncEmpresa || '—'} · Período ${r?.periodo} · ${pdfFecha(r?.desde)} — ${pdfFecha(r?.hasta)}`,
      landscape: true,
      kpis: [
        { label: 'Registros TXT', value: String(r?.cantidadRegistros || 0) },
        { label: 'Con alertas', value: String(r?.cantidadConAlertas || 0) },
        { label: 'Monto facturado', value: pdfMoneda(r?.totalMontoFacturado) },
        { label: 'ITBIS', value: pdfMoneda(r?.totalItbisFacturado) }
      ],
      secciones: [{
        columnas: [
          { header: 'Fecha', width: 52 },
          { header: 'Tipo', width: 38 },
          { header: 'Cliente', width: '*' },
          { header: 'RNC/Céd', width: 70 },
          { header: 'NCF', width: 78 },
          { header: 'NCF Mod.', width: 70 },
          { header: 'Monto', width: 58, align: 'right' },
          { header: 'ITBIS', width: 52, align: 'right' },
          { header: 'Efectivo', width: 52, align: 'right' },
          { header: 'Transf.', width: 52, align: 'right' },
          { header: 'Tarjeta', width: 52, align: 'right' },
          { header: 'Crédito', width: 52, align: 'right' },
          { header: 'TXT', width: 55 }
        ],
        filas: this.lineasExportables.map(l => [
          pdfFecha(l.fechaComprobante),
          this.etiquetaTipoDoc(l),
          l.clienteNombre || '—',
          l.rncCedulaComprador || '—',
          l.ncf || '—',
          l.ncfModificado || '—',
          pdfNumero(l.montoFacturado),
          pdfNumero(l.itbisFacturado),
          pdfNumero(l.efectivo),
          pdfNumero(l.chequeTransferenciaDeposito),
          pdfNumero(l.tarjetaDebitoCredito),
          pdfNumero(l.ventaCredito),
          this.etiquetaEstadoTxt(l)
        ])
      }],
      nombreArchivo: `607_${r?.periodo || this.periodo}.pdf`
    });
  }
}
