import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Reporte607, Reporte607Linea } from 'src/app/models/reporte607.models';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-reporte607',
  templateUrl: './reporte607.component.html',
  styleUrls: ['./reporte607.component.scss'],
})
export class Reporte607Component implements OnInit {
  desde = '';
  hasta = '';
  periodo = '';
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
    return (this.data?.lineas || []).filter(l => !l.esResumenFacturaConsumo);
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

  etiquetaTipoDoc(tipo: string): string {
    return tipo === 'NotaCredito' ? 'NC' : 'Venta';
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
    if (!this.data?.contenidoTxt) {
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
}
