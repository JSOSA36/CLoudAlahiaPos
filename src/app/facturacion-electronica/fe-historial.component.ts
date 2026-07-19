import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

export interface EcfHistorialItem {
  idEcf: number;
  encf: string;
  tipoEcfDgii: number;
  estadoDocumento: string;
  estadoDGII: string;
  trackId: string;
  fechaEmision: string;
  fechaEnvio: string;
  montoTotal: number;
  rncComprador: string;
  nombreReceptor: string;
  mensajeRespuesta: string;
}

@Component({
  selector: 'app-fe-historial',
  templateUrl: './fe-historial.component.html',
  styleUrls: ['./fe-historial.component.scss'],
})
export class FeHistorialComponent implements OnInit {

  items: EcfHistorialItem[] = [];
  loading = false;

  filtroDesde = '';
  filtroHasta = '';
  filtroTipo: number | null = null;
  filtroEstado = '';

  tiposEcf = [
    { value: 31, label: 'e31 - Crédito Fiscal' },
    { value: 32, label: 'e32 - Consumo' },
    { value: 33, label: 'e33 - Nota Débito' },
    { value: 34, label: 'e34 - Nota Crédito' },
    { value: 44, label: 'e44 - Reg. Especiales' },
    { value: 45, label: 'e45 - Gubernamental' },
  ];

  estados = ['Aceptado', 'Rechazado', 'AceptadoCondicional', 'Pendiente', 'Error'];

  reprocesando: Record<number, boolean> = {};

  constructor(
    private feService: FacturacionElectronicaService,
    private parametro: ParametrosService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const hoy = new Date();
    this.filtroHasta = hoy.toISOString().substring(0, 10);
    const hace30 = new Date(hoy.getTime() - 30 * 86400000);
    this.filtroDesde = hace30.toISOString().substring(0, 10);
    this.buscar();
  }

  buscar() {
    this.loading = true;
    this.feService.getHistorial(
      this.parametro.IdEmpresa,
      this.filtroDesde, this.filtroHasta,
      this.filtroTipo, this.filtroEstado
    ).subscribe({
      next: (data) => { this.items = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  badgeColor(estado: string): string {
    if (!estado) return 'medium';
    const e = estado.toLowerCase();
    if (e === 'aceptado') return 'success';
    if (e === 'rechazado' || e === 'error') return 'danger';
    if (e.includes('condicional')) return 'warning';
    return 'medium';
  }

  limpiar() {
    this.filtroTipo = null;
    this.filtroEstado = '';
    this.buscar();
  }

  esReprocesable(item: EcfHistorialItem): boolean {
    const e = (item.estadoDGII || '').toLowerCase();
    return e === 'error' || e === 'rechazado';
  }

  async confirmarReprocesar(item: EcfHistorialItem) {
    const alert = await this.alertCtrl.create({
      header: 'Reprocesar documento',
      message: `¿Reenviar ${item.encf} al proveedor?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Reprocesar', handler: () => this.reprocesar(item) }
      ]
    });
    await alert.present();
  }

  reprocesar(item: EcfHistorialItem) {
    this.reprocesando[item.idEcf] = true;
    this.feService.reprocesar(item.idEcf).subscribe({
      next: () => {
        this.reprocesando[item.idEcf] = false;
        this.showToast(`${item.encf} reenviado`);
        this.buscar();
      },
      error: (err) => {
        this.reprocesando[item.idEcf] = false;
        this.showToast(err?.error?.mensajeError || 'Error al reprocesar', 'danger');
      }
    });
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    await t.present();
  }
}
