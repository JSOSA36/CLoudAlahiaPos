import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  PoliticasVersionDto
} from '../models/politicas-servicio.models';
import { PoliticasServicioService } from '../servicios/politicas-servicio.service';
import { ParametrosService } from '../servicios/parametros.service';
import { formatearPoliticasContenido, PoliticasBloque } from './politicas-formato.util';

@Component({
  selector: 'app-politicas-admin',
  templateUrl: './politicas-admin.component.html',
  styleUrls: ['./politicas-admin.component.scss']
})
export class PoliticasAdminComponent implements OnInit {
  versiones: PoliticasVersionDto[] = [];
  loading = false;
  creando = false;
  mostrandoForm = false;

  form = {
    numeroVersion: '',
    titulo: 'Políticas del Servicio - Alahia ERP',
    contenido: '',
    notas: ''
  };

  versionDetalle: PoliticasVersionDto | null = null;
  bloquesDetalle: PoliticasBloque[] = [];

  constructor(
    private politicasService: PoliticasServicioService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.politicasService.listarVersiones().subscribe({
      next: (data) => {
        this.versiones = data || [];
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        await this.toast('No se pudieron cargar las versiones', 'danger');
      }
    });
  }

  abrirNueva() {
    this.mostrandoForm = true;
    this.versionDetalle = null;
    this.bloquesDetalle = [];
    this.form = {
      numeroVersion: '',
      titulo: 'Políticas del Servicio - Alahia ERP',
      contenido: '',
      notas: ''
    };
  }

  cancelarForm() {
    this.mostrandoForm = false;
  }

  async guardarBorrador() {
    if (!this.form.numeroVersion.trim() || !this.form.contenido.trim()) {
      await this.toast('Versión y contenido son obligatorios', 'warning');
      return;
    }

    this.creando = true;
    try {
      await firstValueFrom(this.politicasService.crearBorrador({
        numeroVersion: this.form.numeroVersion.trim(),
        titulo: this.form.titulo.trim(),
        contenido: this.form.contenido,
        notas: this.form.notas || undefined,
        idUsuario: this.parametros.IdUsuario
      }));
      this.mostrandoForm = false;
      await this.toast('Borrador creado', 'success');
      this.cargar();
    } catch (err: any) {
      await this.toast(err?.error?.message || 'Error al crear borrador', 'danger');
    } finally {
      this.creando = false;
    }
  }

  verDetalle(v: PoliticasVersionDto) {
    this.mostrandoForm = false;
    this.versionDetalle = v;
    this.bloquesDetalle = formatearPoliticasContenido(v.contenido);
  }

  cerrarDetalle() {
    this.versionDetalle = null;
    this.bloquesDetalle = [];
  }

  async publicar(v: PoliticasVersionDto) {
    const alert = await this.alertCtrl.create({
      header: 'Publicar versión',
      message: `¿Publicar la versión ${v.numeroVersion}? La versión publicada actual quedará archivada. Las empresas deberán volver a aceptar.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Publicar',
          role: 'confirm',
          handler: () => { this.confirmarPublicar(v); }
        }
      ]
    });
    await alert.present();
  }

  private async confirmarPublicar(v: PoliticasVersionDto) {
    try {
      await firstValueFrom(this.politicasService.publicar({
        idVersion: v.idVersion,
        idUsuario: this.parametros.IdUsuario
      }));
      await this.toast(`Versión ${v.numeroVersion} publicada`, 'success');
      this.cargar();
    } catch (err: any) {
      await this.toast(err?.error?.message || 'Error al publicar', 'danger');
    }
  }

  badgeColor(estado: string): string {
    if (estado === 'Publicada') return 'success';
    if (estado === 'Borrador') return 'warning';
    return 'medium';
  }

  estadoClass(estado: string): string {
    if (estado === 'Publicada') return 'status--ok';
    if (estado === 'Borrador') return 'status--warn';
    return 'status--muted';
  }

  get totalPublicadas(): number {
    return this.versiones.filter(v => v.estado === 'Publicada').length;
  }

  get totalBorradores(): number {
    return this.versiones.filter(v => v.estado === 'Borrador').length;
  }

  get versionActivaLabel(): string {
    const activa = this.versiones.find(v => v.estado === 'Publicada');
    return activa ? `v${activa.numeroVersion}` : '—';
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2800, color, position: 'top' });
    await t.present();
  }
}
