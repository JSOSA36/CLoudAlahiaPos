import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

type AmbienteCode = 'testecf' | 'certecf' | 'ecf';
type ProveedorCode = 'DGII_DIRECTO' | 'PROVEEDOR_EXTERNO';

interface AmbienteOption {
  code: AmbienteCode;
  label: string;
  hint: string;
  badgeClass: string;
}

interface ProveedorOption {
  code: ProveedorCode;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-fe-configuracion',
  templateUrl: './fe-configuracion.component.html',
  styleUrls: ['./fe-configuracion.component.scss'],
})
export class FeConfiguracionComponent implements OnInit {

  gatewayConectado = false;
  verificando = false;
  cargandoAmbiente = false;
  cargandoProveedor = false;
  guardando = false;
  guardandoProveedor = false;

  ambienteActual: AmbienteCode = 'testecf';
  ambienteSeleccionado: AmbienteCode = 'testecf';
  urls: { auth?: string; recepcion?: string; consulta?: string; rfce?: string } = {};

  proveedorActual: ProveedorCode = 'DGII_DIRECTO';
  proveedorSeleccionado: ProveedorCode = 'DGII_DIRECTO';
  proveedorNombre = '';
  proveedorBaseUrl = '';
  proveedorUsuario = '';
  proveedorApiKey = '';
  proveedorPassword = '';
  apiKeyConfigurado = false;
  passwordConfigurado = false;
  endpointEfectivo = '';

  cargandoCertificado = false;
  guardandoCertificado = false;
  certConfigurado = false;
  certNombre = '';
  certFechaExp = '';
  certVencido = false;
  certArchivo: File | null = null;
  certPassword = '';

  readonly opciones: AmbienteOption[] = [
    {
      code: 'testecf',
      label: 'Pruebas',
      hint: 'Sandbox DGII (testecf). Ideal para desarrollo y pruebas internas.',
      badgeClass: 'pruebas',
    },
    {
      code: 'certecf',
      label: 'Certificación',
      hint: 'Ambiente de certificación DGII (certecf).',
      badgeClass: 'certificacion',
    },
    {
      code: 'ecf',
      label: 'Producción',
      hint: 'DGII real (ecf). Los e-CF se enviarán al ambiente productivo.',
      badgeClass: 'produccion',
    },
  ];

  readonly opcionesProveedor: ProveedorOption[] = [
    {
      code: 'DGII_DIRECTO',
      label: 'DGII directo (Alahia)',
      hint: 'Alahia firma y envía a DGII. Requiere certificado .p12/.pfx + contraseña y ambiente.',
    },
    {
      code: 'PROVEEDOR_EXTERNO',
      label: 'Proveedor externo',
      hint: 'Solo se envía la trama (api/Receipt). El proveedor maneja certificado y DGII (ej. Pedro).',
    },
  ];

  constructor(
    private feService: FacturacionElectronicaService,
    public parametro: ParametrosService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.cargarProveedor();
    this.cargarAmbiente();
    this.cargarCertificado();
  }

  get esDgiiDirecto(): boolean {
    return this.proveedorSeleccionado === 'DGII_DIRECTO';
  }

  get opcionSeleccionada(): AmbienteOption {
    return this.opciones.find(o => o.code === this.ambienteSeleccionado) || this.opciones[0];
  }

  get opcionActual(): AmbienteOption {
    return this.opciones.find(o => o.code === this.ambienteActual) || this.opciones[0];
  }

  get hayCambioAmbiente(): boolean {
    return this.ambienteSeleccionado !== this.ambienteActual;
  }

  get hayCambioProveedor(): boolean {
    if (this.proveedorSeleccionado !== this.proveedorActual) return true;
    if (this.proveedorSeleccionado === 'PROVEEDOR_EXTERNO') {
      return !!(this.proveedorNombre || this.proveedorBaseUrl || this.proveedorUsuario
        || this.proveedorApiKey || this.proveedorPassword);
    }
    return false;
  }

  get urlAuth(): string {
    return this.urls?.auth || this.buildUrlsLocal(this.ambienteSeleccionado).auth;
  }

  get urlRecepcion(): string {
    return this.urls?.recepcion || this.buildUrlsLocal(this.ambienteSeleccionado).recepcion;
  }

  get urlConsulta(): string {
    return this.urls?.consulta || this.buildUrlsLocal(this.ambienteSeleccionado).consulta;
  }

