import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ModalController, ToastController } from '@ionic/angular';

import { DocumentosClinicosService } from 'src/app/servicios/documentos-clinicos.service';

import { PlantillasDocumentosClinicosService } from 'src/app/servicios/plantillas-documentos-clinicos.service';

import { ParametrosService } from 'src/app/servicios/parametros.service';

import { DocumentoClinico } from 'src/app/models/documento-clinico.models';

import { PlantillaDocumentoClinico } from 'src/app/models/plantilla-documento-clinico.models';

import { HistorialServiciosService } from 'src/app/servicios/historial-servicios.service';

import { EmpleadosService } from 'src/app/servicios/empleados.service';

import { ClienteService } from 'src/app/servicios/cliente.service';

import { FichaClinicaService } from 'src/app/servicios/ficha-clinica.service';

import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';

import { clientes } from 'src/app/models/clientes';

import { Empleado } from 'src/app/models/empleado.models';

import { firstValueFrom } from 'rxjs';

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

  empleados: Empleado[] = [];

  idEmpleadoSeleccionado: number | null = null;

  cargoDoctor = '';

  private edadFicha: number | null = null;

  private edadDocumento = '';

  edadInput: number | null = null;

  private edadEditada = false;



  private plantillaActual: PlantillaDocumentoClinico | null = null;



  estados = ['BORRADOR', 'EMITIDO', 'ANULADO'];

  vistaHtmlDocumento: SafeHtml | null = null;

  @ViewChild('docIframe') docIframe?: ElementRef<HTMLIFrameElement>;

  constructor(

    private documentosSrv: DocumentosClinicosService,

    private plantillasSrv: PlantillasDocumentosClinicosService,

    private historialSrv: HistorialServiciosService,

    private empleadosSrv: EmpleadosService,

    private clientesSrv: ClienteService,

    private fichaClinicaSrv: FichaClinicaService,

    private parametro: ParametrosService,

    private modalCtrl: ModalController,

    private toastCtrl: ToastController,

    private sanitizer: DomSanitizer

  ) {}



  ngOnInit() {

    this.cargarTiposDocumento();

    this.cargarEmpleados();



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

      this.cargarClienteCompleto();

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



  get edadPaciente(): string {

    const n = this.edadNumerica;

    if (n != null) {

      return `${n} ${n === 1 ? 'año' : 'años'}`;

    }

    return '';

  }

  get edadNumerica(): number | null {

    if (this.edadInput != null && this.edadInput !== ('' as any)) {

      const n = Number(this.edadInput);

      if (Number.isFinite(n) && n >= 0 && n <= 120) {

        return Math.trunc(n);

      }

    }

    if (this.edadFicha != null && this.edadFicha >= 0 && this.edadFicha <= 120) {

      return this.edadFicha;

    }

    return this.extraerNumeroEdad(this.edadDocumento);

  }

  onEdadChange() {

    this.edadEditada = true;

  }

  private get fechaNacimientoPaciente(): string {

    return this.extraerFechaNacimiento(this.clienteSeleccionado);

  }

  compareEmpleados = (a: number | string | null, b: number | string | null): boolean =>
    a == null || b == null ? a === b : Number(a) === Number(b);



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
    const regenerado = this.generarContenidoHTMLFinal().trim();
    let html = !this.esContenidoHtmlInvalido(regenerado)
      ? regenerado
      : this.form.contenidoHTMLFinal?.trim();

    if (this.esContenidoHtmlInvalido(html)) {
      html = '';
    } else if (!this.esContenidoHtmlInvalido(regenerado)) {
      this.form.contenidoHTMLFinal = regenerado;
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



  private cargarEmpleados() {

    const idEmpresa = this.parametro.GetIdEmpresa();

    if (!idEmpresa) {
      return;
    }

    this.empleadosSrv.getByEmpresa(idEmpresa).subscribe({
      next: (lista) => {
        this.empleados = (lista || []).filter(e => e.estado !== false);
        this.sincronizarDoctorSeleccionado();
      },
      error: () => {
        this.empleados = [];
      }
    });

  }



  private cargarClienteCompleto() {

    const idCliente = this.form.idCliente;

    if (!idCliente) {

      return;

    }

    this.clientesSrv.GetById(idCliente).subscribe({

      next: (cliente) => {

        if (cliente) {

          this.aplicarCliente(cliente);

        }

        this.cargarEdadDesdeFicha(idCliente);

      },

      error: () => {

        this.cargarEdadDesdeFicha(idCliente);

      }

    });

  }



  private cargarEdadDesdeFicha(idCliente: number) {

    if (!idCliente) {

      return;

    }

    this.fichaClinicaSrv.getVista(this.parametro.GetIdEmpresa(), idCliente).subscribe({

      next: (vista) => {

        const fecha =

          this.extraerFechaNacimiento(vista?.cliente) ||

          this.extraerFechaNacimiento(vista?.ficha);

        if (fecha) {

          this.aplicarCliente({

            idCliente,

            fechaNacimiento: fecha,

            nombreComercial: vista?.cliente?.nombreComercial,

            cedulaRNC: vista?.cliente?.cedulaRnc || vista?.ficha?.cedulaRnc

          });

        }

        if (vista?.cliente?.edad != null) {

          this.edadFicha = vista.cliente.edad;

          this.aplicarEdad(vista.cliente.edad);

        }

        if (this.modo === 'ver' || this.plantillaActual) {

          this.prepararVistaDocumento();

        }

      }

    });

  }



  private aplicarCliente(raw: any) {

    if (!raw) {

      return;

    }

    const actual = this.clienteSeleccionado || new clientes();

    const idCliente = Number(

      raw.idCliente ?? raw.iDCliente ?? raw.IDCliente ?? actual.idCliente ?? 0

    );

    const nombreComercial = String(

      raw.nombreComercial ?? raw.NombreComercial ?? actual.nombreComercial ?? ''

    );

    const cedulaRNC = String(

      raw.cedulaRNC ?? raw.CedulaRNC ?? raw.cedulaRnc ?? actual.cedulaRNC ?? ''

    );

    const fechaNacimiento =

      this.extraerFechaNacimiento(raw) || actual.fechaNacimiento || '';

    this.clienteSeleccionado = Object.assign(new clientes(), actual, {

      idCliente,

      nombreComercial,

      cedulaRNC,

      fechaNacimiento

    });

    this.aplicarEdad(this.calcularEdadNumero(fechaNacimiento));

    if (idCliente) {

      this.form.idCliente = idCliente;

    }

    if (nombreComercial) {

      this.form.nombreCliente = nombreComercial;

    }

  }



  private extraerFechaNacimiento(raw: any): string {

    const valor = raw?.fechaNacimiento ?? raw?.FechaNacimiento ?? '';

    if (valor == null || valor === '') {

      return '';

    }

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {

      return this.aFechaInput(valor);

    }

    const texto = String(valor).trim();

    if (!texto) {

      return '';

    }

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {

      return texto.substring(0, 10);

    }

    const fecha = new Date(texto);

    if (Number.isNaN(fecha.getTime())) {

      return '';

    }

    return this.aFechaInput(fecha);

  }



  private aFechaInput(fecha: Date): string {

    const y = fecha.getFullYear();

    const m = String(fecha.getMonth() + 1).padStart(2, '0');

    const d = String(fecha.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;

  }

  private aplicarEdad(valor: number | null) {

    if (this.edadEditada) {

      return;

    }

    if (valor == null || !Number.isFinite(valor) || valor < 0 || valor > 120) {

      return;

    }

    this.edadInput = Math.trunc(valor);

  }

  private extraerNumeroEdad(valor?: string | null): number | null {

    if (valor == null || String(valor).trim() === '') {

      return null;

    }

    const match = String(valor).match(/(\d+)/);

    if (!match) {

      return null;

    }

    const n = Number(match[1]);

    return Number.isFinite(n) && n >= 0 && n <= 120 ? Math.trunc(n) : null;

  }

  private calcularEdadNumero(fecha?: string): number | null {

    if (!fecha) {

      return null;

    }

    const nacio = new Date(`${fecha.substring(0, 10)}T00:00:00`);

    if (Number.isNaN(nacio.getTime())) {

      return null;

    }

    const hoy = new Date();

    let edad = hoy.getFullYear() - nacio.getFullYear();

    const m = hoy.getMonth() - nacio.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < nacio.getDate())) {

      edad--;

    }

    return edad >= 0 && edad <= 120 ? edad : null;

  }

  private fechaDesdeEdad(): string | undefined {

    const edad = this.edadNumerica;

    if (edad == null) {

      return this.fechaNacimientoPaciente || undefined;

    }

    const actual = this.calcularEdadNumero(this.fechaNacimientoPaciente);

    if (actual === edad && this.fechaNacimientoPaciente) {

      return this.fechaNacimientoPaciente;

    }

    const hoy = new Date();

    const y = hoy.getFullYear() - edad;

    const m = String(hoy.getMonth() + 1).padStart(2, '0');

    const d = String(hoy.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;

  }

  private async persistirEdadCliente() {

    const idCliente = this.form.idCliente;

    const fecha = this.fechaDesdeEdad();

    if (!idCliente || !fecha) {

      return;

    }

    try {

      const cliente = await firstValueFrom(this.clientesSrv.GetById(idCliente));

      if (!cliente) {

        return;

      }

      const edadGuardada = this.calcularEdadNumero(this.extraerFechaNacimiento(cliente));

      if (edadGuardada === this.edadNumerica) {

        return;

      }

      cliente.fechaNacimiento = fecha;

      await firstValueFrom(this.clientesSrv.EditarClientes(cliente));

      this.aplicarCliente({ ...cliente, fechaNacimiento: fecha });

    } catch {

      // El documento se guarda igual; la edad queda en el JSON de la receta.

    }

  }



  onDoctorChange() {

    if (this.idEmpleadoSeleccionado != null) {
      this.idEmpleadoSeleccionado = Number(this.idEmpleadoSeleccionado);
    }

    const empleado = this.empleados.find(
      e => e.idEmpleados === Number(this.idEmpleadoSeleccionado)
    );

    if (!empleado) {
      this.form.nombreDoctor = '';
      this.cargoDoctor = '';
      return;
    }

    this.form.nombreDoctor = (empleado.nombre || '').trim();
    this.cargoDoctor = (empleado.ocupacion || '').trim() || 'ODONTÓLOGO';

  }



  private sincronizarDoctorSeleccionado() {

    if (!this.empleados.length) {
      return;
    }

    if (this.idEmpleadoSeleccionado) {
      this.onDoctorChange();
      return;
    }

    const nombre = (this.form.nombreDoctor || '').trim().toLowerCase();
    if (nombre) {
      const porNombre = this.empleados.find(
        e => (e.nombre || '').trim().toLowerCase() === nombre
      );
      if (porNombre) {
        this.idEmpleadoSeleccionado = porNombre.idEmpleados;
        this.onDoctorChange();
        return;
      }
    }

    if (this.modo === 'crear' && this.empleados.length === 1) {
      this.idEmpleadoSeleccionado = this.empleados[0].idEmpleados;
      this.onDoctorChange();
    }

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

      } else if (datos.medicamentos) {

        this.form.indicaciones = datos.medicamentos;

      }



      if (datos.idEmpleado) {

        this.idEmpleadoSeleccionado = Number(datos.idEmpleado);

      }



      if (datos.cargoDoctor) {

        this.cargoDoctor = datos.cargoDoctor;

      }



      if (datos.fechaNacimiento) {
        this.aplicarCliente({
          idCliente: this.form.idCliente,
          nombreComercial: datos.nombreCliente || this.form.nombreCliente || '',
          fechaNacimiento: datos.fechaNacimiento,
          cedulaRNC: datos.cedulaCliente
        });
      }

      if (datos.cedulaCliente) {
        this.aplicarCliente({
          idCliente: this.form.idCliente,
          nombreComercial: datos.nombreCliente || this.form.nombreCliente || '',
          cedulaRNC: datos.cedulaCliente
        });
      }

      if (datos.edadCliente) {
        this.edadDocumento = String(datos.edadCliente);
        this.aplicarEdad(this.extraerNumeroEdad(this.edadDocumento));
      }

    } catch {

      // datosJSON inválido: se ignoran campos adicionales

    }

    this.sincronizarDoctorSeleccionado();

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

      this.edadFicha = null;

      this.edadDocumento = '';

      this.edadInput = null;

      this.edadEditada = false;

      this.aplicarCliente(data.cliente);

      this.cargarEdadDesdeFicha(this.form.idCliente);

      this.autocompletarUltimoProcedimiento();

    }

  }



  private autocompletarUltimoProcedimiento(): void {

    if (this.soloLectura || !this.esCertificado) {
      return;
    }

    if (this.form.procedimiento?.trim()) {
      return;
    }

    const idCliente = this.form.idCliente;
    if (!idCliente || idCliente <= 0) {
      return;
    }

    this.historialSrv
      .getUltimoServicio(this.parametro.GetIdEmpresa(), idCliente)
      .subscribe({
        next: (ultimo) => {
          if (ultimo?.nombreServicio && !this.form.procedimiento?.trim()) {
            this.form.procedimiento = ultimo.nombreServicio;
          }
        },
        error: () => {
          // Sin historial previo: el usuario completa el procedimiento manualmente.
        }
      });

  }



  onTipoDocumentoChange() {

    this.resolverPlantilla(this.form.tipoDocumento, true);

    this.autocompletarUltimoProcedimiento();

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

    const empresa = this.parametro._Empresa;

    return {

      cliente: this.clienteSeleccionado?.nombreComercial || this.form.nombreCliente || '',

      cedula: this.clienteSeleccionado?.cedulaRNC || '',

      edad: this.edadPaciente,

      fecha: this.form.fechaEmision || '',

      numeroDocumento: (this.form.numeroDocumento || '').trim(),

      doctor: (this.form.nombreDoctor || '').trim(),

      nombreEmpresa: (empresa?.nombreComercial || '').trim(),

      eslogan: 'Salud Bucal Para Todos...',

      direccion: (empresa?.direccion || '').trim(),

      telefono: (empresa?.telefono || '').trim(),

      cargoDoctor: (this.cargoDoctor || '').trim() || 'ODONTÓLOGO',

      procedimiento: (this.form.procedimiento || '').trim(),

      horasReposo: this.form.horasReposo ?? null,

      observaciones: (this.form.observaciones || '').trim(),

      medicamentos: (this.form.indicaciones || '').trim(),

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

      idEmpleado: this.idEmpleadoSeleccionado || null,

      cargoDoctor: this.cargoDoctor || '',

      edadCliente: this.edadPaciente,

      fechaNacimiento: this.fechaDesdeEdad() || '',

      horasReposo: this.form.horasReposo ?? null,

      procedimiento: this.form.procedimiento || '',

      observaciones: this.form.observaciones || '',

      medicamentos: this.form.indicaciones || '',

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



    if (!this.form.nombreDoctor?.trim() || !this.idEmpleadoSeleccionado) {

      (

        await this.toastCtrl.create({

          message: 'Seleccione el médico que firma el documento.',

          duration: 2200,

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



    if (this.esReceta && !this.form.indicaciones?.trim()) {

      (

        await this.toastCtrl.create({

          message: 'Ingrese las indicaciones de la receta.',

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

      medicamentos: (this.form.indicaciones || '').trim(),

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

    await this.persistirEdadCliente();

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

