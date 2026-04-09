import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { GastosService } from 'src/app/servicios/gastos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-gasto-form',
  templateUrl: './gastoadd.component.html',
  styleUrls: ['./gastoadd.component.scss'],
})
export class GastoFormPage implements OnInit {
  @Input() gasto: any = { tipoGasto: '', monto: 0, orien: '', detalle: '', idEmpleado: null, idEmpresa: 0 };
  @Input() isEdit: boolean = false;

  constructor(
    private gastosSrv: GastosService,
    private toastCtrl: ToastController,
    public modalCtrl: ModalController,
    private _Para: ParametrosService // ✅ inyectamos ParametrosService
  ) {}

  ngOnInit() {
    // 👉 siempre asignar el IdEmpresa dinámico al abrir el modal
    this.gasto.idEmpresa = this._Para.GetIdEmpresa();
  }

  async guardar() {
    // ✅ asegurar que antes de enviar esté el IdEmpresa correcto
    this.gasto.idEmpresa = this._Para.GetIdEmpresa();

    if (this.isEdit) {
      // 🔹 Actualizar gasto
      this.gastosSrv.actualizarGasto(this.gasto).subscribe(async () => {
        (await this.toastCtrl.create({
          message: '✏️ Gasto actualizado correctamente',
          duration: 1500,
          color: 'success'
        })).present();

        this.gasto = {}; // limpiar objeto
        this.modalCtrl.dismiss({ recargar: true });
      });
    } else {
      // 🔹 Crear gasto
      this.gastosSrv.crearGasto(this.gasto).subscribe(async () => {
        (await this.toastCtrl.create({
          message: '✅ Gasto registrado',
          duration: 1500,
          color: 'success'
        })).present();

        this.gasto = {}; // limpiar objeto
        this.modalCtrl.dismiss({ recargar: true });
      });
    }
  }

  cerrar() {
    this.modalCtrl.dismiss({ recargar: false });
  }
}
