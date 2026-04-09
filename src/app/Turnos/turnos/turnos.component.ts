import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { trigger, state, style, transition, animate } from '@angular/animations';
@Component({
  selector: 'app-turnos',
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.scss'],
  animations: [
    trigger('entradaCliente', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px) scale(0.95)' }),
        animate('700ms ease-out', style({ opacity: 1, transform: 'translateX(0) scale(1)' }))
      ])
    ])
  ]
})
export class TurnosComponent  implements OnInit {


clientes = [
{ nombre: 'Carlos', estado: 'Recortando' },
{ nombre: 'Pedro', estado: 'En turno' },
{ nombre: 'Luis', estado: 'En turno' },
{ nombre: 'Andrés', estado: 'En turno' },

];
  constructor(private toastCtrl: ToastController) { }

clientesActivos: any[] = [];

ngOnInit() {
  this.actualizarClientesActivos();
}

actualizarClientesActivos() {
  this.clientesActivos = this.clientes.filter(
    c => c.estado === 'En turno' || c.estado === 'Recortando'
  );
}

accionCliente(cliente: any) {
  if(cliente.estado === 'En turno') {
    cliente.estado = 'Recortando';
  } else if(cliente.estado === 'Recortando') {
    cliente.estado = 'Atendido';
  }
  this.actualizarClientesActivos(); // actualizar la lista filtrada
}

getButtonColor(estado: string) {
  switch(estado) {
    case 'En turno': return 'success';
    case 'Recortando': return 'danger';
    default: return 'medium';
  }
}

getButtonTexto(estado: string) {
  switch(estado) {
    case 'En turno': return 'Atender';
    case 'Recortando': return 'Finalizar';
    default: return 'OK';
  }
}
simularNuevoCliente() {
  const nuevoCliente = {
    nombre: 'Cliente ' + (this.clientes.length + 1),
    estado: 'En turno',
    nuevo: false  // inicialmente falso
  };

  this.clientes.push(nuevoCliente);
  this.actualizarClientesActivos();

   const audio = new Audio('assets/Dim.mp3');
  audio.play();
  // Aplicar la clase de animación después de un ciclo de Angular
  setTimeout(() => {
    nuevoCliente.nuevo = true;
    this.actualizarClientesActivos();

    // Quitar la clase después de que termine la animación
    setTimeout(() => {
      nuevoCliente.nuevo = false;
      this.actualizarClientesActivos();
    }, 700); // misma duración que la animación CSS
  }, 50);
}
}
