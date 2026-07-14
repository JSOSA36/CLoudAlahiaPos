import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  ActivoFijo,
  ESTADOS_ACTIVO_FIJO,
  ResumenActivosFijos,
  etiquetaEstadoActivo
} from 'src/app/models/activos-fijos.models';
import { ActivosFijosService } from 'src/app/servicios/activos-fijos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

type FiltroEstado = 'TODOS' | string;

@Component({
  selector: 'app-activos-fijos-list',
  templateUrl: './activos-fijos-list.component.html',
  styleUrls: ['./activos-fijos-list.component.scss'],
})
export class ActivosFijosListComponent implements OnInit {
  activos: ActivoFijo[] = [];
  resumen: ResumenActivosFijos | null = null;
  filtro = '';
  filtroEstado: FiltroEstado = 'TODOS';
  cargando = false;

  readonly chips: { codigo: FiltroEstado; etiqueta: string }[] = [
    { codigo: 'TODOS', etiqueta: 'Todos' },
    ...ESTADOS_ACTIVO_FIJO.map(e => ({
      codigo: e.codigo,
      etiqueta: e.etiqueta
    }))
  ];

  constructor(
    private service: ActivosFijosService,
    private parametro: ParametrosService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(event?: any): void {
    const idEmpresa = this.parametro.GetIdEmpresa();
    this.cargando = !event;

    this.service.resumen(idEmpresa).subscribe({
      next: (r) => { this.resumen = r; },
      error: () => { this.resumen = null; }
    });

    this.service.listar(idEmpresa).subscribe({
      next: (data) => {
        this.activos = data || [];
        this.cargando = false;
        event?.target?.complete?.();
      },
      error: async () => {
        this.cargando = false;
        event?.target?.complete?.();
        const t = await this.toastCtrl.create({
          message: 'No se pudieron cargar los activos fijos',
          color: 'danger',
          duration: 2500
        });
        t.present();
      }
    });
  }

  get filtrados(): ActivoFijo[] {
    const q = this.filtro.trim().toLowerCase();
    return this.activos.filter(a => {
      if (this.filtroEstado !== 'TODOS' && (a.estado || '').toUpperCase() !== this.filtroEstado) {
        return false;
      }
      if (!q) return true;
      return [
        a.codigoActivo,
        a.descripcion,
        a.numeroSerie,
        a.responsable,
        a.ubicacion,
        a.nombreProducto,
        a.numeroDocumentoCompra
      ].some(v => (v || '').toLowerCase().includes(q));
    });
  }

  abrir(a: ActivoFijo): void {
    this.router.navigate(['/activos-fijos', a.idActivoFijo]);
  }

  etiquetaEstado = etiquetaEstadoActivo;

  claseEstado(estado?: string): string {
    const e = (estado || '').toUpperCase();
    switch (e) {
      case 'ACTIVO': return 'est-activo';
      case 'PENDIENTE_DATOS': return 'est-pendiente';
      case 'BAJA': return 'est-baja';
      case 'EN_MANTENIMIENTO': return 'est-mant';
      default: return '';
    }
  }
}
