import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service';
import { AlmacenesService } from '../servicios/almacenes.service';
import { UsuariosService } from '../servicios/usuarios.service';
import { Almacen } from '../models/almacenes.model';
import { UsuarioDto } from '../models/usuariodto.model';
import {
  ManufacturaService,
  ExplosionDto,
  ExplosionMaterialDto,
  OrdenProduccionDto,
  RecetaDto
} from '../servicios/manufactura.service';

@Component({
  selector: 'app-manufactura-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './manufactura-ordenes.component.html',
  styleUrls: ['../rrhh/rrhh-shared.scss', './manufactura.scss']
})
export class ManufacturaOrdenesComponent implements OnInit {
  listado: OrdenProduccionDto[] = [];
  recetas: RecetaDto[] = [];
  almacenes: Almacen[] = [];
  usuarios: UsuarioDto[] = [];
  filtroEstado = '';
  form: OrdenProduccionDto = this.empty();
  explosion: ExplosionDto | null = null;
  cantidadReal = 0;
  consumos: { idProducto: number; nombreProducto?: string; cantidadTeorica: number; cantidadReal: number; unidad?: string | null }[] = [];
  guardando = false;
  accionando = false;

  readonly estados = [
    { id: '', label: 'Todas' },
    { id: 'BORRADOR', label: 'Borrador' },
    { id: 'PLANIFICADA', label: 'Planificada' },
    { id: 'EN_PROCESO', label: 'En proceso' },
    { id: 'COMPLETADA', label: 'Completada' },
    { id: 'CANCELADA', label: 'Cancelada' }
  ];

  constructor(
    private api: ManufacturaService,
    private almacenesSrv: AlmacenesService,
    private usuariosSrv: UsuariosService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.parametros.ensureSessionFromStorage();
    this.cargarCatalogos();
    this.cargar();
  }

