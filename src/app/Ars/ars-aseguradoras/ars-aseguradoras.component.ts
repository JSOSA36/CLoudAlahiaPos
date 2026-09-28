import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { ArsAseguradora } from 'src/app/models/ars-aseguradora';
import { ArsAseguradoraService } from 'src/app/servicios/ars-aseguradora.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ArsFormComponent } from '../ars-form/ars-form.component';

@Component({
  selector: 'app-ars-aseguradoras',
  templateUrl: './ars-aseguradoras.component.html',
  styleUrls: ['./ars-aseguradoras.component.scss'],
})
export class ArsAseguradorasComponent implements OnInit {
  lista: ArsAseguradora[] = [];
  filtrados: ArsAseguradora[] = [];
  filtro = '';
  soloActivos = true;
  cargando = false;

  constructor(
    private arsService: ArsAseguradoraService,
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
    this.arsService.listar(idEmpresa, this.soloActivos).subscribe({
      next: (data) => {
        this.lista = (data || []).map(p => this.normalizar(p));
        this.filtrar();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.toast('Error cargando ARS', 'danger');
      }
    });
  }

  filtrar() {
    const q = this.filtro.trim().toLowerCase();
    this.filtrados = !q
      ? [...this.lista]
      : this.lista.filter(p =>
          [p.nombre, p.rnc, p.telefono, p.email, p.contacto]
            .some(v => (v || '').toLowerCase().includes(q))
        );
  }

  iniciales(nombre?: string): string {
    const parts = (nombre || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async abrirForm(ars?: ArsAseguradora, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();

    const idEmpresa = this.parametro.GetIdEmpresa();
    const base = ars
      ? this.normalizar(ars)
      : Object.assign(new ArsAseguradora(), { idEmpresa, activo: true });

    const modal = await this.modalCtrl.create({
      component: ArsFormComponent,
      cssClass: 'proveedor-form-modal',
      componentProps: {
        ars: { ...base },
        isEdit: !!(ars && ars.idArs > 0)
      }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data?.ars) return;

    const p = this.normalizar(data.ars as ArsAseguradora);
    p.idEmpresa = idEmpresa;

    if (data.isEdit && p.idArs > 0) {
      this.arsService.actualizar(p.idArs, p).subscribe({
        next: () => {
          this.toast('ARS actualizada', 'success');
          this.cargar();
        },
        error: (e) => this.toast(e?.error?.message || 'Error al actualizar', 'danger')
      });
    } else {
      p.idArs = 0;
      this.arsService.crear(p).subscribe({
        next: () => {
          this.toast('ARS creada', 'success');
          this.cargar();
        },
        error: (e) => this.toast(e?.error?.message || 'Error al crear', 'danger')
      });
    }
  }

  async cambiarEstado(ars: ArsAseguradora, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    const activar = !ars.activo;
    const alert = await this.alertCtrl.create({
      header: activar ? 'Activar ARS' : 'Desactivar ARS',
      message: activar
        ? `¿Activar a ${ars.nombre}? Volverá a aparecer en cobros nuevos.`
        : `¿Desactivar a ${ars.nombre}? No aparecerá en operaciones nuevas, pero se conserva en el historial.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: activar ? 'Activar' : 'Desactivar',
          handler: () => {
            const req = activar
              ? this.arsService.activar(ars.idArs, this.parametro.GetIdEmpresa())
              : this.arsService.desactivar(ars.idArs, this.parametro.GetIdEmpresa());
            req.subscribe({
              next: () => {
                this.toast(activar ? 'ARS activada' : 'ARS desactivada', 'success');
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

  private normalizar(raw: any): ArsAseguradora {
    const p = new ArsAseguradora();
    p.idArs = Number(raw?.idArs ?? raw?.IdArs ?? 0);
    p.idEmpresa = Number(raw?.idEmpresa ?? raw?.IdEmpresa ?? this.parametro.GetIdEmpresa());
    p.nombre = String(raw?.nombre ?? raw?.Nombre ?? '');
    p.rnc = String(raw?.rnc ?? raw?.RNC ?? '');
    p.telefono = String(raw?.telefono ?? raw?.Telefono ?? '');
    p.direccion = String(raw?.direccion ?? raw?.Direccion ?? '');
    p.email = String(raw?.email ?? raw?.Email ?? '');
    p.contacto = String(raw?.contacto ?? raw?.Contacto ?? '');
    p.observaciones = String(raw?.observaciones ?? raw?.Observaciones ?? '');
    p.activo = raw?.activo ?? raw?.Activo ?? true;
    return p;
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }
}