  get urlRfce(): string {
    return this.urls?.rfce || this.buildUrlsLocal(this.ambienteSeleccionado).rfce;
  }

  verificarConexion() {
    this.verificando = true;
    this.feService.healthCheck(this.parametro.IdEmpresa).subscribe({
      next: (res: any) => {
        this.gatewayConectado = res?.conectado === true;
        this.verificando = false;
      },
      error: () => { this.gatewayConectado = false; this.verificando = false; }
    });
  }

  cargarProveedor() {
    const id = this.parametro.IdEmpresa;
    if (!id) return;
    this.cargandoProveedor = true;
    this.feService.getProveedor(id).subscribe({
      next: (res) => {
        const code = (res?.proveedor || 'DGII_DIRECTO') as ProveedorCode;
        this.proveedorActual = code;
        this.proveedorSeleccionado = code;
        this.proveedorNombre = res?.nombre || '';
        this.proveedorBaseUrl = res?.baseUrl || '';
        this.proveedorUsuario = res?.usuario || '';
        this.apiKeyConfigurado = !!res?.apiKeyConfigurado;
        this.passwordConfigurado = !!res?.passwordConfigurado;
        this.endpointEfectivo = res?.endpointEfectivo || '';
        this.proveedorApiKey = '';
        this.proveedorPassword = '';
        this.cargandoProveedor = false;
        this.verificarConexion();
      },
      error: async () => {
        this.cargandoProveedor = false;
        this.verificarConexion();
        await this.showToast('No se pudo cargar el proveedor fiscal', 'danger');
      }
    });
  }

  seleccionarProveedor(code: ProveedorCode) {
    this.proveedorSeleccionado = code;
    if (code === 'DGII_DIRECTO') this.cargarCertificado();
  }

  cargarCertificado() {
    const id = this.parametro.IdEmpresa;
    if (!id) return;
    this.cargandoCertificado = true;
    this.feService.getCertificado(id).subscribe({
      next: (res) => {
        this.certConfigurado = !!res?.configurado;
        this.certNombre = res?.nombreArchivo || '';
        this.certFechaExp = res?.fechaExpiracion || '';
        this.certVencido = !!res?.vencido;
        this.cargandoCertificado = false;
      },
      error: () => { this.cargandoCertificado = false; }
    });
  }

  onCertFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.certArchivo = input.files && input.files.length ? input.files[0] : null;
  }

  async guardarCertificado() {
    if (!this.certArchivo) {
      await this.showToast('Seleccione el archivo .p12 o .pfx', 'warning');
      return;
    }
    if (!this.certPassword?.trim()) {
      await this.showToast('Indique la contraseña del certificado', 'warning');
      return;
    }
    this.guardandoCertificado = true;
    this.feService.uploadCertificado(
      this.parametro.IdEmpresa,
      this.certArchivo,
      this.certPassword.trim(),
      this.ambienteSeleccionado
    ).subscribe({
      next: async (res) => {
        this.certConfigurado = true;
        this.certNombre = res?.nombreArchivo || this.certArchivo?.name || '';
        this.certFechaExp = res?.fechaExpiracion || '';
        this.certVencido = !!res?.vencido;
        this.certArchivo = null;
        this.certPassword = '';
        this.guardandoCertificado = false;
        await this.showToast(res?.mensaje || 'Certificado guardado');
      },
      error: async (err) => {
        this.guardandoCertificado = false;
        const msg = err?.error?.title || err?.error || 'No se pudo guardar el certificado';
        await this.showToast(typeof msg === 'string' ? msg : 'No se pudo guardar el certificado', 'danger');
      }
    });
  }

  async guardarProveedor() {
    if (this.guardandoProveedor) return;

    if (this.proveedorSeleccionado === 'PROVEEDOR_EXTERNO' && !this.proveedorBaseUrl?.trim()) {
      await this.showToast('Indique la URL del proveedor externo', 'warning');
      return;
    }

    this.guardandoProveedor = true;
    const body: any = {
      proveedor: this.proveedorSeleccionado,
    };
    if (this.proveedorSeleccionado === 'PROVEEDOR_EXTERNO') {
      body.nombre = this.proveedorNombre?.trim() || undefined;
      body.baseUrl = this.proveedorBaseUrl?.trim();
      body.usuario = this.proveedorUsuario?.trim() || undefined;
      if (this.proveedorApiKey?.trim()) body.apiKey = this.proveedorApiKey.trim();
      if (this.proveedorPassword) body.password = this.proveedorPassword;
    }

    this.feService.putProveedor(this.parametro.IdEmpresa, body).subscribe({
      next: async (res) => {
        this.proveedorActual = (res?.proveedor || this.proveedorSeleccionado) as ProveedorCode;
        this.proveedorSeleccionado = this.proveedorActual;
        this.proveedorNombre = res?.nombre || this.proveedorNombre;
        this.proveedorBaseUrl = res?.baseUrl || this.proveedorBaseUrl;
        this.proveedorUsuario = res?.usuario || '';
        this.apiKeyConfigurado = !!res?.apiKeyConfigurado;
        this.passwordConfigurado = !!res?.passwordConfigurado;
        this.endpointEfectivo = res?.endpointEfectivo || '';
        this.proveedorApiKey = '';
        this.proveedorPassword = '';
        this.guardandoProveedor = false;
        await this.showToast(`Proveedor guardado: ${res?.etiqueta || this.proveedorSeleccionado}`);
        this.verificarConexion();
      },
      error: async (err) => {
        this.guardandoProveedor = false;
        const msg = err?.error?.title || err?.error || 'No se pudo guardar el proveedor';
        await this.showToast(typeof msg === 'string' ? msg : 'No se pudo guardar el proveedor', 'danger');
      }
    });
  }

  cargarAmbiente() {
    const id = this.parametro.IdEmpresa;
    if (!id) return;
    this.cargandoAmbiente = true;
    this.urls = this.buildUrlsLocal(this.ambienteSeleccionado);
    this.feService.getAmbiente(id).subscribe({
      next: (res) => {
        const code = (res?.ambiente || 'testecf') as AmbienteCode;
        this.ambienteActual = code;
        this.ambienteSeleccionado = code;
        this.urls = res?.urls?.auth ? res.urls : this.buildUrlsLocal(code);
        this.cargandoAmbiente = false;
      },
      error: async () => {
        this.urls = this.buildUrlsLocal(this.ambienteSeleccionado);
        this.cargandoAmbiente = false;
        await this.showToast('No se pudo cargar el ambiente FE', 'danger');
      }
    });
  }

  seleccionar(code: AmbienteCode) {
    this.ambienteSeleccionado = code;
    this.urls = this.buildUrlsLocal(code);
  }

  buildUrlsLocal(ambiente: AmbienteCode) {
    const host = 'https://ecf.dgii.gov.do';
    const hostFc = 'https://fc.dgii.gov.do';
    return {
      auth: `${host}/${ambiente}/autenticacion`,
      recepcion: `${host}/${ambiente}/recepcion`,
      consulta: `${host}/${ambiente}/consultaresultado`,
      rfce: `${hostFc}/${ambiente}/recepcionfc`,
    };
  }

  async guardarAmbiente() {
    if (!this.hayCambioAmbiente || this.guardando) return;

    if (this.ambienteSeleccionado === 'ecf') {
      const alert = await this.alertCtrl.create({
        header: 'Cambiar a Producción',
        message: 'Los e-CF se enviarán a DGII real (producción). ¿Confirma el cambio?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Sí, usar Producción', role: 'confirm', cssClass: 'alert-danger' },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      if (role !== 'confirm') return;
    }

    this.guardando = true;
    this.feService.putAmbiente(this.parametro.IdEmpresa, this.ambienteSeleccionado).subscribe({
      next: async (res) => {
        this.ambienteActual = (res?.ambiente || this.ambienteSeleccionado) as AmbienteCode;
        this.ambienteSeleccionado = this.ambienteActual;
        this.urls = res?.urls || this.urls;
        this.guardando = false;
        await this.showToast(
          `Ambiente guardado: ${res?.etiqueta || this.opcionSeleccionada.label}`,
          this.ambienteActual === 'ecf' ? 'warning' : 'success'
        );
      },
      error: async (err) => {
        this.guardando = false;
        const msg = err?.error?.title || err?.error || 'No se pudo guardar el ambiente';
        await this.showToast(typeof msg === 'string' ? msg : 'No se pudo guardar el ambiente', 'danger');
      }
    });
  }

  async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
