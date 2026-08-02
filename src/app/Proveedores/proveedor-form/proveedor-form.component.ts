import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { Proveedor } from 'src/app/models/proveedores';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-proveedor-form',
  templateUrl: './proveedor-form.component.html',
  styleUrls: ['./proveedor-form.component.scss'],
})
export class ProveedorFormComponent implements OnInit {
  @Input() proveedor: Proveedor = new Proveedor();
  @Input() isEdit = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private parametro: ParametrosService
  ) {}

  ngOnInit(): void {
    if (!this.proveedor) {
      this.proveedor = new Proveedor();
    }
    this.proveedor.idEmpresa = this.proveedor.idEmpresa || this.parametro.GetIdEmpresa();
    if (!this.isEdit) {
      this.proveedor.isActivo = true;
      this.proveedor.idProveedor = 0;
    }
  }

  get iniciales(): string {
    const parts = (this.proveedor?.nombreComercial || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  cerrar() {
    this.modalCtrl.dismiss({ saved: false });
  }

  async guardar() {
    if (!this.proveedor.nombreComercial?.trim()) {
      const t = await this.toastCtrl.create({
        message: 'El nombre comercial es obligatorio',
        duration: 2200,
        color: 'warning',
        position: 'top'
      });
      await t.present();
      return;
    }

    this.proveedor.nombreComercial = this.proveedor.nombreComercial.trim();
    this.proveedor.idEmpresa = this.parametro.GetIdEmpresa();
    this.modalCtrl.dismiss({
      proveedor: { ...this.proveedor },
      isEdit: this.isEdit && this.proveedor.idProveedor > 0
    });
  }
}
