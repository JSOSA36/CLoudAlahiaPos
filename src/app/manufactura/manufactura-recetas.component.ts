import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service';
import { ProductosService } from '../servicios/productos.service';
import { ProductoLite } from '../models/producto-lite.model';
import { ManufacturaService, RecetaDto, RecetaItemDto } from '../servicios/manufactura.service';

@Component({
  selector: 'app-manufactura-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './manufactura-recetas.component.html',
  styleUrls: ['../rrhh/rrhh-shared.scss', './manufactura.scss']
})
export class ManufacturaRecetasComponent implements OnInit {
  listado: RecetaDto[] = [];
  productos: ProductoLite[] = [];
  form: RecetaDto = this.empty();
  guardando = false;
  busquedaProducto = '';
  busquedaIngrediente = '';
  cantIngrediente = 1;
  idIngrediente: number | null = null;

  constructor(
    private api: ManufacturaService,
    private productosSrv: ProductosService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.parametros.ensureSessionFromStorage();
    this.cargar();
  }

  empty(): RecetaDto {
    return {
      idReceta: 0,
      idEmpresa: this.parametros.IdEmpresa,
      idProductoTerminado: 0,
      nombre: '',
      rendimientoBase: 1,
      activa: true,
      observacion: '',
      items: []
    };
  }

  get productosFiltrados(): ProductoLite[] {
    const q = (this.busquedaProducto || '').trim().toLowerCase();
    if (!q) return this.productos.slice(0, 40);
    return this.productos.filter(p => (p.descripcion || '').toLowerCase().includes(q)).slice(0, 40);
  }

  get ingredientesFiltrados(): ProductoLite[] {
    const q = (this.busquedaIngrediente || '').trim().toLowerCase();
    const usado = new Set(this.form.items.map(i => i.idProducto));
    usado.add(this.form.idProductoTerminado);
    const base = this.productos.filter(p => !usado.has(p.idProducto));
    if (!q) return base.slice(0, 40);
    return base.filter(p => (p.descripcion || '').toLowerCase().includes(q)).slice(0, 40);
  }

  nombreProducto(id: number): string {
    return this.productos.find(p => p.idProducto === id)?.descripcion || `#${id}`;
  }

  cargar(): void {
    const id = this.parametros.IdEmpresa;
    this.api.recetas(id).subscribe({ next: r => (this.listado = r || []) });
    this.productosSrv.getProductosLite(id).subscribe({ next: r => (this.productos = r || []) });
  }

  nuevo(): void {
    this.form = this.empty();
    this.busquedaProducto = '';
    this.busquedaIngrediente = '';
    this.idIngrediente = null;
  }

  editar(row: RecetaDto): void {
    this.api.receta(this.parametros.IdEmpresa, row.idReceta).subscribe({
      next: dto => {
        this.form = { ...this.empty(), ...dto, items: dto.items || [] };
        this.busquedaProducto = dto.nombreProducto || this.nombreProducto(dto.idProductoTerminado);
      },
      error: e => this.toast(this.msg(e, 'No se pudo abrir la receta'))
    });
  }

  elegirTerminado(p: ProductoLite): void {
    this.form.idProductoTerminado = p.idProducto;
    this.busquedaProducto = p.descripcion;
    if (!this.form.nombre?.trim()) this.form.nombre = p.descripcion;
    this.form.items = this.form.items.filter(i => i.idProducto !== p.idProducto);
  }

  elegirIngrediente(p: ProductoLite): void {
    this.idIngrediente = p.idProducto;
    this.busquedaIngrediente = p.descripcion;
  }

  agregarIngrediente(): void {
    if (!this.idIngrediente || this.cantIngrediente <= 0) {
      this.toast('Elija un componente y una cantidad mayor que cero.');
      return;
    }
    if (this.idIngrediente === this.form.idProductoTerminado) {
      this.toast('El producto terminado no puede ser ingrediente de sí mismo.');
      return;
    }
    const existente = this.form.items.find(i => i.idProducto === this.idIngrediente);
    if (existente) {
      existente.cantidad = Number(this.cantIngrediente);
    } else {
      const item: RecetaItemDto = {
        idProducto: this.idIngrediente,
        nombreProducto: this.nombreProducto(this.idIngrediente),
        cantidad: Number(this.cantIngrediente),
        orden: this.form.items.length + 1
      };
      this.form.items = [...this.form.items, item];
    }
    this.idIngrediente = null;
    this.busquedaIngrediente = '';
    this.cantIngrediente = 1;
  }

  quitarIngrediente(idProducto: number): void {
    this.form.items = this.form.items.filter(i => i.idProducto !== idProducto);
  }

  guardar(): void {
    if (!this.form.idProductoTerminado) {
      this.toast('Seleccione el producto terminado.');
      return;
    }
    if (!this.form.rendimientoBase || this.form.rendimientoBase <= 0) {
      this.toast('El rendimiento base debe ser mayor que cero.');
      return;
    }
    if (!this.form.items.length) {
      this.toast('Agregue al menos un componente.');
      return;
    }
    this.guardando = true;
    this.api.guardarReceta({
      ...this.form,
      idEmpresa: this.parametros.IdEmpresa,
      idUsuario: this.parametros.IdUsuario,
      nombre: this.form.nombre?.trim() || this.nombreProducto(this.form.idProductoTerminado)
    }).subscribe({
      next: saved => {
        this.guardando = false;
        this.form = { ...this.empty(), ...saved, items: saved.items || [] };
        this.cargar();
        this.toast('Receta guardada.');
      },
      error: e => {
        this.guardando = false;
        this.toast(this.msg(e, 'No se pudo guardar la receta'));
      }
    });
  }

  private msg(e: any, fallback: string): string {
    return e?.error?.message || e?.error?.Message || fallback;
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2600, color: 'dark' });
    await t.present();
  }
}
