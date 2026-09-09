import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { SucursalService } from 'src/app/servicios/sucursal.service';
import { SucursalSesion } from 'src/app/models/sucursal-sesion.models';
import {
  SecuenciaEcfDto,
  SecuenciaEcfCreateDto,
  SecuenciaEcfUpdateDto,
  SecuenciaEcfAsignacionDto,
  SecuenciaEcfAsignarDto
} from 'src/app/models/facturacion-electronica.models';

interface TipoEcfOption {
  codigo: number;
  nombre: string;
  serie: string;
}

@Component({
  selector: 'app-fe-secuencias',
  templateUrl: './fe-secuencias.component.html',
  styleUrls: ['./fe-secuencias.component.scss'],
})
export class FeSecuenciasComponent implements OnInit {

  secuencias: SecuenciaEcfDto[] = [];
  sucursales: SucursalSesion[] = [];
  loading = false;
  isModalOpen = false;
  isAsignarOpen = false;
  editMode = false;
  editId = 0;

  secuenciaAsignar: SecuenciaEcfDto | null = null;
  asignacionEditando: SecuenciaEcfAsignacionDto | null = null;

  tiposEcf: TipoEcfOption[] = [
    { codigo: 31, nombre: 'Factura de Crédito Fiscal', serie: 'E31' },
    { codigo: 32, nombre: 'Factura de Consumo', serie: 'E32' },
    { codigo: 33, nombre: 'Nota de Débito', serie: 'E33' },
    { codigo: 34, nombre: 'Nota de Crédito', serie: 'E34' },
    { codigo: 41, nombre: 'Compras', serie: 'E41' },
    { codigo: 43, nombre: 'Gastos Menores', serie: 'E43' },
    { codigo: 44, nombre: 'Regímenes Especiales', serie: 'E44' },
    { codigo: 45, nombre: 'Gubernamental', serie: 'E45' },
    { codigo: 46, nombre: 'Exportaciones', serie: 'E46' },
    { codigo: 47, nombre: 'Pagos al Exterior', serie: 'E47' },
  ];

  form: any = this.resetForm();
  formAsignar: any = this.resetFormAsignar();

  constructor(
    private feService: FacturacionElectronicaService,
    private parametro: ParametrosService,
    private sucursalSrv: SucursalService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.sucursalSrv.listar().subscribe({
      next: (lista) => { this.sucursales = lista || []; },
      error: () => { this.sucursales = this.parametro.sucursales || []; }
    });
    this.cargar();
  }

  get exigeSucursal(): boolean {
    return (this.sucursales || []).filter(s => s.activa !== false).length > 1;
  }

