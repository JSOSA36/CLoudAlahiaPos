import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  ActivoFijo,
  ESTADOS_ACTIVO_FIJO,
  etiquetaEstadoActivo
} from 'src/app/models/activos-fijos.models';
import { ActivosFijosService } from 'src/app/servicios/activos-fijos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-activo-fijo-detalle',
  templateUrl: './activo-fijo-detalle.component.html',
  styleUrls: ['./activo-fijo-detalle.component.scss'],
})
export class ActivoFijoDetalleComponent implements OnInit {
  activo: ActivoFijo | null = null;
  cargando = true;
  guardando = false;

  form = {
    descripcion: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    ubicacion: '',
    responsable: '',
    observacion: '',
    valorResidual: 0,
    vidaUtilMeses: null as number | null,
    estado: 'PENDIENTE_DATOS'
  };

  readonly estados = ESTADOS_ACTIVO_FIJO;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ActivosFijosService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/activos-fijos']);
      return;
    }
    this.cargar(id);
  }

  cargar(id: number): void {
    this.cargando = true;
    this.service.detalle(id, this.parametro.GetIdEmpresa()).subscribe({
      next: (a) => {
        this.activo = a;
        this.form = {
          descripcion: a.descripcion || '',
          marca: a.marca || '',
          modelo: a.modelo || '',
          numeroSerie: a.numeroSerie || '',
          // Si no hay ubicación libre, hereda el almacén de recepción.
          ubicacion: (a.ubicacion || a.nombreAlmacenRecepcion || '').trim(),
          responsable: a.responsable || '',
          observacion: a.observacion || '',
          valorResidual: Number(a.valorResidual || 0),
          vidaUtilMeses: a.vidaUtilMeses ?? null,
          estado: (a.estado || 'PENDIENTE_DATOS').toUpperCase()
        };
        this.cargando = false;
      },
      error: async () => {
        this.cargando = false;
        const t = await this.toastCtrl.create({
          message: 'Activo fijo no encontrado',
          color: 'danger',
          duration: 2500
        });
        t.present();
        this.router.navigate(['/activos-fijos']);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/activos-fijos']);
  }

  async guardar(): Promise<void> {
    if (!this.activo) return;
    if (!this.form.descripcion.trim()) {
      const t = await this.toastCtrl.create({
        message: 'La descripción es obligatoria',
        color: 'warning',
        duration: 2000
      });
      t.present();
      return;
    }

    this.guardando = true;
    const ubicacionGuardar = (this.form.ubicacion?.trim()
      || this.activo.nombreAlmacenRecepcion
      || '').trim() || undefined;

    this.service.actualizar(this.activo.idActivoFijo, {
      idEmpresa: this.parametro.GetIdEmpresa(),
      descripcion: this.form.descripcion.trim(),
      marca: this.form.marca?.trim() || undefined,
      modelo: this.form.modelo?.trim() || undefined,
      numeroSerie: this.form.numeroSerie?.trim() || undefined,
      ubicacion: ubicacionGuardar,
      responsable: this.form.responsable?.trim() || undefined,
      observacion: this.form.observacion?.trim() || undefined,
      valorResidual: Number(this.form.valorResidual || 0),
      vidaUtilMeses: this.form.vidaUtilMeses,
      estado: this.form.estado
    }).subscribe({
      next: async (res) => {
        this.guardando = false;
        if (res?.data) {
          this.activo = res.data;
          this.form.estado = (res.data.estado || this.form.estado).toUpperCase();
        }
        const t = await this.toastCtrl.create({
          message: 'Activo actualizado',
          color: 'success',
          duration: 2000
        });
        t.present();
      },
      error: async (err) => {
        this.guardando = false;
        const t = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo guardar',
          color: 'danger',
          duration: 2500
        });
        t.present();
      }
    });
  }

  etiquetaEstado = etiquetaEstadoActivo;

  irCompra(): void {
    if (!this.activo?.idOrdenCompraHeader) return;
    this.router.navigate(['/compras', this.activo.idOrdenCompraHeader]);
  }
}
