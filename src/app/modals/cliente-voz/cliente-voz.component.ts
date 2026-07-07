import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-cliente-voz',    // puedes renombrarlo luego
  templateUrl: './cliente-voz.component.html',
  styleUrls: ['./cliente-voz.component.scss'],
})
export class ClienteVozComponent implements OnInit {

  nombreCliente: string = "";
  clientesEncontrados: any[] = [];
  cargando: boolean = false;
  busquedaRealizada: boolean = false;
telefonoCliente: string = "";
  constructor(
    private modalCtrl: ModalController,
    private clienteSrv: ClienteService,
    private _Parametro: ParametrosService
  ) {}

  ngOnInit() {
    // ya no usamos inicializarReconocimiento()
    // porque eliminamos la voz
  }

  // 🔍 Buscar clientes por nombre
buscarCliente() {

  const texto = this.nombreCliente.trim();

  // ⛔ Si está vacío → limpiar y no mostrar nada
  if (texto === "") {
    this.clientesEncontrados = [];
    this.busquedaRealizada = false;
    return;
  }

  this.busquedaRealizada = true;
  this.cargando = true;

  this.clienteSrv
    .BuscarPorNombre(this._Parametro.GetIdEmpresa(), texto)
    .subscribe({
      next: (resp) => {
        this.clientesEncontrados = resp;
        this.cargando = false;
      },
      error: () => {
        this.clientesEncontrados = [];
        this.cargando = false;
      },
    });
}


  // ✔ Seleccionar cliente
  seleccionarCliente(c: any) {
    this.modalCtrl.dismiss(c);
  }

  // ➕ Crear cliente cuando no existe
  crearCliente() {
    if (!this.nombreCliente.trim()) return;

    const dto: any = {
      idCliente: 0,
      nombreComercial: this.nombreCliente.trim(),
      cedulaRNC: "",
      telefono: this.telefonoCliente.trim(),
celular: this.telefonoCliente.trim(),
      fechaNacimiento: null,
      email: "",
      direccion: "",
      nota: "",
      estado: true,
      limiteCredito: 0,
      idEmpresa: this._Parametro.GetIdEmpresa()
    };

    this.clienteSrv.EnviarItem(dto).subscribe(resp => {
      console.log(resp);
      this.modalCtrl.dismiss({ cliente: resp });
    });
  }

  // ❌ Cerrar modal
  cerrar() {
    this.modalCtrl.dismiss(null);
  }
}
