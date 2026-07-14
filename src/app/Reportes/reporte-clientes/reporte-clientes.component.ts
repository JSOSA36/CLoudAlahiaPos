import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { clientes } from 'src/app/models/clientes';
import { ClienteService } from 'src/app/servicios/cliente.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-reporte-clientes',
  templateUrl: './reporte-clientes.component.html',
  styleUrls: ['./reporte-clientes.component.scss'],
})
export class ReporteClientesComponent implements OnInit {
  lista: clientes[] = [];
  filtro = '';
  cargando = false;

  constructor(
    private service: ClienteService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(event?: any): void {
    this.cargando = !event;
    this.service.GetListadoClientes(this.parametro.GetIdEmpresa()).subscribe({
      next: (data) => {
        this.lista = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: async () => {
        this.cargando = false;
        event?.target?.complete?.();
        const t = await this.toastCtrl.create({
          message: 'No se pudo cargar el reporte de clientes',
          color: 'danger',
          duration: 2500
        });
        t.present();
      }
    });
  }

  get filtrados(): clientes[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.lista;
    return this.lista.filter(c =>
      [c.nombreComercial, c.cedulaRNC, c.telefono, c.celular, c.email, c.direccion]
        .some(v => (v || '').toLowerCase().includes(q))
    );
  }

  get resumen() {
    const filas = this.filtrados;
    return {
      total: filas.length,
      conCredito: filas.filter(c => Number(c.limiteCredito || 0) > 0).length,
      limiteTotal: filas.reduce((s, c) => s + Number(c.limiteCredito || 0), 0)
    };
  }
}
