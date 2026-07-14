import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Proveedor } from 'src/app/models/proveedores';
import { ProveedoresService } from 'src/app/servicios/proveedores.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-reporte-proveedores',
  templateUrl: './reporte-proveedores.component.html',
  styleUrls: ['./reporte-proveedores.component.scss'],
})
export class ReporteProveedoresComponent implements OnInit {
  lista: Proveedor[] = [];
  filtro = '';
  soloActivos = false;
  cargando = false;

  constructor(
    private service: ProveedoresService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(event?: any): void {
    this.cargando = !event;
    this.service.listar(this.parametro.GetIdEmpresa(), this.soloActivos).subscribe({
      next: (data) => {
        this.lista = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: async () => {
        this.cargando = false;
        event?.target?.complete?.();
        const t = await this.toastCtrl.create({
          message: 'No se pudo cargar el reporte de proveedores',
          color: 'danger',
          duration: 2500
        });
        t.present();
      }
    });
  }

  get filtrados(): Proveedor[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.lista;
    return this.lista.filter(p =>
      [p.nombreComercial, p.rnc, p.telefono, p.email, p.direccion]
        .some(v => (v || '').toLowerCase().includes(q))
    );
  }

  get resumen() {
    return {
      total: this.filtrados.length,
      activos: this.filtrados.filter(p => p.isActivo).length,
      inactivos: this.filtrados.filter(p => !p.isActivo).length
    };
  }
}
