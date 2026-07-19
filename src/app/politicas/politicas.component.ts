import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { PoliticasVersionDto } from '../models/politicas-servicio.models';
import { PoliticasServicioService } from '../servicios/politicas-servicio.service';
import { ParametrosService } from '../servicios/parametros.service';
import { formatearPoliticasContenido, PoliticasBloque } from './politicas-formato.util';

@Component({
  selector: 'app-politicas',
  templateUrl: './politicas.component.html',
  styleUrls: ['./politicas.component.scss']
})
export class PoliticasComponent implements OnInit, OnChanges {
  @Input() version!: PoliticasVersionDto;

  acepta = false;
  enviando = false;
  bloques: PoliticasBloque[] = [];

  constructor(
    private modalCtrl: ModalController,
    private politicasService: PoliticasServicioService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['version']) {
      this.rebuild();
    }
  }

  private rebuild(): void {
    this.bloques = formatearPoliticasContenido(this.version?.contenido);
  }

  async aceptar() {
    if (!this.acepta || !this.version || this.enviando) return;

    this.enviando = true;
    const ip = await this.politicasService.resolverDireccionIp();

    this.politicasService.aceptar({
      idEmpresa: this.parametros.IdEmpresa,
      idUsuario: this.parametros.IdUsuario,
      idVersion: this.version.idVersion,
      direccionIp: ip,
      navegador: navigator.userAgent || '',
      sistemaOperativo: this.politicasService.detectarSistemaOperativo()
    }).subscribe({
      next: async (res) => {
        this.enviando = false;
        if (!res.exitoso) {
          const toast = await this.toastCtrl.create({
            message: res.mensaje || 'No se pudo registrar la aceptación',
            duration: 3000,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
          return;
        }

        this.parametros.PoliticasAceptadas = true;
        localStorage.removeItem('politicas_aceptadas');
        await this.modalCtrl.dismiss({ aceptado: true });
      },
      error: async (err) => {
        this.enviando = false;
        const msg = err?.error?.mensaje || err?.error?.message || 'Error al aceptar las políticas';
        const toast = await this.toastCtrl.create({
          message: msg,
          duration: 3500,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }
}
