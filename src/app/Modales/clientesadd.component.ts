import { Component, OnInit, Input } from '@angular/core';
import { ClienteService } from '../servicios/cliente.service';
import { clientes } from '../models/clientes';
import { ToastController, ModalController, LoadingController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './clientesadd.component.html',
  styleUrls: ['./clientesadd.component.scss'],
})
export class ClientesAddComponent implements OnInit {
  @Input() cliente: clientes = new clientes();
  @Input() isEdit = false;
  guardando = false;

  constructor(
    private clienteService: ClienteService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private _Para: ParametrosService
  ) {}

  ngOnInit() {
    if (!this.cliente) {
      this.cliente = new clientes();
    }

    this.cliente.idEmpresa = this.cliente.idEmpresa || this._Para.GetIdEmpresa();
    this.cliente.fechaNacimiento = this.toDateInput(this.cliente.fechaNacimiento);

    if (!this.isEdit) {
      this.cliente.idCliente = 0;
    }
  }

  get iniciales(): string {
    const parts = (this.cliente?.nombreComercial || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async guardar() {
    this.cliente.idEmpresa = this._Para.GetIdEmpresa();

    if (!this.cliente.nombreComercial?.trim()) {
      await this.mostrarToast('El nombre comercial es obligatorio', 'warning');
      return;
    }

    if (this.guardando) return;
    this.guardando = true;

    const loading = await this.loadingCtrl.create({
      message: this.isEdit ? 'Actualizando…' : 'Guardando…'
    });
    await loading.present();

    this.cliente.nombreComercial = this.cliente.nombreComercial.trim();
    const req$ = this.isEdit && this.cliente.idCliente
      ? this.clienteService.EditarClientes(this.cliente)
      : this.clienteService.EnviarItem(this.cliente);

    req$.subscribe({
      next: async () => {
        await loading.dismiss();
        this.guardando = false;
        await this.mostrarToast(
          this.isEdit ? 'Cliente actualizado correctamente' : 'Cliente registrado correctamente',
          'success'
        );
        this.cerrar(true);
      },
      error: async (err) => {
        await loading.dismiss();
        this.guardando = false;
        const msg = err?.error?.message || err?.message || 'No se pudo guardar el cliente';
        await this.mostrarToast(msg, 'danger');
      }
    });
  }

  cerrar(actualizado = false) {
    this.modalCtrl.dismiss(actualizado);
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  }

  private async mostrarToast(msg: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2200,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
