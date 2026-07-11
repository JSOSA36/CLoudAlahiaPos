import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ModalController, ToastController } from '@ionic/angular';

import { DocumentosClinicosService } from 'src/app/servicios/documentos-clinicos.service';

import { PlantillasDocumentosClinicosService } from 'src/app/servicios/plantillas-documentos-clinicos.service';

import { ParametrosService } from 'src/app/servicios/parametros.service';

import { DocumentoClinico } from 'src/app/models/documento-clinico.models';

import { PlantillaDocumentoClinico } from 'src/app/models/plantilla-documento-clinico.models';

import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';

import { clientes } from 'src/app/models/clientes';

import {
  generarHtmlDocumentoClinico,
  prepararHtmlParaImpresion,
  VariablesPlantillaDocumento
} from '../documento-clinico-plantilla.util';



@Component({

  selector: 'app-documento-clinico-form',

  templateUrl: './documento-clinico-form.component.html',

  styleUrls: ['./documento-clinico-form.component.scss'],

})

export class DocumentoClinicoFormComponent implements OnInit {



  @Input() documento: DocumentoClinico | null = null;

  @Input() modo: 'crear' | 'editar' | 'ver' = 'crear';



  form: DocumentoClinico = new DocumentoClinico();

  tiposDocumento: string[] = [];

  clienteSeleccionado: clientes | null = null;



  private plantillaActual: PlantillaDocumentoClinico | null = null;



  estados = ['BORRADOR', 'EMITIDO', 'ANULADO'];

  vistaHtmlDocumento: SafeHtml | null = null;

  @ViewChild('docIframe') docIframe?: ElementRef<HTMLIFrameElement>;

  constructor(

    private documentosSrv: DocumentosClinicosService,

    private plantillasSrv: PlantillasDocumentosClinicosService,

    private parametro: ParametrosService,

    private modalCtrl: ModalController,

    private toastCtrl: ToastController,

    private sanitizer: DomSanitizer

  ) {}



  ngOnInit() {

    this.cargarTiposDocumento();



    if (this.documento) {
      this.form = { ...this.documento };

      if (this.form.fechaEmision) {
        this.form.fechaEmision =
          this.form.fechaEmision.split('T')[0];
      }

      if (this.form.idCliente) {
        this.clienteSeleccionado = {
          idCliente: this.form.idCliente,
          nombreComercial: this.form.nombreCliente || ''
        } as clientes;
      }

      this.cargarDatosDesdeJSON();

      if (this.form.tipoDocumento) {
        this.resolverPlantilla(this.form.tipoDocumento, false);
      } else if (this.modo === 'ver') {
        this.prepararVistaDocumento();
      }
    } else {

      this.form.idEmpresa = this.parametro.GetIdEmpresa();

      this.form.idUsuarioCreacion = this.parametro.IdUsuario;

      this.form.estado = 'EMITIDO';

      this.form.fechaEmision = new Date().toISOString().split('T')[0];

    }

  }



  get titulo(): string {

    switch (this.modo) {

      case 'ver':

        return 'Consultar documento clínico';

      case 'editar':

        return 'Editar documento clínico';

      default:

        return 'Nuevo documento clínico';

    }

  }



  get soloLectura(): boolean {

    return this.modo === 'ver';

  }



  get puedeCambiarTipo(): boolean {

    return this.modo === 'crear' && !this.soloLectura;

  }



  get esCertificado(): boolean {

    return this.form.tipoDocumento === 'Certificado Médico';

  }



  get esReceta(): boolean {

    return this.form.tipoDocumento === 'Receta Médica';

  }



  private esContenidoHtmlInvalido(html?: string | null): boolean {
    const valor = (html || '').trim();
    if (!valor) {
      return true;
    }

    const lower = valor.toLowerCase();
    if (lower === '...html...' || lower.includes('...html...')) {
      return true;
    }

    if (valor.length < 80) {
      return true;
    }

    return !valor.includes('<');
  }

  private prepararVistaDocumento(): void {
    let html = this.form.contenidoHTMLFinal?.trim();

    if (this.esContenidoHtmlInvalido(html)) {
      const regenerado = this.generarContenidoHTMLFinal().trim();
      if (!this.esContenidoHtmlInvalido(regenerado)) {
        html = regenerado;
        this.form.contenidoHTMLFinal = regenerado;
      }
    }

    this.vistaHtmlDocumento = html && !this.esContenidoHtmlInvalido(html)
      ? this.sanitizer.bypassSecurityTrustHtml(prepararHtmlParaImpresion(html))
      : null;
  }

