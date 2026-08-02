import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { MovimientoFinancieroService } from 'src/app/servicios/movimiento-financiero.service';

@Component({
  selector: 'app-modal-ajuste-financiero',
  templateUrl: './modal-ajuste-financiero.component.html',
  styleUrls: ['./modal-ajuste-financiero.component.scss'],
})
export class ModalAjusteFinancieroComponent implements OnInit {
  @Input() esEntrada = true;
  @Input() idCuentaFinanciera!: number;
  @Input() nombreCuenta = '';

  monto: number | null = null;
  motivo = '';
  observacion = '';
  guardando = false;

  constructor(
    private movimientoService: MovimientoFinancieroService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {}

  get titulo(): string {
    return this.esEntrada ? 'Ajuste de entrada' : 'Ajuste de salida';
  }

  get subtitulo(): string {
    return this.esEntrada
      ? 'Registra un ingreso manual en la cuenta seleccionada'
      : 'Registra una salida manual en la cuenta seleccionada';
  }

  get tipoLabel(): string {
    return this.esEntrada ? 'ENTRADA' : 'SALIDA';
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  async guardar(): Promise<void> {
    const monto = Number(this.monto);
    if (!monto || monto <= 0) {
      await this.toast('Indica un monto válido.', 'warning');
      return;
    }
    if (!this.motivo?.trim()) {
      await this.toast('El motivo es obligatorio.', 'warning');
      return;
    }
    if (!this.idCuentaFinanciera) {
      await this.toast('No hay cuenta seleccionada.', 'warning');
      return;
    }

    this.guardando = true;
    this.movimientoService
      .ajuste({
        idEmpresa: this.parametros.GetIdEmpresa(),
        idUsuario: this.parametros.IdUsuario,
        idCuentaFinanciera: this.idCuentaFinanciera,
        tipoMovimiento: this.esEntrada ? 'ENTRADA' : 'SALIDA',
        monto,
        motivo: this.motivo.trim(),
        observacion: this.observacion?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.guardando = false;
          this.modalCtrl.dismiss({ ok: true });
        },
        error: err => {
          this.guardando = false;
          this.toast(err?.error?.message || 'Error al registrar el ajuste.', 'danger');
        },
      });
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2400, color, position: 'top' });
    await t.present();
  }
}
