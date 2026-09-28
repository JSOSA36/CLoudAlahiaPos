import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ArsAseguradora } from 'src/app/models/ars-aseguradora';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-ars-form',
  templateUrl: './ars-form.component.html',
  styleUrls: ['./ars-form.component.scss'],
})
export class ArsFormComponent implements OnInit {
  @Input() ars: ArsAseguradora = new ArsAseguradora();
  @Input() isEdit = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private parametro: ParametrosService
  ) {}

  ngOnInit(): void {
    if (!this.ars) this.ars = new ArsAseguradora();
    this.ars.idEmpresa = this.ars.idEmpresa || this.parametro.GetIdEmpresa();
    if (!this.isEdit) {
      this.ars.activo = true;
      this.ars.idArs = 0;
    }
  }

  get iniciales(): string {
    const parts = (this.ars?.nombre || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  cerrar() {
    this.modalCtrl.dismiss({ saved: false });
  }

  async guardar() {
    if (!this.ars.nombre?.trim()) {
      const t = await this.toastCtrl.create({
        message: 'El nombre de la ARS es obligatorio',
        duration: 2200,
        color: 'warning',
        position: 'top'
      });
      await t.present();
      return;
    }

    this.ars.nombre = this.ars.nombre.trim();
    this.ars.idEmpresa = this.parametro.GetIdEmpresa();
    this.modalCtrl.dismiss({
      ars: { ...this.ars },
      isEdit: this.isEdit && this.ars.idArs > 0
    });
  }
}
