import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { MovimientoFinancieroService } from 'src/app/servicios/movimiento-financiero.service';
import { CuentaFinancieraService } from 'src/app/servicios/cuenta-financiera.service';
import { ModalTransferenciaFinancieraComponent } from '../modal-transferencia-financiera/modal-transferencia-financiera.component';
import { ModalAjusteFinancieroComponent } from '../modal-ajuste-financiero/modal-ajuste-financiero.component';
import { MovimientoFinancieroListado } from 'src/app/models/Tesoreria.models';

@Component({
  selector: 'app-movimientos-financieros',
  templateUrl: './movimientos-financieros.component.html',
  styleUrls: ['./movimientos-financieros.component.scss'],
})
export class MovimientosFinancierosComponent implements OnInit {
  cargando = false;
  movimientos: MovimientoFinancieroListado[] = [];
  cuentas: any[] = [];
  seleccionados = new Set<number>();

  fechaDesde = new Date().toISOString().split('T')[0];
  fechaHasta = new Date().toISOString().split('T')[0];
  idCuenta: number | null = null;
  tipoMovimiento = '';
  categoria = '';
  estado = '';
  estadoConciliacion = '';
  search = '';

  totalEntradas = 0;
  totalSalidas = 0;
  totalTransferencias = 0;

  readonly tiposMovimiento = ['ENTRADA', 'SALIDA', 'TRANSFERENCIA'];
  readonly estados = ['CONFIRMADO', 'ANULADO', 'PENDIENTE'];
  readonly estadosConciliacion = ['PENDIENTE', 'CONCILIADO', 'EXCLUIDO', 'REVERSADO'];

