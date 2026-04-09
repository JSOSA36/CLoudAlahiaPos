import { Component, OnInit, Input } from '@angular/core';
import { ClienteService } from '../servicios/cliente.service';
import { clientes } from '../models/clientes';
import { ToastController, NavController, ModalController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service'; // ✅ importar ParametrosService

@Component({
  selector: 'app-cliente-form',
  templateUrl: './clientesadd.component.html',
  styleUrls: ['./clientesadd.component.scss'],
})
export class ClientesAddComponent implements OnInit {

  @Input() cliente: clientes = new clientes();
  @Input() isEdit = false;

  constructor(
    private clienteService: ClienteService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private _Para: ParametrosService // ✅ inyectamos ParametrosService
  ) {}

  async ngOnInit() {

    // ⚠️ Evitar sobrescribir cliente existente
    if (!this.cliente) {
      this.cliente = new clientes();
    }

    // ✅ Esperar que ParametrosService tenga el IdEmpresa disponible
    await this.cargarEmpresa();

    console.log('🧾 Cliente recibido:', this.cliente);
    console.log('🆔 idCliente:', this.cliente?.idCliente, 'idEmpresa:', this.cliente?.idEmpresa);
  }

  // ======================================================
  // 🔹 Método que asegura que el IdEmpresa esté cargado
  // ======================================================
  private async cargarEmpresa() {
    let intentos = 0;
    while ((!this._Para.IdEmpresa || this._Para.IdEmpresa === 0) && intentos < 10) {
      await new Promise(r => setTimeout(r, 200)); // espera 200ms
      intentos++;
    }

    // 🔹 Solo asignar IdEmpresa si el cliente no lo tiene
    if (!this.cliente.idEmpresa || this.cliente.idEmpresa === 0) {
      this.cliente.idEmpresa = this._Para.IdEmpresa;
    }

    console.log('✅ IdEmpresa asignado correctamente:', this.cliente.idEmpresa);
  }

  // ======================================================
  // 💾 Guardar cliente (nuevo o edición)
  // ======================================================
  guardar() {
    // ✅ asegurar que antes de enviar esté el IdEmpresa correcto
    this.cliente.idEmpresa = this._Para.IdEmpresa;

    if (!this.cliente.nombreComercial?.trim()) {
      this.mostrarToast('El nombre comercial es obligatorio');
      return;
    }

    if (this.isEdit && this.cliente.idCliente) {
      this.clienteService.EditarClientes(this.cliente).subscribe(() => {
        this.mostrarToast('Cliente actualizado correctamente');
        this.cerrar(true);
      });
    } else {
      this.clienteService.EnviarItem(this.cliente).subscribe(() => {
        this.mostrarToast('Cliente registrado correctamente');
        this.cerrar(true);
      });
    }
  }

  // ======================================================
  // 🗑️ Eliminar cliente
  // ======================================================
  eliminar() {
    if (!this.cliente.idCliente) {
      this.mostrarToast('No se puede eliminar sin un ID válido');
      return;
    }

    this.clienteService.DeleteIten(this.cliente.idCliente).subscribe(() => {
      this.mostrarToast('Cliente eliminado correctamente');
      this.cerrar(true);
    });
  }

  // ======================================================
  // 🔙 Cerrar modal o vista
  // ======================================================
  cerrar(actualizado = false) {
    if (this.modalCtrl) {
      this.modalCtrl.dismiss(actualizado);
    } else {
      this.navCtrl.back();
    }
  }

  // ======================================================
  // 🍞 Mostrar notificación Toast
  // ======================================================
  private async mostrarToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'success'
    });
    toast.present();
  }
}
