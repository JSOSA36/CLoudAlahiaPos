import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Proveedor } from 'src/app/models/proveedores';
import { ProveedoresService } from 'src/app/servicios/proveedores.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ProveedorFormComponent } from '../proveedor-form/proveedor-form.component';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss'],
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  filtrados: Proveedor[] = [];
  filtro = '';
  soloActivos = true;

  constructor(
    private proveedoresService: ProveedoresService,
    private parametro: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ionViewWillEnter() {
    this.cargar();
  }

  cargar() {
    const idEmpresa = this.parametro.GetIdEmpresa();
    this.proveedoresService.listar(idEmpresa, this.soloActivos).subscribe({
      next: (data) => {
        this.proveedores = data || [];
        this.filtrar();
      },
      error: () => this.toast('Error cargando proveedores')
    });
  }

  filtrar() {
    const q = this.filtro.trim().toLowerCase();
    this.filtrados = !q
      ? [...this.proveedores]
      : this.proveedores.filter(p =>
          [p.nombreComercial, p.rnc, p.telefono, p.email]
            .some(v => (v || '').toLowerCase().includes(q))
        );
  }

  async abrirForm(proveedor?: Proveedor) {
    const modal = await this.modalCtrl.create({
      component: ProveedorFormComponent,
      componentProps: {
        proveedor: proveedor ? { ...proveedor } : new Proveedor(),
        isEdit: !!proveedor
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data?.proveedor) return;

    const p = data.proveedor as Proveedor;
    const idEmpresa = this.parametro.GetIdEmpresa();

    if (proveedor?.idProveedor) {
      this.proveedoresService.actualizar(proveedor.idProveedor, p).subscribe({
        next: () => { this.toast('Proveedor actualizado'); this.cargar(); },
        error: (e) => this.toast(e?.error?.message || 'Error al actualizar')
      });
    } else {
      p.idEmpresa = idEmpresa;
      this.proveedoresService.crear(p).subscribe({
        next: () => { this.toast('Proveedor creado'); this.cargar(); },
        error: (e) => this.toast(e?.error?.message || 'Error al crear')
      });
    }
  }

  async desactivar(proveedor: Proveedor) {
    const alert = await this.alertCtrl.create({
      header: 'Desactivar proveedor',
      message: `¿Desactivar a ${proveedor.nombreComercial}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          handler: () => {
            this.proveedoresService
              .desactivar(proveedor.idProveedor, this.parametro.GetIdEmpresa())
              .subscribe({
                next: () => { this.toast('Proveedor desactivado'); this.cargar(); },
                error: (e) => this.toast(e?.error?.message || 'Error')
              });
          }
        }
      ]
    });
    await alert.present();
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, color: 'medium' });
    await t.present();
  }
}