  constructor(
    private movimientoService: MovimientoFinancieroService,
    private cuentaService: CuentaFinancieraService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tipo']) {
        this.tipoMovimiento = params['tipo'];
      }
      if (params['cuenta']) {
        this.idCuenta = Number(params['cuenta']) || null;
      }
    });
    this.CargarCuentas();
  }

  ionViewWillEnter(): void {
    if (this.idCuenta) {
      this.CargarMovimientos();
    }
  }

  CargarCuentas(): void {
    this.cuentaService.getByEmpresa(this.parametros.GetIdEmpresa()).subscribe({
      next: resp => {
        this.cuentas = resp;
        if (!this.idCuenta && resp.length === 1) {
          this.idCuenta = resp[0].idCuentaFinanciera;
        }
        if (this.idCuenta) {
          this.CargarMovimientos();
        }
      },
      error: err => console.error(err)
    });
  }

  CargarMovimientos(): void {
    if (!this.idCuenta) {
      this.mostrarToast('Seleccione una cuenta para consultar movimientos.', 'warning');
      return;
    }

    this.cargando = true;
    this.seleccionados.clear();

    this.movimientoService.consultar({
      idEmpresa: this.parametros.GetIdEmpresa(),
      idCuentaFinanciera: this.idCuenta,
      desde: this.fechaDesde,
      hasta: this.fechaHasta,
      tipoMovimiento: this.tipoMovimiento || undefined,
      categoria: this.categoria || undefined,
      estado: this.estado || undefined,
      estadoConciliacion: this.estadoConciliacion || undefined,
      search: this.search || undefined
    }).subscribe({
      next: resp => {
        this.movimientos = resp || [];
        this.CalcularTotales();
        this.cargando = false;
      },
      error: err => {
        console.error(err);
        this.mostrarToast(err?.error?.message || 'Error al consultar movimientos.', 'danger');
        this.cargando = false;
      }
    });
  }

  CalcularTotales(): void {
    this.totalEntradas = this.movimientos
      .filter(x => x.tipoMovimiento === 'ENTRADA' && x.estado !== 'ANULADO')
      .reduce((acc, item) => acc + item.monto, 0);

    this.totalSalidas = this.movimientos
      .filter(x => x.tipoMovimiento === 'SALIDA' && x.estado !== 'ANULADO')
      .reduce((acc, item) => acc + item.monto, 0);

    this.totalTransferencias = this.movimientos
      .filter(x => x.tipoMovimiento === 'TRANSFERENCIA' && x.estado !== 'ANULADO')
      .reduce((acc, item) => acc + item.monto, 0);
  }

  toggleSeleccion(item: MovimientoFinancieroListado): void {
    if (item.estado !== 'CONFIRMADO') {
      return;
    }
    if (this.seleccionados.has(item.idMovimientoFinanciero)) {
      this.seleccionados.delete(item.idMovimientoFinanciero);
    } else {
      this.seleccionados.add(item.idMovimientoFinanciero);
    }
  }

  estaSeleccionado(id: number): boolean {
    return this.seleccionados.has(id);
  }

  async NuevaTransferencia(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ModalTransferenciaFinancieraComponent,
      cssClass: 'modal-transferencia-fin'
    });

    modal.onDidDismiss().then(resp => {
      if (resp.data) {
        this.CargarMovimientos();
      }
    });

    await modal.present();
  }

  async RegistrarAjuste(esEntrada: boolean): Promise<void> {
    if (!this.idCuenta) {
      this.mostrarToast('Seleccione una cuenta.', 'warning');
      return;
    }

    const cuenta = this.cuentas.find(c => c.idCuentaFinanciera === this.idCuenta);
    const modal = await this.modalCtrl.create({
      component: ModalAjusteFinancieroComponent,
      cssClass: 'modal-ajuste-fin',
      componentProps: {
        esEntrada,
        idCuentaFinanciera: this.idCuenta,
        nombreCuenta: cuenta?.nombre || '',
      },
    });

    modal.onDidDismiss().then(resp => {
      if (resp.data?.ok) {
        this.mostrarToast('Ajuste registrado.', 'success');
        this.CargarMovimientos();
      }
    });

    await modal.present();
  }

  async AnularSeleccionados(): Promise<void> {
    if (this.seleccionados.size === 0) {
      this.mostrarToast('Seleccione movimientos confirmados para anular.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Anular movimientos',
      message: `¿Anular ${this.seleccionados.size} movimiento(s)? Esta acción quedará registrada.`,
      cssClass: 'alert-ajuste-fin',
      inputs: [{ name: 'motivo', type: 'textarea', placeholder: 'Motivo de anulación' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          role: 'destructive',
          handler: data => {
            if (!data.motivo?.trim()) {
              this.mostrarToast('Indique el motivo.', 'warning');
              return false;
            }
            const ids = [...this.seleccionados];
            let completados = 0;
            ids.forEach(id => {
              this.movimientoService.anular({
                idMovimientoFinanciero: id,
                idEmpresa: this.parametros.GetIdEmpresa(),
                idUsuario: this.parametros.IdUsuario,
                motivo: data.motivo.trim()
              }).subscribe({
                next: () => {
                  completados++;
                  if (completados === ids.length) {
                    this.mostrarToast('Movimientos anulados.', 'success');
                    this.CargarMovimientos();
                  }
                },
                error: err => this.mostrarToast(err?.error?.message || 'Error al anular.', 'danger')
              });
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  GetIcono(tipo: string): string {
    switch (tipo) {
      case 'ENTRADA': return 'arrow-down-outline';
      case 'SALIDA': return 'arrow-up-outline';
      case 'TRANSFERENCIA': return 'swap-horizontal-outline';
      default: return 'wallet-outline';
    }
  }

  GetColor(tipo: string): string {
    switch (tipo) {
      case 'ENTRADA': return '#22c55e';
      case 'SALIDA': return '#ef4444';
      case 'TRANSFERENCIA': return '#2563eb';
      default: return '#64748b';
    }
  }

  GetNombreCuenta(id: number): string {
    const cuenta = this.cuentas.find(x => x.idCuentaFinanciera === id);
    return cuenta?.nombre || '';
  }

  private async mostrarToast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