  cargar() {
    this.loading = true;
    this.feService.getSecuencias(this.parametro.IdEmpresa).subscribe({
      next: (data) => { this.secuencias = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  asignacionesDe(s: SecuenciaEcfDto): SecuenciaEcfAsignacionDto[] {
    return s.asignaciones || [];
  }

  asignacionesActivas(s: SecuenciaEcfDto): SecuenciaEcfAsignacionDto[] {
    return this.asignacionesDe(s).filter(a => a.activo);
  }

  numerosSinAsignarDe(s: SecuenciaEcfDto): number {
    return Number(s?.numerosSinAsignar) || 0;
  }

  sucursalesDisponiblesPara(s: SecuenciaEcfDto): SucursalSesion[] {
    const usadas = new Set(
      this.asignacionesActivas(s)
        .filter(a => !this.asignacionEditando || a.idAsignacion !== this.asignacionEditando.idAsignacion)
        .map(a => a.idSucursal)
    );
    return (this.sucursales || []).filter(suc => suc.activa !== false && !usadas.has(suc.idSucursal));
  }

  openNew() {
    this.form = this.resetForm();
    this.editMode = false;
    this.editId = 0;
    this.isModalOpen = true;
  }

  edit(s: SecuenciaEcfDto) {
    this.editMode = true;
    this.editId = s.idSecuencia;
    this.form = {
      tipoEcfDgii: s.tipoEcfDgii,
      serie: s.serie,
      secuenciaInicial: s.secuenciaInicial,
      proximaSecuencia: this.proximaDe(s),
      secuenciaFinal: s.secuenciaFinal,
      fechaVencimiento: s.fechaVencimiento ? s.fechaVencimiento.substring(0, 10) : '',
      stockMinimo: s.stockMinimo,
      ambiente: s.ambiente || 'PRUEBAS',
      activo: s.activo
    };
    this.isModalOpen = true;
  }

  openAsignar(s: SecuenciaEcfDto, asignacion?: SecuenciaEcfAsignacionDto) {
    this.secuenciaAsignar = s;
    this.asignacionEditando = asignacion || null;
    const huecoIni = s.siguienteHuecoInicial ?? s.secuenciaInicial;
    const huecoFin = s.siguienteHuecoFinal ?? s.secuenciaFinal;
    const disponibles = this.sucursalesDisponiblesPara(s);

    if (asignacion) {
      this.formAsignar = {
        idSucursal: asignacion.idSucursal,
        secuenciaInicial: asignacion.secuenciaInicial,
        proximaSecuencia: this.proximaAsignacion(asignacion),
        secuenciaFinal: asignacion.secuenciaFinal
      };
    } else {
      this.formAsignar = {
        idSucursal: disponibles[0]?.idSucursal || null,
        secuenciaInicial: huecoIni,
        proximaSecuencia: huecoIni,
        secuenciaFinal: huecoFin
      };
    }
    this.isAsignarOpen = true;
  }

  onTipoChange() {
    const tipo = this.tiposEcf.find(t => t.codigo === this.form.tipoEcfDgii);
    if (tipo) this.form.serie = tipo.serie;
  }

  onInicialChange() {
    const inicial = Number(this.form.secuenciaInicial) || 1;
    const proxima = Number(this.form.proximaSecuencia) || 0;
    if (!this.editMode && (proxima < inicial || proxima === 0)) {
      this.form.proximaSecuencia = inicial;
    }
  }

  onAsignarInicialChange() {
    const inicial = Number(this.formAsignar.secuenciaInicial) || 1;
    const proxima = Number(this.formAsignar.proximaSecuencia) || 0;
    if (!this.asignacionEditando && (proxima < inicial || proxima === 0)) {
      this.formAsignar.proximaSecuencia = inicial;
    }
  }

  proximaDe(s: SecuenciaEcfDto): number {
    return s.proximaSecuencia ?? s.secuenciaActual;
  }

  proximaAsignacion(a: SecuenciaEcfAsignacionDto): number {
    return a.proximaSecuencia ?? a.secuenciaActual;
  }

  previewEncf(serie: string, numero: number): string {
    return this.formatearEncf(serie, numero);
  }

  previewFormEncf(): string {
    return this.formatearEncf(this.form.serie, Number(this.form.proximaSecuencia) || 0);
  }

  previewAsignarEncf(): string {
    const serie = this.secuenciaAsignar?.serie || '';
    return this.formatearEncf(serie, Number(this.formAsignar.proximaSecuencia) || 0);
  }

  private formatearEncf(serie: string, numero: number): string {
    if (!serie || !numero) return '';
    return `${serie}${String(numero).padStart(10, '0')}`;
  }

  async save() {
    const inicial = Number(this.form.secuenciaInicial);
    const proxima = Number(this.form.proximaSecuencia);
    const final = Number(this.form.secuenciaFinal);

    if (!this.editMode && !this.form.tipoEcfDgii) {
      await this.showToast('Seleccione el tipo e-CF', 'warning');
      return;
    }
    if (!inicial || inicial < 1 || !final) {
      await this.showToast('Defina secuencia inicial y final (ejemplo: del 1 al 10)', 'warning');
      return;
    }
    if (final < inicial) {
      await this.showToast('La secuencia final debe ser mayor o igual a la inicial', 'warning');
      return;
    }
    if (!proxima || proxima < inicial || proxima > final) {
      await this.showToast(`La próxima secuencia debe estar entre ${inicial} y ${final}`, 'warning');
      return;
    }

    if (this.editMode) {
      const dto: SecuenciaEcfUpdateDto = {
        secuenciaInicial: inicial,
        proximaSecuencia: proxima,
        secuenciaFinal: final,
        fechaVencimiento: this.form.fechaVencimiento || undefined,
        stockMinimo: this.form.stockMinimo,
        activo: this.form.activo
      };
      this.feService.updateSecuencia(this.editId, dto).subscribe({
        next: () => { this.isModalOpen = false; this.cargar(); this.showToast('Autorización actualizada'); },
        error: (err) => this.showToast(this.mensajeError(err), 'danger')
      });
    } else {
      const dto: SecuenciaEcfCreateDto = {
        idEmpresa: this.parametro.IdEmpresa,
        tipoEcfDgii: this.form.tipoEcfDgii,
        serie: this.form.serie,
        secuenciaInicial: inicial,
        proximaSecuencia: proxima,
        secuenciaFinal: final,
        fechaVencimiento: this.form.fechaVencimiento || undefined,
        stockMinimo: this.form.stockMinimo || 50,
        ambiente: this.form.ambiente || 'PRUEBAS'
      };
      this.feService.createSecuencia(dto).subscribe({
        next: () => { this.isModalOpen = false; this.cargar(); this.showToast('Autorización creada'); },
        error: (err) => this.showToast(this.mensajeError(err), 'danger')
      });
    }
  }

  async saveAsignacion() {
    const s = this.secuenciaAsignar;
    if (!s) return;

    const idSucursal = Number(this.formAsignar.idSucursal);
    const inicial = Number(this.formAsignar.secuenciaInicial);
    const proxima = Number(this.formAsignar.proximaSecuencia);
    const final = Number(this.formAsignar.secuenciaFinal);

    if (!idSucursal) {
      await this.showToast('Indique la sucursal que usará este rango', 'warning');
      return;
    }
    if (!inicial || inicial < 1 || !final || final < inicial) {
      await this.showToast('Defina el rango que usará la sucursal', 'warning');
      return;
    }
    if (inicial < s.secuenciaInicial || final > s.secuenciaFinal) {
      await this.showToast(
        `El rango debe estar dentro de la autorización de la empresa (${s.secuenciaInicial}–${s.secuenciaFinal})`,
        'warning'
      );
      return;
    }
    if (!proxima || proxima < inicial || proxima > final) {
      await this.showToast(`La próxima secuencia debe estar entre ${inicial} y ${final}`, 'warning');
      return;
    }

    const dto: SecuenciaEcfAsignarDto = {
      idSucursal,
      secuenciaInicial: inicial,
      secuenciaFinal: final,
      proximaSecuencia: proxima
    };

    if (this.asignacionEditando) {
      this.feService.actualizarAsignacion(this.asignacionEditando.idAsignacion, dto).subscribe({
        next: () => {
          this.isAsignarOpen = false;
          this.cargar();
          this.showToast('Rango de sucursal actualizado');
        },
        error: (err) => this.showToast(this.mensajeError(err), 'danger')
      });
    } else {
      this.feService.asignarRango(s.idSecuencia, dto).subscribe({
        next: () => {
          this.isAsignarOpen = false;
          this.cargar();
          this.showToast('Rango asignado a la sucursal');
        },
        error: (err) => this.showToast(this.mensajeError(err), 'danger')
      });
    }
  }

  async desactivar(s: SecuenciaEcfDto) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Desactivar secuencia e${s.tipoEcfDgii} - ${s.descripcion}? También se desactivan los rangos de sucursal.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar', handler: () => {
            this.feService.desactivarSecuencia(s.idSecuencia).subscribe({
              next: () => { this.cargar(); this.showToast('Secuencia desactivada'); },
              error: () => this.showToast('Error', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async desactivarAsignacion(a: SecuenciaEcfAsignacionDto) {
    const alert = await this.alertCtrl.create({
      header: 'Quitar rango',
      message: `¿Quitar el rango de ${a.nombreSucursal || 'esta sucursal'}? Esa sucursal dejará de emitir este tipo de e-CF.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Quitar', handler: () => {
            this.feService.desactivarAsignacion(a.idAsignacion).subscribe({
              next: () => { this.cargar(); this.showToast('Rango de sucursal desactivado'); },
              error: () => this.showToast('Error', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  porcentajeUso(s: SecuenciaEcfDto): number {
    const total = s.secuenciaFinal - s.secuenciaInicial + 1;
    const usadas = this.asignacionesActivas(s);
    if (usadas.length > 0) {
      const usado = usadas.reduce((acc, a) => acc + Math.max(0, this.proximaAsignacion(a) - a.secuenciaInicial), 0);
      const totalAsig = usadas.reduce((acc, a) => acc + (a.secuenciaFinal - a.secuenciaInicial + 1), 0);
      return totalAsig > 0 ? Math.min(100, Math.max(0, Math.round((usado / totalAsig) * 100))) : 0;
    }
    const usado = this.proximaDe(s) - s.secuenciaInicial;
    return total > 0 ? Math.min(100, Math.max(0, Math.round((usado / total) * 100))) : 0;
  }

  porcentajeAsignacion(a: SecuenciaEcfAsignacionDto): number {
    const total = a.secuenciaFinal - a.secuenciaInicial + 1;
    const usado = this.proximaAsignacion(a) - a.secuenciaInicial;
    return total > 0 ? Math.min(100, Math.max(0, Math.round((usado / total) * 100))) : 0;
  }

  private resetForm() {
    return {
      tipoEcfDgii: null as number | null,
      serie: '',
      secuenciaInicial: 1,
      proximaSecuencia: 1,
      secuenciaFinal: 10,
      fechaVencimiento: '',
      stockMinimo: 50,
      ambiente: 'PRUEBAS',
      activo: true
    };
  }

  private resetFormAsignar() {
    return {
      idSucursal: null as number | null,
      secuenciaInicial: 1,
      proximaSecuencia: 1,
      secuenciaFinal: 10
    };
  }

  private mensajeError(err: any): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body;
    return body?.message || err?.message || 'Error al guardar';
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2800, color, position: 'top' });
    await t.present();
  }
}
