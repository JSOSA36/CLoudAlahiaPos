import { Component, OnInit, Input } from '@angular/core';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ClientesAddComponent } from 'src/app/Modales/clientesadd.component';
import { clientes } from 'src/app/models/clientes';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
})
export class ClientesComponent implements OnInit {
  @Input() isModalSeleccion = false;

  clientes: clientes[] = [];
  clientesFiltrados: clientes[] = [];
  filtro = '';

  constructor(
    public _Parametro: ParametrosService,
    public modal: ModalController,
    private _cliente: ClienteService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cerrarModal() {
    this.modal.dismiss();
  }

  cargarClientes() {
    this._cliente.GetListadoClientes(this._Parametro.GetIdEmpresa()).subscribe({
      next: (data) => {
        this.clientes = (data || []).map(c => this.normalizar(c));
        this.filtrarClientes();
      },
      error: async () => {
        const t = await this.toastCtrl.create({
          message: 'Error cargando clientes',
          duration: 2000,
          color: 'danger'
        });
        t.present();
      }
    });
  }

  filtrarClientes() {
    const q = this.normalize(this.filtro);
    if (!q) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }
    this.clientesFiltrados = this.clientes.filter(c => {
      const campos = [
        c?.nombreComercial,
        c?.telefono,
        c?.celular,
        c?.email,
        c?.direccion,
        c?.cedulaRNC,
        c?.nota
      ].map(v => this.normalize(String(v ?? '')));
      return campos.some(txt => txt.includes(q));
    });
  }

  iniciales(nombre?: string): string {
    const parts = (nombre || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async openModal(cliente: clientes | null, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();

    const clienteData = cliente
      ? this.normalizar(cliente)
      : Object.assign(new clientes(), {
          idEmpresa: this._Parametro.GetIdEmpresa()
        });

    const modal = await this.modal.create({
      component: ClientesAddComponent,
      cssClass: 'cliente-form-modal',
      componentProps: {
        cliente: { ...clienteData },
        isEdit: !!(cliente && cliente.idCliente > 0)
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data) {
      this.cargarClientes();
    }
  }

  seleccionarCliente(c: clientes) {
    if (this.isModalSeleccion) {
      this.modal.dismiss({ cliente: c });
    }
  }

  async eliminarCliente(cliente: any, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();

    const alert = await this.alertCtrl.create({
      header: 'Eliminar cliente',
      message: `¿Seguro que deseas eliminar a ${cliente?.nombreComercial}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this._cliente.DeleteIten(cliente.idCliente).subscribe({
              next: async () => {
                (await this.toastCtrl.create({
                  message: 'Cliente eliminado',
                  duration: 1400,
                  color: 'success',
                  position: 'top'
                })).present();
                this.cargarClientes();
              },
              error: async () => {
                (await this.toastCtrl.create({
                  message: 'No se pudo eliminar el cliente',
                  duration: 2000,
                  color: 'danger',
                  position: 'top'
                })).present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  private normalizar(raw: any): clientes {
    const c = new clientes();
    c.idCliente = Number(raw?.idCliente ?? raw?.IdCliente ?? 0);
    c.idEmpresa = Number(raw?.idEmpresa ?? raw?.IdEmpresa ?? this._Parametro.GetIdEmpresa());
    c.nombreComercial = String(raw?.nombreComercial ?? raw?.NombreComercial ?? '');
    c.telefono = String(raw?.telefono ?? raw?.Telefono ?? '');
    c.celular = String(raw?.celular ?? raw?.Celular ?? '');
    c.email = String(raw?.email ?? raw?.Email ?? '');
    c.direccion = String(raw?.direccion ?? raw?.Direccion ?? '');
    c.cedulaRNC = String(raw?.cedulaRNC ?? raw?.CedulaRNC ?? '');
    c.nota = String(raw?.nota ?? raw?.Nota ?? '');
    c.limiteCredito = Number(raw?.limiteCredito ?? raw?.LimiteCredito ?? 0);

    const fecha = raw?.fechaNacimiento ?? raw?.FechaNacimiento ?? '';
    c.fechaNacimiento = this.toDateInput(fecha);
    return c;
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  }

  private normalize(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  trackByCliente = (_: number, c: any) => c?.idCliente ?? _;
}
