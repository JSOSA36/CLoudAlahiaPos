import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ClientesComponent } from 'src/app/Clientes/clientes/clientes.component';
import { clientes } from 'src/app/models/clientes';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import {
  FichaClinica,
  FichaClinicaAnamnesis,
  FichaClinicaCuentaLinea,
  FichaClinicaDiente,
  FichaClinicaService,
  FichaClinicaVista
} from 'src/app/servicios/ficha-clinica.service';
import { descargarFichaClinicaPdf } from './ficha-clinica-pdf';

type AnamnesisFlag = Exclude<keyof FichaClinicaAnamnesis, 'otraContagio'>;

@Component({
  selector: 'app-ficha-clinica',
  templateUrl: './ficha-clinica.component.html',
  styleUrls: ['./ficha-clinica.component.scss']
})
export class FichaClinicaComponent {
  readonly arcoSuperiorDer = ['18', '17', '16', '15', '14', '13', '12', '11'];
  readonly arcoSuperiorIzq = ['21', '22', '23', '24', '25', '26', '27', '28'];
  readonly arcoInferiorDer = ['48', '47', '46', '45', '44', '43', '42', '41'];
  readonly arcoInferiorIzq = ['31', '32', '33', '34', '35', '36', '37', '38'];

  readonly anamnesisCampos: { key: AnamnesisFlag; label: string }[] = [
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'hipertension', label: 'Hipertensión' },
    { key: 'anemia', label: 'Anemia' },
    { key: 'falcemia', label: 'Falcemia' },
    { key: 'asma', label: 'Asma' },
    { key: 'hemorragia', label: 'Hemorragia' },
    { key: 'cardiacos', label: 'Cardíacos' },
    { key: 'renales', label: 'Renales' },
    { key: 'gastricas', label: 'Gástricas' },
    { key: 'dolor', label: 'Dolor' }
  ];

  readonly contagioCampos: { key: AnamnesisFlag; label: string }[] = [
    { key: 'hepatitis', label: 'Hepatitis' },
    { key: 'vih', label: 'VIH' },
    { key: 'tuberculosis', label: 'Tuberculosis' }
  ];

  clienteSeleccionado: clientes | null = null;
  vista: FichaClinicaVista | null = null;
  ficha: FichaClinica | null = null;
  cuenta: FichaClinicaCuentaLinea[] = [];
  dienteSeleccionado: string | null = null;
  fechaNacimiento = '';
  edadInput: number | null = null;
  cargando = false;
  guardando = false;
  exportandoPdf = false;

  constructor(
    private fichaSrv: FichaClinicaService,
    private parametro: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  get nombreEmpresa(): string {
    return this.vista?.nombreEmpresa || this.parametro.NombreEmpresa || '';
  }

  get dienteActual(): FichaClinicaDiente | null {
    if (!this.ficha || !this.dienteSeleccionado) return null;
    return this.ficha.dientes.find(d => d.numero === this.dienteSeleccionado) ?? null;
  }

  async seleccionarPaciente() {
    const modal = await this.modalCtrl.create({
      component: ClientesComponent,
      componentProps: { isModalSeleccion: true }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.cliente) {
      this.clienteSeleccionado = data.cliente;
      this.cargar();
    }
  }

  cargar() {
    if (!this.clienteSeleccionado?.idCliente) return;
    this.cargando = true;
    this.fichaSrv
      .getVista(this.parametro.GetIdEmpresa(), this.clienteSeleccionado.idCliente)
      .subscribe({
        next: (vista) => this.aplicarVista(vista),
        error: async () => {
          this.cargando = false;
          await this.toast('No se pudo cargar la ficha del paciente.', 'danger');
        }
      });
  }

  guardar() {
    if (!this.ficha?.idCliente) {
      this.toast('Seleccione un paciente.', 'warning');
      return;
    }
    this.guardando = true;
    this.ficha.idEmpresa = this.parametro.GetIdEmpresa();
    this.ficha.idUsuarioCreacion = this.parametro.IdUsuario;
    this.ficha.idUsuarioModificacion = this.parametro.IdUsuario;
    this.ficha.fechaNacimiento = this.fechaParaGuardar();
    this.fichaSrv.guardar(this.ficha).subscribe({
      next: (vista) => {
        this.aplicarVista(vista);
        this.guardando = false;
        this.toast('Ficha clínica guardada. Los datos personales se actualizaron en el cliente.', 'success');
      },
      error: async (err) => {
        this.guardando = false;
        const msg = err?.error?.message || 'No se pudo guardar la ficha clínica.';
        await this.toast(msg, 'danger');
      }
    });
  }

  exportarPdf() {
    if (!this.ficha) {
      this.toast('Seleccione un paciente.', 'warning');
      return;
    }

    this.exportandoPdf = true;
    try {
      descargarFichaClinicaPdf({
        empresa: this.nombreEmpresa,
        ficha: this.ficha,
        vista: this.vista,
        edad: this.edadInput == null ? '—' : String(this.edadInput),
        sexo: this.etiquetaSexo(this.ficha.sexo),
        anamnesisActiva: this.anamnesisCampos
          .filter(c => this.esAnamnesis(c.key))
          .map(c => c.label),
        contagioActivo: this.contagioCampos
          .filter(c => this.esAnamnesis(c.key))
          .map(c => c.label),
        arcos: {
          superior: [...this.arcoSuperiorDer, ...this.arcoSuperiorIzq],
          inferior: [...this.arcoInferiorDer, ...this.arcoInferiorIzq]
        },
        dientes: this.ficha.dientes || [],
        cuenta: this.cuenta || []
      }, `Ficha-${this.nombreArchivoPdf()}.pdf`);
      this.toast('PDF listo. Ábralo para imprimirlo.', 'success');
    } catch {
      this.toast('No se pudo exportar el PDF.', 'danger');
    } finally {
      this.exportandoPdf = false;
    }
  }

  private etiquetaSexo(valor?: string): string {
    if (valor === 'F') {
      return 'Femenino';
    }
    if (valor === 'M') {
      return 'Masculino';
    }
    return valor || '—';
  }

  private nombreArchivoPdf(): string {
    const nombre = (
      this.ficha?.nombres ||
      this.clienteSeleccionado?.nombreComercial ||
      'paciente'
    ).trim();
    return nombre.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'paciente';
  }

  dienteMarcado(numero: string): boolean {
    return !!this.ficha?.dientes.find(d => d.numero === numero)?.marcado;
  }

  dienteConNota(numero: string): boolean {
    return !!(this.ficha?.dientes.find(d => d.numero === numero)?.nota || '').trim();
  }

  get dientesConHallazgo(): FichaClinicaDiente[] {
    return (this.ficha?.dientes || []).filter(d =>
      d.marcado || !!(d.nota || '').trim()
    );
  }

  tipoDiente(numero: string): 'molar' | 'premolar' | 'canino' | 'incisivoL' | 'incisivoC' {
    const pos = (numero || '').slice(-1);
    if (pos === '1') return 'incisivoC';
    if (pos === '2') return 'incisivoL';
    if (pos === '3') return 'canino';
    if (pos === '4' || pos === '5') return 'premolar';
    return 'molar';
  }

  esInferior(numero: string): boolean {
    return numero.startsWith('3') || numero.startsWith('4');
  }

  esFlip(numero: string): boolean {
    return numero.startsWith('2') || numero.startsWith('3');
  }

  seleccionarDiente(numero: string) {
    this.dienteSeleccionado = numero;
  }

  onNotaDiente() {
    if (!this.dienteActual) return;
    if ((this.dienteActual.nota || '').trim()) {
      this.dienteActual.marcado = true;
    }
  }

  setHallazgo(value: boolean) {
    if (!this.dienteActual) return;
    this.dienteActual.marcado = !!value;
  }

  esAnamnesis(key: AnamnesisFlag): boolean {
    return !!this.ficha?.anamnesis?.[key];
  }

  setAnamnesis(key: AnamnesisFlag, value: boolean): void {
    if (!this.ficha?.anamnesis) return;
    this.ficha.anamnesis[key] = !!value;
  }

  private aplicarVista(vista: FichaClinicaVista) {
    this.vista = vista;
    this.ficha = vista.ficha;
    if (this.ficha) {
      this.ficha.anamnesis = this.ficha.anamnesis || {
        diabetes: false, hipertension: false, anemia: false, falcemia: false,
        asma: false, hemorragia: false, cardiacos: false, renales: false,
        gastricas: false, dolor: false, hepatitis: false, vih: false, tuberculosis: false
      };
      this.ficha.dientes = this.ficha.dientes || [];
    }
    this.cuenta = vista.cuenta || [];
    this.fechaNacimiento = this.aFechaInput(vista.ficha?.fechaNacimiento || vista.cliente?.fechaNacimiento);
    this.edadInput = vista.cliente?.edad ?? this.calcularEdad(this.fechaNacimiento);
    if (this.clienteSeleccionado && vista.cliente?.nombreComercial) {
      this.clienteSeleccionado.nombreComercial = vista.cliente.nombreComercial;
    }
    this.cargando = false;
  }

  moneda(valor?: number | null): string {
    const n = Number(valor || 0);
    return n.toLocaleString('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private fechaParaGuardar(): string | undefined {
    const edad = Number(this.edadInput);
    if (!Number.isFinite(edad) || edad < 0 || edad > 120) {
      return this.fechaNacimiento || undefined;
    }
    const edadActual = this.calcularEdad(this.fechaNacimiento);
    if (edadActual === edad && this.fechaNacimiento) {
      return this.fechaNacimiento;
    }
    const hoy = new Date();
    const y = hoy.getFullYear() - Math.trunc(edad);
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private aFechaInput(valor?: string): string {
    if (!valor) return '';
    return String(valor).substring(0, 10);
  }

  private calcularEdad(fecha: string): number | null {
    if (!fecha) return null;
    const nacio = new Date(`${fecha.substring(0, 10)}T00:00:00`);
    if (Number.isNaN(nacio.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacio.getFullYear();
    const m = hoy.getMonth() - nacio.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacio.getDate())) edad--;
    return edad >= 0 && edad <= 120 ? edad : null;
  }

  private async toast(message: string, color: string) {
    (await this.toastCtrl.create({ message, duration: 2400, color })).present();
  }
}
