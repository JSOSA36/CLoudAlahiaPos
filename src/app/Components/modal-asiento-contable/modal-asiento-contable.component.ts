import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { AsientoContableService } from 'src/app/servicios/asiento-contable.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AsientoContable, AsientoContableDetalle } from 'src/app/models/AsientoContable.models';
import { CuentaContable } from 'src/app/models/CuentaContable.models';

@Component({
  selector: 'app-modal-asiento-contable',
  templateUrl: './modal-asiento-contable.component.html',
  styleUrls: ['./modal-asiento-contable.component.scss'],
})
export class ModalAsientoContableComponent implements OnInit {
  @Input() asiento: AsientoContable | null = null;
  @Input() cuentas: CuentaContable[] = [];
  @Input() soloLectura = false;

  guardando = false;
  isEdit = false;

  model: AsientoContable = {
    idEmpresa: 0,
    fecha: new Date().toISOString(),
    concepto: '',
    estado: 'Confirmado',
    detalles: []
  };

  constructor(
    private asientoService: AsientoContableService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.model.idEmpresa = this.parametros.GetIdEmpresa();

    if (this.asiento) {
      this.isEdit = true;
      this.model = JSON.parse(JSON.stringify(this.asiento));
      if (!this.model.detalles?.length) {
        this.model.detalles = [];
      }
    } else {
      this.agregarLinea();
      this.agregarLinea();
    }
  }

  get totalDebito(): number {
    return (this.model.detalles || []).reduce((s, l) => s + (Number(l.debito) || 0), 0);
  }

  get totalCredito(): number {
    return (this.model.detalles || []).reduce((s, l) => s + (Number(l.credito) || 0), 0);
  }

  get balanceado(): boolean {
    return this.totalDebito > 0 && this.totalDebito === this.totalCredito;
  }

  agregarLinea(): void {
    if (!this.model.detalles) this.model.detalles = [];
    this.model.detalles.push({
      idCuentaContable: 0,
      debito: 0,
      credito: 0,
      referencia: ''
    });
  }

  eliminarLinea(index: number): void {
    if (this.model.detalles.length <= 2) return;
    this.model.detalles.splice(index, 1);
  }

  onDebitoChange(linea: AsientoContableDetalle): void {
    if (linea.debito > 0) linea.credito = 0;
  }

  onCreditoChange(linea: AsientoContableDetalle): void {
    if (linea.credito > 0) linea.debito = 0;
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  async guardar(): Promise<void> {
    if (!this.balanceado) {
      await this.mostrarError('El asiento debe estar balanceado (Débito = Crédito).');
      return;
    }

    if (!this.model.concepto?.trim()) {
      await this.mostrarError('El concepto es obligatorio.');
      return;
    }

    const lineasInvalidas = this.model.detalles.some(l => !l.idCuentaContable);
    if (lineasInvalidas) {
      await this.mostrarError('Seleccione una cuenta en cada línea.');
      return;
    }

    this.guardando = true;

    if (this.isEdit && this.model.idAsientoContable) {
      this.asientoService.update(this.model).subscribe({
        next: async () => {
          this.guardando = false;
          await this.modalCtrl.dismiss({ guardado: true });
        },
        error: async (err: any) => {
          this.guardando = false;
          await this.mostrarError(err?.error?.message || 'No se pudo guardar el asiento.');
        }
      });
      return;
    }

    this.asientoService.create(this.model).subscribe({
      next: async () => {
        this.guardando = false;
        await this.modalCtrl.dismiss({ guardado: true });
      },
      error: async (err: any) => {
        this.guardando = false;
        await this.mostrarError(err?.error?.message || 'No se pudo guardar el asiento.');
      }
    });
  }

  private async mostrarError(message: string): Promise<void> {
    const alert = await this.alertCtrl.create({ header: 'Error', message, buttons: ['OK'] });
    await alert.present();
  }
}
