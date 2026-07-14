import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { AsientoContableService } from 'src/app/servicios/asiento-contable.service';
import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AsientoContable } from 'src/app/models/AsientoContable.models';
import { CuentaContable } from 'src/app/models/CuentaContable.models';
import { ModalAsientoContableComponent } from '../modal-asiento-contable/modal-asiento-contable.component';

@Component({
  selector: 'app-contabilidad-asientos',
  templateUrl: './contabilidad-asientos.component.html',
  styleUrls: ['./contabilidad-asientos.component.scss'],
})
export class ContabilidadAsientosComponent implements OnInit {
  cargando = false;
  asientos: AsientoContable[] = [];
  cuentas: CuentaContable[] = [];
  fechaInicio = '';
  fechaFin = '';

  constructor(
    private asientoService: AsientoContableService,
    private cuentaService: CuentaContableService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = inicioMes.toISOString();
    this.fechaFin = hoy.toISOString();
    this.cargarCuentas();
    this.cargar();
  }

  cargarCuentas(): void {
    this.cuentaService.getByEmpresa(this.parametros.GetIdEmpresa()).subscribe({
      next: (cuentas) => {
        this.cuentas = cuentas.filter(c => c.activa);
      }
    });
  }

  cargar(): void {
    this.cargando = true;
    this.asientoService.getByEmpresa(
      this.parametros.GetIdEmpresa(),
      this.fechaInicio,
      this.fechaFin
    ).subscribe({
      next: (resp) => {
        this.asientos = resp;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  async nuevoAsiento(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ModalAsientoContableComponent,
      componentProps: {
        asiento: null,
        cuentas: this.cuentas
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.guardado) this.cargar();
  }

  async verAsiento(asiento: AsientoContable): Promise<void> {
    this.asientoService.getById(asiento.idAsientoContable!, this.parametros.GetIdEmpresa()).subscribe({
      next: async (detalle) => {
        const modal = await this.modalCtrl.create({
          component: ModalAsientoContableComponent,
          componentProps: {
            asiento: detalle,
            cuentas: this.cuentas,
            soloLectura: detalle.esAutomatico || detalle.estado === 'Anulado'
          }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data?.guardado) this.cargar();
      }
    });
  }

  async anularAsiento(asiento: AsientoContable): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Anular asiento',
      message: `¿Anular el asiento ${asiento.numero}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          role: 'destructive',
          handler: () => {
            this.asientoService.anular(asiento.idAsientoContable!, this.parametros.GetIdEmpresa()).subscribe({
              next: () => this.cargar(),
              error: async (err) => {
                const a = await this.alertCtrl.create({
                  header: 'Error',
                  message: err?.error?.message || 'No se pudo anular.',
                  buttons: ['OK']
                });
                await a.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