  empty(): OrdenProduccionDto {
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      idOrdenProduccion: 0,
      idEmpresa: this.parametros.IdEmpresa,
      numero: '',
      idReceta: 0,
      idProductoTerminado: 0,
      cantidadPlanificada: 1,
      idAlmacenOrigen: 0,
      idAlmacenDestino: 0,
      fecha: hoy,
      idUsuarioResponsable: this.parametros.IdUsuario || null,
      observacion: '',
      estado: 'BORRADOR',
      costoMateriales: 0,
      costoUnitario: 0,
      hayFaltantes: false,
      materiales: []
    };
  }

  get materiales(): ExplosionMaterialDto[] {
    return this.form.materiales?.length ? this.form.materiales : (this.explosion?.materiales || []);
  }

  get faltantes(): ExplosionMaterialDto[] {
    return this.materiales.filter(m => (m.faltante || 0) > 0);
  }

  get soloLectura(): boolean {
    return this.form.estado === 'COMPLETADA' || this.form.estado === 'CANCELADA';
  }

  get puedeEditarCabecera(): boolean {
    return !this.form.idOrdenProduccion || this.form.estado === 'BORRADOR';
  }

  etiquetaEstado(estado: string): string {
    return this.estados.find(e => e.id === estado)?.label || estado;
  }

  idUsuario(u: UsuarioDto): number {
    return Number((u as any).idusuario ?? (u as any).idUsuario ?? 0);
  }

  cargarCatalogos(): void {
    const id = this.parametros.IdEmpresa;
    this.api.recetas(id, undefined, true).subscribe({ next: r => (this.recetas = r || []) });
    this.almacenesSrv.getAlmacenes(id).subscribe({
      next: r => {
        this.almacenes = (r || []).filter(a => a.activo !== false);
        const principal = this.almacenes.find(a => a.esPrincipal) || this.almacenes[0];
        if (principal && !this.form.idAlmacenOrigen) {
          this.form.idAlmacenOrigen = principal.idAlmacen;
          this.form.idAlmacenDestino = principal.idAlmacen;
        }
      }
    });
    this.usuariosSrv.getUsuarios(id).subscribe({ next: r => (this.usuarios = r || []) });
  }

  cargar(): void {
    this.api.ordenes(this.parametros.IdEmpresa, this.filtroEstado || undefined).subscribe({
      next: r => (this.listado = r || [])
    });
  }

  nuevo(): void {
    const origen = this.form.idAlmacenOrigen;
    const destino = this.form.idAlmacenDestino;
    this.form = this.empty();
    this.form.idAlmacenOrigen = origen;
    this.form.idAlmacenDestino = destino;
    this.explosion = null;
    this.cantidadReal = 0;
    this.consumos = [];
  }

  abrir(row: OrdenProduccionDto): void {
    this.api.orden(this.parametros.IdEmpresa, row.idOrdenProduccion).subscribe({
      next: dto => this.aplicarOrden(dto),
      error: e => this.toast(this.msg(e, 'No se pudo abrir la orden'))
    });
  }

  onCambioExplosion(): void {
    if (!this.puedeEditarCabecera) return;
    this.recalcular();
  }

  recalcular(): void {
    if (!this.form.idReceta || !this.form.cantidadPlanificada || this.form.cantidadPlanificada <= 0) {
      this.explosion = null;
      return;
    }
    this.api.explotar(
      this.parametros.IdEmpresa,
      this.form.idReceta,
      this.form.cantidadPlanificada,
      this.form.idAlmacenOrigen || undefined
    ).subscribe({
      next: dto => {
        this.explosion = dto;
        if (this.puedeEditarCabecera) {
          this.form.materiales = dto.materiales;
          this.form.hayFaltantes = dto.hayFaltantes;
          this.form.idProductoTerminado = dto.idProductoTerminado;
          this.form.nombreProducto = dto.nombreProducto;
        }
      },
      error: e => this.toast(this.msg(e, 'No se pudo calcular los materiales'))
    });
  }

  guardar(): void {
    if (!this.form.idReceta) {
      this.toast('Seleccione una receta.');
      return;
    }
    if (!this.form.cantidadPlanificada || this.form.cantidadPlanificada <= 0) {
      this.toast('Indique la cantidad a producir.');
      return;
    }
    if (!this.form.idAlmacenOrigen || !this.form.idAlmacenDestino) {
      this.toast('Indique almacén de materias primas y de producto terminado.');
      return;
    }
    this.guardando = true;
    this.api.guardarOrden({
      idOrdenProduccion: this.form.idOrdenProduccion,
      idEmpresa: this.parametros.IdEmpresa,
      idUsuario: this.parametros.IdUsuario,
      idReceta: this.form.idReceta,
      cantidadPlanificada: this.form.cantidadPlanificada,
      idAlmacenOrigen: this.form.idAlmacenOrigen,
      idAlmacenDestino: this.form.idAlmacenDestino,
      fecha: this.form.fecha,
      idUsuarioResponsable: this.form.idUsuarioResponsable || null,
      observacion: this.form.observacion
    }).subscribe({
      next: dto => {
        this.guardando = false;
        this.aplicarOrden(dto);
        this.cargar();
        this.toast('Orden guardada en borrador.');
      },
      error: e => {
        this.guardando = false;
        this.toast(this.msg(e, 'No se pudo guardar la orden'));
      }
    });
  }

  planificar(): void {
    this.ejecutar(() => this.api.planificar(this.parametros.IdEmpresa, this.form.idOrdenProduccion, this.parametros.IdUsuario),
      'Orden planificada. Revise faltantes antes de iniciar.');
  }

  iniciar(): void {
    this.ejecutar(() => this.api.iniciar(this.parametros.IdEmpresa, this.form.idOrdenProduccion, this.parametros.IdUsuario),
      'Producción iniciada.');
  }

  cancelar(): void {
    this.ejecutar(() => this.api.cancelar(this.parametros.IdEmpresa, this.form.idOrdenProduccion, this.parametros.IdUsuario),
      'Orden cancelada.');
  }

  completar(): void {
    if (!this.cantidadReal || this.cantidadReal <= 0) {
      this.toast('Indique la cantidad realmente producida.');
      return;
    }
    this.accionando = true;
    this.api.completar(this.form.idOrdenProduccion, {
      idEmpresa: this.parametros.IdEmpresa,
      idUsuario: this.parametros.IdUsuario,
      cantidadReal: this.cantidadReal,
      consumos: this.consumos.map(c => ({ idProducto: c.idProducto, cantidadReal: Number(c.cantidadReal) }))
    }).subscribe({
      next: dto => {
        this.accionando = false;
        this.aplicarOrden(dto);
        this.cargar();
        this.toast('Producción completada. El inventario ya se actualizó.');
      },
      error: e => {
        this.accionando = false;
        this.toast(this.msg(e, 'No se pudo completar'));
      }
    });
  }

  crearCompra(): void {
    this.accionando = true;
    this.api.requerimientoCompra(this.parametros.IdEmpresa, this.form.idOrdenProduccion, this.parametros.IdUsuario).subscribe({
      next: r => {
        this.accionando = false;
        this.toast(r.mensaje);
        if (r.idOrdenesCompra?.length) {
          this.router.navigateByUrl('/compras/ordenes');
        } else {
          this.abrir(this.form);
        }
      },
      error: e => {
        this.accionando = false;
        this.toast(this.msg(e, 'No se pudo crear el requerimiento de compra'));
      }
    });
  }

  private ejecutar(fn: () => any, ok: string): void {
    if (!this.form.idOrdenProduccion) {
      this.toast('Guarde la orden primero.');
      return;
    }
    this.accionando = true;
    fn().subscribe({
      next: (dto: OrdenProduccionDto) => {
        this.accionando = false;
        this.aplicarOrden(dto);
        this.cargar();
        this.toast(ok);
      },
      error: (e: any) => {
        this.accionando = false;
        this.toast(this.msg(e, 'No se pudo completar la acción'));
      }
    });
  }

  private aplicarOrden(dto: OrdenProduccionDto): void {
    this.form = {
      ...this.empty(),
      ...dto,
      fecha: (dto.fecha || '').toString().slice(0, 10),
      materiales: dto.materiales || []
    };
    this.explosion = null;
    this.cantidadReal = Number(dto.cantidadReal || dto.cantidadPlanificada || 0);
    this.consumos = (dto.materiales || []).map(m => ({
      idProducto: m.idProducto,
      nombreProducto: m.nombreProducto,
      cantidadTeorica: m.cantidadTeorica,
      cantidadReal: Number(m.cantidadReal ?? m.cantidadTeorica),
      unidad: m.unidad
    }));
  }

  private msg(e: any, fallback: string): string {
    return e?.error?.message || e?.error?.Message || fallback;
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3200, color: 'dark' });
    await t.present();
  }
}
