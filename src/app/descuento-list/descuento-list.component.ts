import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { DescuentoHeaderService } from 'src/app/servicios/descuento-header.service';
import { DescuentoHeader } from 'src/app/models/descuento-header.model';
import { DescuentoFormComponent } from '../descuento-form/descuento-form.component';

@Component({
  selector: 'app-descuento-list',
  templateUrl: './descuento-list.component.html',
  styleUrls: ['./descuento-list.component.scss'],
})
export class DescuentoListComponent implements OnInit {

  descuentos: DescuentoHeader[] = [];
  loading: boolean = true;

  idEmpresa: number = Number(localStorage.getItem("IdEmpresa")) || 0;

  constructor(
    private srv: DescuentoHeaderService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.cargarDescuentos();
  }

  cargarDescuentos() {
    this.loading = true;

    this.srv.getAll(this.idEmpresa).subscribe({
      next: (resp) => {
        this.descuentos = resp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  async abrirCrear() {
    const modal = await this.modalCtrl.create({
      component: DescuentoFormComponent,
      componentProps: {
        modo: 'crear'
      }
    });

    modal.onDidDismiss().then(result => {
      if (result.data === 'refresh') {
        this.cargarDescuentos();
      }
    });

    await modal.present();
  }

  async abrirEditar(item: DescuentoHeader) {
    const modal = await this.modalCtrl.create({
      component: DescuentoFormComponent,
      componentProps: {
        modo: 'editar',
        data: item
      }
    });

    modal.onDidDismiss().then(result => {
      if (result.data === 'refresh') {
        this.cargarDescuentos();
      }
    });

    await modal.present();
  }
toggleDescuento(item: DescuentoHeader) {
  this.srv.toggleEstado(item.idDescuentoHeader).subscribe(() => {
    item.activo = !item.activo;
  });
}

  eliminar(id: number) {
    const confirmar = confirm("¿Seguro que deseas eliminar este descuento?");
    if (!confirmar) return;

    this.srv.delete(id).subscribe(() => {
      this.cargarDescuentos();
    });
  }

  refrescar(ev: any) {
    this.cargarDescuentos();
    setTimeout(() => ev.target.complete(), 700);
  }
}
