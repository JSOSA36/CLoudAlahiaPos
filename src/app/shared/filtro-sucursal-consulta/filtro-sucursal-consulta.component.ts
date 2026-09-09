import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { SucursalService } from 'src/app/servicios/sucursal.service';
import { SucursalSesion } from 'src/app/models/sucursal-sesion.models';

@Component({
  selector: 'app-filtro-sucursal-consulta',
  templateUrl: './filtro-sucursal-consulta.component.html',
  styleUrls: ['./filtro-sucursal-consulta.component.scss']
})
export class FiltroSucursalConsultaComponent implements OnInit {
  /** 0 = Todas (solo sucursales a las que el usuario tiene acceso, validado en API). */
  @Input() valor = 0;
  @Output() valorChange = new EventEmitter<number>();

  sucursales: SucursalSesion[] = [];

  constructor(
    private parametros: ParametrosService,
    private sucursalApi: SucursalService
  ) {}

  get visible(): boolean {
    return this.sucursales.filter(s => s?.activa !== false).length > 1;
  }

  ngOnInit(): void {
    this.sucursales = (this.parametros.sucursales || []).filter(s => s?.activa !== false);
    if (this.sucursales.length === 0) {
      this.sucursalApi.listar().subscribe({
        next: lista => {
          this.sucursales = (lista || []).filter(s => s?.activa !== false);
          if (this.sucursales.length) {
            this.parametros.setSucursalSesion(this.parametros.IdSucursal, lista);
          }
        }
      });
    }
  }

  etiqueta(s: SucursalSesion): string {
    const nombre = (s?.nombre || '').trim();
    return nombre.replace(/^sucursal\s+/i, '').trim() || nombre;
  }

  icono(s: SucursalSesion, activo: boolean): string {
    if (s.esPrincipal) {
      return activo ? 'business' : 'business-outline';
    }
    return activo ? 'storefront' : 'storefront-outline';
  }

  seleccionar(id: number): void {
    const v = Number(id) || 0;
    if (v === this.valor) return;
    this.valorChange.emit(v);
  }
}
