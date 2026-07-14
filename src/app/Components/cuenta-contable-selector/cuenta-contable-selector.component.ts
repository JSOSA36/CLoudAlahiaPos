import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CuentaContable } from 'src/app/models/CuentaContable.models';
import {
  ModoSeleccionCuenta,
  CuentaContableNodoVista,
  aplanarArbolVisible,
  construirArbolCuentas,
  esCuentaSeleccionable,
  inicializarExpandidos,
  obtenerEtiquetaCuenta,
  obtenerIdsVisiblesPorBusqueda,
  obtenerMapaCuentas,
  paddingNodoCuenta
} from 'src/app/utils/cuenta-contable.util';

@Component({
  selector: 'app-cuenta-contable-selector',
  templateUrl: './cuenta-contable-selector.component.html',
  styleUrls: ['./cuenta-contable-selector.component.scss'],
})
export class CuentaContableSelectorComponent implements OnInit, OnChanges {
  @Input() cuentas: CuentaContable[] = [];
  @Input() value: number | null | undefined = null;
  @Output() valueChange = new EventEmitter<number | null>();

  @Input() label = 'Cuenta contable';
  @Input() placeholder = 'Seleccionar cuenta...';
  @Input() disabled = false;
  @Input() modo: ModoSeleccionCuenta = 'movimiento';
  @Input() permitirVacio = false;
  @Input() textoVacio = 'Seleccionar...';
  @Input() excluirIds: number[] = [];

  abierto = false;
  busqueda = '';
  expandidos = new Set<number>();
  nodosVisibles: CuentaContableNodoVista[] = [];
  arbol: CuentaContable[] = [];
  mapaCuentas = new Map<number, CuentaContable>();

  ngOnInit(): void {
    this.prepararArbol();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cuentas'] || changes['excluirIds']) {
      this.prepararArbol();
    }
  }

  get textoSeleccionado(): string {
    if (this.value === null || this.value === undefined || this.value === 0) {
      return this.permitirVacio ? this.textoVacio : this.placeholder;
    }

    const cuenta = this.mapaCuentas.get(this.value);
    return cuenta ? obtenerEtiquetaCuenta(cuenta) : this.placeholder;
  }

  prepararArbol(): void {
    const excluir = new Set(this.excluirIds || []);
    const cuentasFiltradas = this.cuentas.filter(c => !excluir.has(c.idCuentaContable));
    this.mapaCuentas = obtenerMapaCuentas(cuentasFiltradas);
    this.arbol = construirArbolCuentas(cuentasFiltradas);
    this.expandidos = inicializarExpandidos(cuentasFiltradas);
    this.actualizarNodosVisibles();
  }

  actualizarNodosVisibles(): void {
    const excluir = new Set(this.excluirIds || []);
    const cuentasFiltradas = this.cuentas.filter(c => !excluir.has(c.idCuentaContable));
    const idsVisibles = obtenerIdsVisiblesPorBusqueda(cuentasFiltradas, this.busqueda);

    if (idsVisibles) {
      idsVisibles.forEach(id => this.expandidos.add(id));
    }

    this.nodosVisibles = aplanarArbolVisible(
      this.arbol,
      1,
      this.expandidos,
      idsVisibles,
      this.busqueda
    );
  }

  abrir(): void {
    if (this.disabled) return;
    this.busqueda = '';
    this.expandidos = inicializarExpandidos(this.cuentas);
    this.actualizarNodosVisibles();
    this.abierto = true;
  }

  cerrar(): void {
    this.abierto = false;
  }

  onBusqueda(): void {
    this.actualizarNodosVisibles();
  }

  padding(nodo: CuentaContableNodoVista): number {
    return paddingNodoCuenta(nodo.nivel, !nodo.cuenta.permiteMovimiento);
  }

  esSeleccionable(cuenta: CuentaContable): boolean {
    return esCuentaSeleccionable(cuenta, this.modo);
  }

  toggleExpandir(nodo: CuentaContableNodoVista, event: Event): void {
    event.stopPropagation();

    if (!nodo.tieneHijos) return;

    if (this.expandidos.has(nodo.cuenta.idCuentaContable)) {
      this.expandidos.delete(nodo.cuenta.idCuentaContable);
    } else {
      this.expandidos.add(nodo.cuenta.idCuentaContable);
    }

    this.actualizarNodosVisibles();
  }

  seleccionar(cuenta: CuentaContable): void {
    if (!this.esSeleccionable(cuenta)) return;

    this.value = cuenta.idCuentaContable;
    this.valueChange.emit(this.value);
    this.cerrar();
  }

  onFilaClick(nodo: CuentaContableNodoVista, event: Event): void {
    if (!nodo.cuenta.permiteMovimiento) {
      if (this.esSeleccionable(nodo.cuenta)) {
        this.seleccionar(nodo.cuenta);
        return;
      }
      this.toggleExpandir(nodo, event);
      return;
    }

    this.seleccionar(nodo.cuenta);
  }

  limpiarSeleccion(): void {
    if (!this.permitirVacio) return;

    this.value = null;
    this.valueChange.emit(null);
    this.cerrar();
  }
}
