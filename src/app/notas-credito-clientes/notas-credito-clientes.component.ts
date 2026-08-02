import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  NotaCreditoListado,
  NotasCreditoService,
  TicketNotaCredito
} from 'src/app/servicios/notas-credito.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { NotaCreditoPreviewComponent } from 'src/app/nota-credito-preview/nota-credito-preview.component';
import { NotaCreditoComercialComponent } from 'src/app/Modales/nota-credito-comercial/nota-credito-comercial.component';
import { PrintService } from 'src/app/servicios/print.services';

@Component({
  selector: 'app-notas-credito-clientes',
  templateUrl: './notas-credito-clientes.component.html',
  styleUrls: ['./notas-credito-clientes.component.scss'],
})
export class NotasCreditoClientesComponent implements OnInit {
  desde = new Date().toISOString().split('T')[0];
  hasta = new Date().toISOString().split('T')[0];
  busqueda = '';
  notas: NotaCreditoListado[] = [];
  notasFiltradas: NotaCreditoListado[] = [];
  cargando = false;
  reintentandoId: number | null = null;

  constructor(
    private notasCreditoService: NotasCreditoService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private printService: PrintService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async nuevaNota() {
    const modal = await this.modalCtrl.create({
      component: NotaCreditoComercialComponent,
      cssClass: 'modal-producto-grande'
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.refresh) this.cargar();
  }

  async cargar() {
    this.cargando = true;
    try {
      const lista = await firstValueFrom(
        this.notasCreditoService.listar(
          this.parametros.GetIdEmpresa(),
          this.desde,
          this.hasta,
          false
        )
      );
      this.notas = lista || [];
      this.filtrar();
    } catch {
      await this.toast('Error cargando notas de crédito', 'danger');
      this.notas = [];
      this.notasFiltradas = [];
    } finally {
      this.cargando = false;
    }
  }

  filtrar() {
    const value = this.busqueda.toLowerCase().trim();
    if (!value) {
      this.notasFiltradas = [...this.notas];
      return;
    }
    this.notasFiltradas = this.notas.filter(n =>
      (n.numeroDocumento || '').toLowerCase().includes(value)
      || (n.numeroFactura || '').toLowerCase().includes(value)
      || (n.nombreCliente || '').toLowerCase().includes(value)
      || (n.ncf || '').toLowerCase().includes(value)
      || (n.observacion || '').toLowerCase().includes(value)
    );
  }

  async verPreview(item: NotaCreditoListado) {
    try {
      const ticket = await firstValueFrom(
        this.notasCreditoService.getTicket(
          item.idNotaCredito,
          this.parametros.GetIdEmpresa()
        )
      );
      const modal = await this.modalCtrl.create({
        component: NotaCreditoPreviewComponent,
        componentProps: { ticket }
      });
      await modal.present();
    } catch {
      await this.toast('No se pudo cargar la vista previa', 'danger');
    }
  }

  async imprimirPos(item: NotaCreditoListado) {
    try {
      await firstValueFrom(
        this.printService.printNotaCredito(
          item.idNotaCredito,
          this.parametros.GetIdEmpresa()
        )
      );
      await this.toast('Enviado a impresión', 'success');
    } catch {
      await this.toast('No se pudo imprimir', 'danger');
    }
  }

  async reintentarEmision(item: NotaCreditoListado) {
    this.reintentandoId = item.idNotaCredito;
    try {
      await firstValueFrom(
        this.notasCreditoService.reintentarEmision(
          item.idNotaCredito,
          this.parametros.GetIdEmpresa(),
          this.parametros.IdUsuario
        )
      );
      await this.toast('Reintento enviado', 'success');
      await this.cargar();
    } catch (err: any) {
      const msg = typeof err?.error === 'string' ? err.error : 'Error al reintentar emisión';
      await this.toast(msg, 'danger');
    } finally {
      this.reintentandoId = null;
    }
  }

  private async toast(message: string, color: string) {
    (await this.toastCtrl.create({ message, duration: 2000, color })).present();
  }
}
