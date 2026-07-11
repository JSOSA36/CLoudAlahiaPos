import { Component, OnInit } from '@angular/core';
import {
  AlertController,
  ModalController,
  ToastController
} from '@ionic/angular';
import { DocumentosClinicosService } from 'src/app/servicios/documentos-clinicos.service';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { DocumentoClinico } from 'src/app/models/documento-clinico.models';
import { clientes } from 'src/app/models/clientes';
import { DocumentoClinicoFormComponent } from '../documento-clinico-form/documento-clinico-form.component';

@Component({
  selector: 'app-listado-documentos-clinicos',
  templateUrl: './listado-documentos-clinicos.component.html',
  styleUrls: ['./listado-documentos-clinicos.component.scss'],
})
export class ListadoDocumentosClinicosComponent implements OnInit {

  documentos: DocumentoClinico[] = [];
  documentosFiltrados: DocumentoClinico[] = [];
  clientes: clientes[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';
  filtroClienteId: number = 0;
  filtroTipoDocumento: string = '';
  tiposDocumento: string[] = [];

  constructor(
    private documentosSrv: DocumentosClinicosService,
    private clienteSrv: ClienteService,
    private parametro: ParametrosService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.inicializarFechas();
    this.cargarClientes();
    this.cargarDocumentos();
  }

  ionViewWillEnter() {
    this.inicializarFechas();
    this.cargarDocumentos();
  }

  private inicializarFechas() {
    const hoy = new Date().toISOString().split('T')[0];
    this.fechaInicio = hoy;
    this.fechaFin = hoy;
  }

  cargarClientes() {
    this.clienteSrv
      .GetListadoClientes(this.parametro.GetIdEmpresa())
      .subscribe({
        next: (data) => {
          this.clientes = data || [];
        }
      });
  }

  cargarDocumentos() {
    this.documentosSrv
      .getByEmpresa(this.parametro.GetIdEmpresa())
      .subscribe({
        next: (data) => {
          this.documentos = data || [];
          this.construirTiposDocumento();
          this.aplicarFiltros();
        },
        error: async () => {
          (
            await this.toastCtrl.create({
              message: 'Error cargando documentos clínicos',
              duration: 2000,
              color: 'danger'
            })
          ).present();
        }
      });
  }

  private construirTiposDocumento() {
    const tipos = new Set<string>();

    this.documentos.forEach(d => {
      if (d.tipoDocumento?.trim()) {
        tipos.add(d.tipoDocumento.trim());
      }
    });

    this.tiposDocumento = Array.from(tipos).sort();
  }

  aplicarFiltros() {
    const inicio = this.fechaInicio ? this.fechaInicio.split('T')[0] : '';
    const fin = this.fechaFin ? this.fechaFin.split('T')[0] : '';

    this.documentosFiltrados = this.documentos.filter(d => {
      const fecha = d.fechaEmision
        ? d.fechaEmision.split('T')[0]
        : '';

      if (inicio && fecha && fecha < inicio) return false;
      if (fin && fecha && fecha > fin) return false;

      if (
        this.filtroClienteId > 0 &&
        Number(d.idCliente) !== Number(this.filtroClienteId)
      ) {
        return false;
      }

      if (
        this.filtroTipoDocumento &&
        d.tipoDocumento !== this.filtroTipoDocumento
      ) {
        return false;
      }

      return true;
    });
  }

  limpiarFiltros() {
    this.filtroClienteId = 0;
    this.filtroTipoDocumento = '';
    this.inicializarFechas();
    this.aplicarFiltros();
  }

  trackById(_index: number, item: DocumentoClinico) {
    return item.idDocumentoClinico;
  }

  getNombreCliente(doc: DocumentoClinico): string {
    if (doc.nombreCliente) {
      return doc.nombreCliente;
    }

    const cliente = this.clientes.find(
      c => Number(c.idCliente) === Number(doc.idCliente)
    );

    return cliente?.nombreComercial || `Cliente #${doc.idCliente}`;
  }

  getEstadoColor(estado: string): string {
    switch ((estado || '').toUpperCase()) {
      case 'EMITIDO':
        return 'success';
      case 'BORRADOR':
        return 'warning';
      case 'ANULADO':
        return 'danger';
      default:
        return 'medium';
    }
  }

  async abrirFormulario(
    documento: DocumentoClinico | null,
    modo: 'crear' | 'editar' | 'ver'
  ) {
    const modal = await this.modalCtrl.create({
      component: DocumentoClinicoFormComponent,
      cssClass: 'modal-documento-clinico',
      componentProps: {
        documento: documento ? { ...documento } : null,
        modo
      }
    });

    modal.onDidDismiss().then((res) => {
      if (res.data?.recargar) {
        this.cargarDocumentos();
      }
    });

    await modal.present();
  }

  async crearDocumento() {
    await this.abrirFormulario(null, 'crear');
  }

  async editarDocumento(documento: DocumentoClinico) {
    await this.abrirFormulario(documento, 'editar');
  }

  async consultarDocumento(documento: DocumentoClinico) {
    if (!documento.idDocumentoClinico) {
      await this.abrirFormulario(documento, 'ver');
      return;
    }

    this.documentosSrv.getById(documento.idDocumentoClinico).subscribe({
      next: async (doc) => {
        await this.abrirFormulario(doc, 'ver');
      },
      error: async () => {
        (
          await this.toastCtrl.create({
            message: 'No se pudo cargar el documento completo',
            duration: 2000,
            color: 'danger'
          })
        ).present();
      }
    });
  }

  async anularDocumento(documento: DocumentoClinico) {
    const alert = await this.alertCtrl.create({
      header: 'Anular documento',
      message: `¿Desea anular el documento <b>${documento.numeroDocumento}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          role: 'destructive',
          handler: () => {
            const payload = {
              ...documento,
              estado: 'ANULADO'
            };

            this.documentosSrv.actualizar(payload).subscribe({
              next: async () => {
                (
                  await this.toastCtrl.create({
                    message: 'Documento anulado correctamente',
                    duration: 2000,
                    color: 'success'
                  })
                ).present();
                this.cargarDocumentos();
              },
              error: async () => {
                (
                  await this.toastCtrl.create({
                    message: 'Error al anular documento',
                    duration: 2000,
                    color: 'danger'
                  })
                ).present();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarDocumento(documento: DocumentoClinico) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar documento',
      message: `¿Eliminar permanentemente el documento <b>${documento.numeroDocumento}</b>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.documentosSrv
              .eliminar(documento.idDocumentoClinico)
              .subscribe({
                next: async () => {
                  (
                    await this.toastCtrl.create({
                      message: 'Documento eliminado',
                      duration: 2000,
                      color: 'success'
                    })
                  ).present();
                  this.cargarDocumentos();
                },
                error: async () => {
                  (
                    await this.toastCtrl.create({
                      message: 'Error al eliminar documento',
                      duration: 2000,
                      color: 'danger'
                    })
                  ).present();
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }
}
