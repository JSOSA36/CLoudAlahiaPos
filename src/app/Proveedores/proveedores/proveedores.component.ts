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
  cargando = false;

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
    this.cargando = true;
    const idEmpresa = this.parametro.GetIdEmpresa();
    this.proveedoresService.listar(idEmpresa, this.soloActivos).subscribe({
      next: (data) => {
        this.proveedores = (data || []).map(p => this.normalizar(p));
        this.filtrar();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.toast('Error cargando proveedores', 'danger');
      }
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

  iniciales(nombre?: string): string {
    const parts = (nombre || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async abrirForm(proveedor?: Proveedor, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();

    const idEmpresa = this.parametro.GetIdEmpresa();
    const base = proveedor
      ? this.normalizar(proveedor)
      : Object.assign(new Proveedor(), { idEmpresa, isActivo: true });

    const modal = await this.modalCtrl.create({
      component: ProveedorFormComponent,
      cssClass: 'proveedor-form-modal',
      componentProps: {
        proveedor: { ...base },
        isEdit: !!(proveedor && proveedor.idProveedor > 0)
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data?.proveedor) return;

    const p = this.normalizar(data.proveedor as Proveedor);
    p.idEmpresa = idEmpresa;

    if (data.isEdit && p.idProveedor > 0) {
      this.proveedoresService.actualizar(p.idProveedor, p).subscribe({
        next: () => {
          this.toast('Proveedor actualizado', 'success');
          this.cargar();
        },
        error: (e) => this.toast(e?.error?.message || 'Error al actualizar', 'danger')
      });
    } else {
      p.idProveedor = 0;
      this.proveedoresService.crear(p).subscribe({
        next: () => {
          this.toast('Proveedor creado', 'success');
          this.cargar();
        },
        error: (e) => this.toast(e?.error?.message || 'Error al crear', 'danger')
      });
    }
  }

  async desactivar(proveedor: Proveedor, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();

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
                next: () => {
                  this.toast('Proveedor desactivado', 'success');
                  this.cargar();
                },
                error: (e) => this.toast(e?.error?.message || 'Error', 'danger')
              });
          }
        }
      ]
    });
    await alert.present();
  }

  private normalizar(raw: any): Proveedor {
    const p = new Proveedor();
    p.idProveedor = Number(raw?.idProveedor ?? raw?.IdProveedor ?? 0);
    p.idEmpresa = Number(raw?.idEmpresa ?? raw?.IdEmpresa ?? this.parametro.GetIdEmpresa());
    p.rnc = String(raw?.rnc ?? raw?.RNC ?? '');
    p.nombreComercial = String(raw?.nombreComercial ?? raw?.NombreComercial ?? '');
    p.telefono = String(raw?.telefono ?? raw?.Telefono ?? '');
    p.direccion = String(raw?.direccion ?? raw?.Direccion ?? '');
    p.email = String(raw?.email ?? raw?.Email ?? '');
    p.nota = String(raw?.nota ?? raw?.Nota ?? '');
    p.isActivo = raw?.isActivo ?? raw?.IsActivo ?? true;
    return p;
  }

  private async toast(message: string, color: 'success' | 'danger' | 'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }
}
