import { Component, OnInit } from '@angular/core';
import {
  AlertController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  ConduceDto,
  EstadoEntregaFacturaDto,
} from 'src/app/models/conduces.models';
import { ConducePrintComponent } from 'src/app/conduce-print/conduce-print.component';
import { ConducesService } from 'src/app/servicios/conduces.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EmitirConduceComponent } from './emitir-conduce.component';

@Component({
  selector: 'app-conduces',
  templateUrl: './conduces.component.html',
  styleUrls: ['./conduces.component.scss'],
})
export class ConducesComponent implements OnInit {
  conduces: ConduceDto[] = [];
  loading = false;
  desde = '';
  hasta = '';
  q = '';

  constructor(
    private conducesSrv: ConducesService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const d = new Date();
    d.setDate(hoy.getDate() - 30);
    this.desde = d.toISOString().substring(0, 10);
    this.hasta = hoy.toISOString().substring(0, 10);
    this.buscar();
  }

  get idEmpresa(): number {
    return this.parametros.GetIdEmpresa();
  }

  buscar(): void {
    this.loading = true;
    this.conducesSrv
      .listar(this.idEmpresa, {
        desde: this.desde || undefined,
        hasta: this.hasta || undefined,
        q: this.q || undefined,
      })
      .subscribe({
        next: (data) => {
          this.conduces = data || [];
          this.loading = false;
        },
        error: async (err) => {
          this.loading = false;
          await this.toast(err?.error?.message || 'Error al listar conduces', 'danger');
        },
      });
  }

  async nuevo(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: EmitirConduceComponent,
      cssClass: 'modal-full',
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.refresh) this.buscar();
    if (data?.conduce) {
      await this.imprimir(data.conduce);
    }
  }

  async imprimir(item: ConduceDto): Promise<void> {
    let conduce = item;
    let estado: EstadoEntregaFacturaDto | null = null;

    try {
      conduce = await firstValueFrom(
        this.conducesSrv.getById(item.idConduceHeader, this.idEmpresa)
      );
      estado = await firstValueFrom(
        this.conducesSrv.estadoEntrega(item.idFacturaHeader, this.idEmpresa)
      );
    } catch {
      // usa lo disponible en el listado
    }

    const modal = await this.modalCtrl.create({
      component: ConducePrintComponent,
      cssClass: 'modal-fullscreen',
      componentProps: {
        conduce,
        estado,
        empresa: this.parametros._Empresa,
        nombreEmpresa: this.parametros.NombreEmpresa,
      },
    });
    await modal.present();
  }

  async anular(item: ConduceDto): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Anular conduce',
      message: `¿Anular ${item.numero}? Las cantidades volverán a pendientes.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          role: 'destructive',
          handler: () => {
            this.conducesSrv.anular(item.idConduceHeader, this.idEmpresa).subscribe({
              next: async () => {
                await this.toast('Conduce anulado', 'success');
                this.buscar();
              },
              error: async (err) => {
                await this.toast(err?.error?.message || 'No se pudo anular', 'danger');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
