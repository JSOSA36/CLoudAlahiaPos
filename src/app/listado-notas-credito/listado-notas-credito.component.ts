import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  NotaCreditoListado,
  NotasCreditoService,
  TicketNotaCredito
} from 'src/app/servicios/notas-credito.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { NotaCreditoPreviewComponent } from 'src/app/nota-credito-preview/nota-credito-preview.component';
import { PrintService } from 'src/app/servicios/print.services';
import { EcfPreviewLauncherService } from 'src/app/servicios/ecf-preview-launcher.service';

@Component({
  selector: 'app-listado-notas-credito',
  templateUrl: './listado-notas-credito.component.html',
  styleUrls: ['./listado-notas-credito.component.scss'],
})
export class ListadoNotasCreditoComponent implements OnInit {

  titulo = 'Listado de Devoluciones';
  subtitulo = 'Notas de crédito generadas por devoluciones';
  soloConComprobante = false;

  desde = new Date().toISOString().split('T')[0];
  hasta = new Date().toISOString().split('T')[0];
  busqueda = '';

  notas: NotaCreditoListado[] = [];
  notasFiltradas: NotaCreditoListado[] = [];
  cargando = false;
  reintentandoId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private notasCreditoService: NotasCreditoService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private printService: PrintService,
    private toastCtrl: ToastController,
    private ecfPreview: EcfPreviewLauncherService
  ) {}

  ngOnInit(): void {
    this.soloConComprobante =
      this.route.snapshot.data['soloConComprobante'] === true;

    if (this.soloConComprobante) {
      this.titulo = 'Notas de Crédito Aplicadas';
      this.subtitulo =
        'Comprobantes fiscales de notas de crédito emitidos';
    }

    this.cargar();
  }

  async cargar() {
    this.cargando = true;

    try {
      const lista = await firstValueFrom(
        this.notasCreditoService.listar(
          this.parametros.GetIdEmpresa(),
          this.desde,
          this.hasta,
          this.soloConComprobante
        )
      );

      this.notas = lista || [];
      this.filtrar();
    } catch {
      await this.toast('Error cargando el listado', 'danger');
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
      || (n.productosDevueltos || '').toLowerCase().includes(value)
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

      const abrioEcf = await this.ecfPreview.openFromNotaCredito({
        ticket,
        resultado: {
          idNotaCredito: item.idNotaCredito,
          numeroDocumento: item.numeroDocumento,
          ncf: item.ncf || ticket.ncf || '',
          total: item.total,
          mensaje: '',
          trackId: item.trackId || ticket.trackId,
          estadoDgii: item.estadoDgii || ticket.estadoDgii,
          emisionPendiente: item.emisionPendiente,
          mensajeEmision: ticket.mensajeEmision
        }
      });

      if (!abrioEcf) {
        await this.abrirPreview(ticket);
      }
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

      await this.toast('Ticket enviado a la impresora', 'success');
    } catch {
      await this.toast('No se pudo imprimir', 'danger');
    }
  }

  async reintentarEmision(item: NotaCreditoListado) {
    this.reintentandoId = item.idNotaCredito;
    try {
      const res = await firstValueFrom(
        this.notasCreditoService.reintentarEmision(
          item.idNotaCredito,
          this.parametros.GetIdEmpresa(),
          this.parametros.IdUsuario
        )
      );

      await this.toast(
        res?.mensaje || 'Reintento de emisión completado',
        res?.emisionPendiente ? 'warning' : 'success'
      );
      await this.cargar();
    } catch (err: any) {
      await this.toast(
        err?.error || 'No se pudo reintentar la emisión',
        'danger'
      );
    } finally {
      this.reintentandoId = null;
    }
  }

  private async abrirPreview(ticket: TicketNotaCredito) {
    const modal = await this.modalCtrl.create({
      component: NotaCreditoPreviewComponent,
      cssClass: 'modal-fullscreen',
      componentProps: { ticket }
    });

    await modal.present();
  }

  private async toast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ) {
    (
      await this.toastCtrl.create({
        message,
        duration: 2500,
        position: 'top',
        color
      })
    ).present();
  }
}