  async imprimir(): Promise<void> {
    const iframe = this.docIframe?.nativeElement;
    const iframeWindow = iframe?.contentWindow;

    if (iframeWindow && this.vistaHtmlDocumento) {
      iframeWindow.focus();
      iframeWindow.print();
      return;
    }

    let html = this.form.contenidoHTMLFinal?.trim();

    if (this.esContenidoHtmlInvalido(html)) {
      html = this.generarContenidoHTMLFinal().trim();
    }

    if (!html) {
      (
        await this.toastCtrl.create({
          message: 'No hay contenido para imprimir.',
          duration: 2000,
          color: 'warning'
        })
      ).present();
      return;
    }

    html = prepararHtmlParaImpresion(html);

    const frame = document.createElement('iframe');
    frame.style.cssText =
      'position:fixed;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!frameDoc || !frame.contentWindow) {
      document.body.removeChild(frame);
      (
        await this.toastCtrl.create({
          message: 'No se pudo preparar la impresión.',
          duration: 2000,
          color: 'danger'
        })
      ).present();
      return;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    const limpiar = () => {
      if (frame.parentNode) {
        document.body.removeChild(frame);
      }
    };

    frame.contentWindow.onafterprint = limpiar;

    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(limpiar, 2000);
    }, 350);
  }

  cargarTiposDocumento() {

    this.plantillasSrv

      .getTiposDocumento(this.parametro.GetIdEmpresa())

      .subscribe({

        next: (tipos) => {

          this.tiposDocumento = tipos;

        }

      });

  }



  private cargarDatosDesdeJSON() {

    if (!this.form.datosJSON?.trim()) {

      return;

    }



    try {

      const datos = JSON.parse(this.form.datosJSON);



      if (datos.medicamentos) {

        this.form.medicamentos = datos.medicamentos;

      }



      if (datos.indicaciones) {

        this.form.indicaciones = datos.indicaciones;

      }



      if (datos.cedulaCliente) {
        if (!this.clienteSeleccionado) {
          this.clienteSeleccionado = {
            idCliente: this.form.idCliente,
            nombreComercial: datos.nombreCliente || this.form.nombreCliente || '',
            cedulaRNC: datos.cedulaCliente
          } as clientes;
        } else {
          this.clienteSeleccionado.cedulaRNC = datos.cedulaCliente;
        }
      }

    } catch {

      // datosJSON inválido: se ignoran campos adicionales

    }

  }



  async seleccionarCliente() {

    if (this.soloLectura) return;



    const modal = await this.modalCtrl.create({

      component: ClientesComponent,

      componentProps: { isModalSeleccion: true }

    });



    await modal.present();



    const { data } = await modal.onDidDismiss();



    if (data?.cliente) {

      this.clienteSeleccionado = data.cliente;

      this.form.idCliente =

        data.cliente.idCliente ?? data.cliente.iDCliente ?? 0;

    }

  }



  onTipoDocumentoChange() {

    this.resolverPlantilla(this.form.tipoDocumento, true);

  }



  private resolverPlantilla(tipoDocumento: string, mostrarError: boolean) {

    if (!tipoDocumento?.trim()) {

      this.plantillaActual = null;

      this.form.idPlantilla = 0;

      return;

    }



    this.plantillasSrv

      .getPlantillaPorTipo(

        this.parametro.GetIdEmpresa(),

        tipoDocumento

      )

      .subscribe({

        next: async (plantilla) => {

          if (!plantilla) {

            this.plantillaActual = null;

            this.form.idPlantilla = 0;



            if (mostrarError) {

              (

                await this.toastCtrl.create({

                  message:

                    'No existe una plantilla configurada para este tipo de documento.',

                  duration: 2500,

                  color: 'warning'

                })

              ).present();

            }



            return;

          }



          this.plantillaActual = plantilla;

          this.form.idPlantilla = plantilla.idPlantilla;

          this.form.tipoDocumento = plantilla.tipoDocumento;

          if (
            this.modo === 'ver' ||
            this.esContenidoHtmlInvalido(this.form.contenidoHTMLFinal)
          ) {
            this.prepararVistaDocumento();
          }

        }

      });

  }



  private armarVariablesPlantilla(): VariablesPlantillaDocumento {

    return {

      cliente: this.clienteSeleccionado?.nombreComercial || this.form.nombreCliente || '',

      cedula: this.clienteSeleccionado?.cedulaRNC || '',

      fecha: this.form.fechaEmision || '',

      numeroDocumento: (this.form.numeroDocumento || '').trim(),

      doctor: (this.form.nombreDoctor || '').trim(),

      procedimiento: (this.form.procedimiento || '').trim(),

      horasReposo: this.form.horasReposo ?? null,

      observaciones: (this.form.observaciones || '').trim(),

      medicamentos: (this.form.medicamentos || '').trim(),

      indicaciones: (this.form.indicaciones || '').trim()

    };

  }



  private generarContenidoHTMLFinal(): string {

    const plantilla = this.plantillaActual?.contenidoHTML?.trim() || '';



    if (!plantilla) {

      return this.form.contenidoHTMLFinal || '';

    }



    return generarHtmlDocumentoClinico(

      plantilla,

      this.armarVariablesPlantilla()

    );

  }



  private armarDatosJSON(): string {

    return JSON.stringify({

      idCliente: this.form.idCliente,

      nombreCliente: this.clienteSeleccionado?.nombreComercial || '',

      cedulaCliente: this.clienteSeleccionado?.cedulaRNC || '',

      tipoDocumento: this.form.tipoDocumento,

      nombreDoctor: this.form.nombreDoctor || '',

      horasReposo: this.form.horasReposo ?? null,

      procedimiento: this.form.procedimiento || '',

      observaciones: this.form.observaciones || '',

      medicamentos: this.form.medicamentos || '',

      indicaciones: this.form.indicaciones || '',

      fechaEmision: this.form.fechaEmision

    });

  }



  private async validar(): Promise<boolean> {

    if (!this.form.idCliente) {

      (

        await this.toastCtrl.create({

          message: 'Seleccione un paciente.',

          duration: 2000,

          color: 'warning'

        })

      ).present();

      return false;

    }



    if (!this.form.tipoDocumento?.trim()) {

      (

        await this.toastCtrl.create({

          message: 'Seleccione el tipo de documento.',

          duration: 2000,

          color: 'warning'

        })

      ).present();

      return false;

    }



    if (!this.form.idPlantilla || !this.plantillaActual) {

      (

        await this.toastCtrl.create({

          message:

            'No se encontró una plantilla activa para el tipo seleccionado.',

          duration: 2500,

          color: 'warning'

        })

      ).present();

      return false;

    }



    if (!this.form.numeroDocumento?.trim()) {

      (

        await this.toastCtrl.create({

          message: 'Ingrese el número de documento.',

          duration: 2000,

          color: 'warning'

        })

      ).present();

      return false;

    }



    if (this.esCertificado && !this.form.procedimiento?.trim()) {

      (

        await this.toastCtrl.create({

          message: 'Ingrese el procedimiento realizado.',

          duration: 2000,

          color: 'warning'

        })

      ).present();

      return false;

    }



    if (this.esReceta && !this.form.medicamentos?.trim()) {

      (

        await this.toastCtrl.create({

          message: 'Ingrese los medicamentos de la receta.',

          duration: 2000,

          color: 'warning'

        })

      ).present();

      return false;

    }



    return true;

  }



  private armarPayload(): DocumentoClinico {

    const contenidoHTML = this.generarContenidoHTMLFinal();



    return {

      ...this.form,

      idEmpresa: this.parametro.GetIdEmpresa(),

      idUsuarioCreacion: this.parametro.IdUsuario,

      idPlantilla: this.plantillaActual?.idPlantilla || this.form.idPlantilla,

      numeroDocumento: (this.form.numeroDocumento || '').trim(),

      tipoDocumento: (this.form.tipoDocumento || '').trim(),

      nombreDoctor: (this.form.nombreDoctor || '').trim(),

      procedimiento: (this.form.procedimiento || '').trim(),

      observaciones: (this.form.observaciones || '').trim(),

      medicamentos: (this.form.medicamentos || '').trim(),

      indicaciones: (this.form.indicaciones || '').trim(),

      contenidoHTMLFinal: contenidoHTML,

      datosJSON: this.armarDatosJSON(),

      horasReposo: this.form.horasReposo

        ? Number(this.form.horasReposo)

        : null,

      fechaEmision: this.form.fechaEmision

        ? new Date(this.form.fechaEmision).toISOString()

        : new Date().toISOString(),

      estado: this.form.estado || 'EMITIDO'

    };

  }



  async guardar() {

    if (this.soloLectura) return;



    if (!(await this.validar())) return;



    const payload = this.armarPayload();

    const request = this.modo === 'editar'

      ? this.documentosSrv.actualizar(payload)

      : this.documentosSrv.crear(payload);



    request.subscribe({

      next: async () => {

        (

          await this.toastCtrl.create({

            message: this.modo === 'editar'

              ? 'Documento actualizado correctamente'

              : 'Documento generado correctamente',

            duration: 2000,

            color: 'success'

          })

        ).present();



        this.modalCtrl.dismiss({ recargar: true });

      },

      error: async (err) => {

        const mensaje =

          err?.error?.message ||

          err?.error?.error ||

          'Error guardando documento';



        (

          await this.toastCtrl.create({

            message: mensaje,

            duration: 2500,

            color: 'danger'

          })

        ).present();

      }

    });

  }



  cerrar() {

    this.modalCtrl.dismiss();

  }

}

