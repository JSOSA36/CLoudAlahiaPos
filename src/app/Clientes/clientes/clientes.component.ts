import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
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

  // 🔹 Nuevo input para determinar si está en modo selección
  @Input() isModalSeleccion: boolean = false;

  form: any = {
    idCliente: 0,
    nombreComercial: '',
    telefono: '',
    celular: '',
    fechaNacimiento: '',
    email: '',
    direccion: '',
    cedulaRNC: '',
    nota: '',
    estado: true
  };

  clientes: clientes[] = [];
  clientesFiltrados: clientes[] = [];
  filtro: string = '';

  constructor(
    public _Parametro: ParametrosService,
    private router: Router,
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
  // 🔹 Cargar todos los clientes desde el API
  cargarClientes() {
    this._cliente.GetListadoClientes(this._Parametro.GetIdEmpresa()).subscribe({
      next: (data) => {
        this.clientes = data || [];
        this.clientesFiltrados = [...this.clientes];
        console.log('Clientes cargados:', this.clientes);
      },
      error: (err) => {
        console.error('Error cargando clientes', err);
      }
    });
  }

  // 🔎 Filtrar clientes
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
        c?.nota
      ].map(v => this.normalize(String(v ?? '')));
      return campos.some(txt => txt.includes(q));
    });
  }

  // 🔹 Abrir modal para crear o editar
  async openModal(cliente: clientes | null) {
  const clienteData = cliente ? { ...cliente } : new clientes(); // 👈 se asegura que siempre tenga estructura
  const modal = await this.modal.create({
    component: ClientesAddComponent,
    componentProps: {
      cliente: clienteData,
      isEdit: !!cliente
    }
  });

  await modal.present();
  const { data } = await modal.onDidDismiss();

  if (data) {
    this.cargarClientes();
    const t = await this.toastCtrl.create({
      message: 'Cambios aplicados ✅',
      duration: 1400,
      color: 'success'
    });
    t.present();
  }
}


  // 🔹 Seleccionar cliente (solo si es modal de selección)
  seleccionarCliente(c: clientes) {
    if (this.isModalSeleccion) {
      console.log('✅ Cliente seleccionado:', c);
      this.modal.dismiss({ cliente: c });
    }
  }

  // 🔹 Guardar cliente (modo inline)
guardarCliente() {
  console.log('🔥 ENTRÓ A guardarCliente()');

  if (!this.form?.nombreComercial?.trim()) {
    this.toastCtrl.create({
      message: 'Nombre requerido',
      duration: 1500,
      color: 'warning'
    }).then(t => t.present());
    return;
  }

  const esNuevo = this.form.idCliente === 0;

  const obs$ = esNuevo
    ? this._cliente.EnviarItem(this.form)
    : this._cliente.EditarClientes(this.form);

  obs$.subscribe({
    next: async () => {
      const msg = esNuevo ? 'Cliente creado ✅' : 'Cliente actualizado ✅';

      (await this.toastCtrl.create({
        message: msg,
        duration: 1500,
        color: 'success'
      })).present();
    },

    error: (err) => console.error('❌ Error guardando cliente', err),

    complete: () => {
      console.warn("🔥 COMPLETE EJECUTADO — redirigiendo si es nuevo");

      this.cargarClientes();
      this.resetForm();

      if (esNuevo) {
        this.router.navigateByUrl('/categoria');
      }
    }
  });
}


  // 🔹 Eliminar cliente
  async eliminarCliente(cliente: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Seguro que deseas eliminar a ${cliente?.nombreComercial}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this._cliente.DeleteIten(cliente.idCliente).subscribe({
              next: async () => {
                (await this.toastCtrl.create({ message: 'Cliente eliminado ✅', duration: 1400, color: 'success' })).present();
                this.cargarClientes();
              },
              error: (err) => console.error('Error eliminando cliente', err)
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // 🔹 Resetear formulario
  resetForm() {
    this.form = {
      idCliente: 0,
      nombreComercial: '',
      telefono: '',
      celular: '',
      fechaNacimiento: '',
      email: '',
      direccion: '',
      nota: '',
      estado: true
    };
  }

  // 🔹 Utilidades
  private normalize(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // 🔹 Para *ngFor performance
  trackByCliente = (_: number, c: any) => c?.idCliente ?? _;
}
