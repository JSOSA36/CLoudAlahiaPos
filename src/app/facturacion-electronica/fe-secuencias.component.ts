import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import {
  SecuenciaEcfDto,
  SecuenciaEcfCreateDto,
  SecuenciaEcfUpdateDto
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
  loading = false;
  isModalOpen = false;
  editMode = false;
  editId = 0;

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

  constructor(
    private feService: FacturacionElectronicaService,
    private parametro: ParametrosService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.feService.getSecuencias(this.parametro.IdEmpresa).subscribe({
      next: (data) => { this.secuencias = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
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
      secuenciaFinal: s.secuenciaFinal,
      fechaVencimiento: s.fechaVencimiento ? s.fechaVencimiento.substring(0, 10) : '',
      stockMinimo: s.stockMinimo,
      ambiente: s.ambiente || 'PRUEBAS',
      activo: s.activo
    };
    this.isModalOpen = true;
  }

  onTipoChange() {
    const tipo = this.tiposEcf.find(t => t.codigo === this.form.tipoEcfDgii);
    if (tipo) this.form.serie = tipo.serie;
  }

  async save() {
    if (!this.form.tipoEcfDgii || !this.form.secuenciaFinal) {
      const toast = await this.toastCtrl.create({
        message: 'Complete tipo e-CF y secuencia final',
        duration: 2000, color: 'warning', position: 'top'
      });
      await toast.present();
      return;
    }

    if (this.editMode) {
      const dto: SecuenciaEcfUpdateDto = {
        secuenciaFinal: this.form.secuenciaFinal,
        fechaVencimiento: this.form.fechaVencimiento || undefined,
        stockMinimo: this.form.stockMinimo,
        activo: this.form.activo
      };
      this.feService.updateSecuencia(this.editId, dto).subscribe({
        next: () => { this.isModalOpen = false; this.cargar(); this.showToast('Secuencia actualizada'); },
        error: () => this.showToast('Error al actualizar', 'danger')
      });
    } else {
      const dto: SecuenciaEcfCreateDto = {
        idEmpresa: this.parametro.IdEmpresa,
        tipoEcfDgii: this.form.tipoEcfDgii,
        serie: this.form.serie,
        secuenciaInicial: this.form.secuenciaInicial || 1,
        secuenciaFinal: this.form.secuenciaFinal,
        fechaVencimiento: this.form.fechaVencimiento || undefined,
        stockMinimo: this.form.stockMinimo || 50,
        ambiente: this.form.ambiente || 'PRUEBAS'
      };
      this.feService.createSecuencia(dto).subscribe({
        next: () => { this.isModalOpen = false; this.cargar(); this.showToast('Secuencia creada'); },
        error: () => this.showToast('Error al crear', 'danger')
      });
    }
  }

  async desactivar(s: SecuenciaEcfDto) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Desactivar secuencia e${s.tipoEcfDgii} - ${s.descripcion}?`,
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

  porcentajeUso(s: SecuenciaEcfDto): number {
    const total = s.secuenciaFinal - s.secuenciaInicial + 1;
    const usado = s.secuenciaActual - s.secuenciaInicial;
    return total > 0 ? Math.round((usado / total) * 100) : 0;
  }

  private resetForm() {
    return {
      tipoEcfDgii: null as number | null,
      serie: '',
      secuenciaInicial: 1,
      secuenciaFinal: 0,
      fechaVencimiento: '',
      stockMinimo: 50,
      ambiente: 'PRUEBAS',
      activo: true
    };
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000, color, position: 'top' });
    await t.present();
  }
}
