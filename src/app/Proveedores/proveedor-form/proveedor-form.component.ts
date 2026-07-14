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
    private parametro: ParametrosService
  ) {}

  ngOnInit(): void {
    if (!this.isEdit) {
      this.proveedor.idEmpresa = this.parametro.GetIdEmpresa();
      this.proveedor.isActivo = true;
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    if (!this.proveedor.nombreComercial?.trim()) {
      return;
    }
    this.modalCtrl.dismiss({ proveedor: this.proveedor });
  }
}
