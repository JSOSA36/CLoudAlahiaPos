import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ProductoBusquedaCompra } from 'src/app/models/producto-busqueda.model';
import { ProductosService } from 'src/app/servicios/productos.service';

@Component({
  selector: 'app-producto-linea-busqueda',
  templateUrl: './producto-linea-busqueda.component.html',
  styleUrls: ['./producto-linea-busqueda.component.scss'],
})
export class ProductoLineaBusquedaComponent implements OnInit, OnDestroy {
  @Input() idEmpresa = 0;
  @Input() idAlmacen?: number;
  @Input() disabled = false;

  /** Escaneo / Enter: agregar directo con cantidad 1 */
  @Output() agregarRapido = new EventEmitter<ProductoBusquedaCompra>();
  /** Clic o selección manual: rellenar línea y enfocar cantidad */
  @Output() seleccionar = new EventEmitter<ProductoBusquedaCompra>();

  @ViewChild('inputBusqueda') inputBusqueda?: ElementRef<HTMLIonSearchbarElement>;

  busqueda = '';
  resultados: ProductoBusquedaCompra[] = [];
  indiceSeleccionado = 0;
  cargando = false;
  total = 0;
  page = 1;
  hasMore = false;
  mostrarListadoManual = false;

  private readonly pageSize = 25;
  private readonly busqueda$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.sub = this.busqueda$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          this.cargando = true;
          this.page = 1;
          return this.productosService.buscarCompra(
            this.idEmpresa,
            q,
            1,
            this.pageSize,
            this.idAlmacen
          );
        })
      )
      .subscribe({
        next: (res) => this.aplicarResultado(res, false),
        error: () => {
          this.cargando = false;
          this.resultados = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  enfocarBusqueda(): void {
    setTimeout(() => this.inputBusqueda?.nativeElement?.setFocus(), 50);
  }

  onBuscarInput(): void {
    const texto = (this.busqueda || '').trim();
    if (!texto) {
      this.resultados = [];
      this.total = 0;
      this.hasMore = false;
      return;
    }
    this.busqueda$.next(texto);
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.resultados = [];
    this.total = 0;
    this.hasMore = false;
    this.indiceSeleccionado = 0;
    this.mostrarListadoManual = false;
  }

  toggleListadoManual(): void {
    this.mostrarListadoManual = !this.mostrarListadoManual;
    if (this.mostrarListadoManual && !this.busqueda.trim()) {
      this.busqueda$.next('');
    }
  }

  cargarMas(): void {
    if (!this.hasMore || this.cargando) {
      return;
    }
    this.cargando = true;
    const nextPage = this.page + 1;
    this.productosService
      .buscarCompra(
        this.idEmpresa,
        this.busqueda.trim(),
        nextPage,
        this.pageSize,
        this.idAlmacen
      )
      .subscribe({
        next: (res) => {
          this.page = res.page;
          this.hasMore = res.hasMore;
          this.total = res.total;
          this.resultados = [...this.resultados, ...(res.items || [])];
          this.cargando = false;
        },
        error: () => {
          this.cargando = false;
        }
      });
  }

  async procesarEnter(): Promise<void> {
    const texto = (this.busqueda || '').trim();
    if (!texto || this.disabled) {
      return;
    }

    const exactoLista = this.resultados.find(
      p => (p.codigoBarra || '').trim() === texto
    );
    if (exactoLista) {
      this.agregarRapido.emit(exactoLista);
      this.limpiarBusqueda();
      this.enfocarBusqueda();
      return;
    }

    this.productosService
      .GetProductosByBarCode(texto, this.idEmpresa)
      .subscribe({
        next: (p) => {
          if (p?.idProducto) {
            const item = this.mapProducto(p);
            this.agregarRapido.emit(item);
            this.limpiarBusqueda();
            this.enfocarBusqueda();
            return;
          }
          this.seleccionarDestacado();
        },
        error: () => this.seleccionarDestacado()
      });
  }

  seleccionarProducto(item: ProductoBusquedaCompra, rapido = false): void {
    if (this.disabled) {
      return;
    }
    if (rapido) {
      this.agregarRapido.emit(item);
      this.limpiarBusqueda();
      this.enfocarBusqueda();
      return;
    }
    this.seleccionar.emit(item);
    this.busqueda = item.nombre || '';
    this.resultados = [];
  }

  seleccionarProductoMouse(item: ProductoBusquedaCompra): void {
    this.seleccionarProducto(item, false);
  }

  existenciaDisplay(item: ProductoBusquedaCompra): number {
    if (this.idAlmacen && this.idAlmacen > 0) {
      return Number(item.existenciaAlmacen ?? 0);
    }
    return Number(item.cantidad ?? 0);
  }

  codigoDisplay(item: ProductoBusquedaCompra): string {
    const barra = (item.codigoBarra || '').trim();
    if (barra && barra !== 'N/A') {
      return barra;
    }
    return `#${item.idProducto}`;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled || !this.resultados.length) {
      return;
    }
    const target = event.target as HTMLElement;
    if (!target.closest('.fc-producto-busqueda')) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.indiceSeleccionado = Math.min(
        this.indiceSeleccionado + 1,
        this.resultados.length - 1
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.indiceSeleccionado = Math.max(this.indiceSeleccionado - 1, 0);
    }
  }

  private seleccionarDestacado(): void {
    if (!this.resultados.length) {
      return;
    }
    const item = this.resultados[this.indiceSeleccionado];
    this.agregarRapido.emit(item);
    this.limpiarBusqueda();
    this.enfocarBusqueda();
  }

  private aplicarResultado(res: any, append: boolean): void {
    const rawItems = res?.items ?? res?.Items ?? [];
    const items = rawItems.map((i: ProductoBusquedaCompra) => this.normalizarItem(i));
    this.total = res?.total ?? res?.Total ?? items.length;
    this.page = res?.page ?? res?.Page ?? 1;
    this.hasMore = !!(res?.hasMore ?? res?.HasMore);
    this.resultados = append ? [...this.resultados, ...items] : items;
    this.indiceSeleccionado = 0;
    this.cargando = false;
  }

  private normalizarItem(item: any): ProductoBusquedaCompra {
    return {
      idProducto: item.idProducto ?? item.IdProducto ?? 0,
      codigoBarra: item.codigoBarra ?? item.CodigoBarra,
      nombre: item.nombre ?? item.Nombre,
      cantidad: Number(item.cantidad ?? item.Cantidad ?? 0),
      existenciaAlmacen: Number(item.existenciaAlmacen ?? item.ExistenciaAlmacen ?? 0),
      precioCompra: Number(item.precioCompra ?? item.PrecioCompra ?? 0),
      controlarStock: !!(item.controlarStock ?? item.ControlarStock),
      esServicio: !!(item.esServicio ?? item.EsServicio),
      tipoComportamiento: item.tipoComportamiento ?? item.TipoComportamiento,
      itbis: !!(item.itbis ?? item.Itbis)
    };
  }

  private mapProducto(p: {
    idProducto: number;
    codigoBarra?: string;
    nombre?: string;
    cantidad?: number;
    precioCompra?: number;
    controlarStock?: boolean;
    esServicio?: boolean;
    tipoComportamiento?: string;
    itbis?: boolean;
  }): ProductoBusquedaCompra {
    return {
      idProducto: p.idProducto,
      codigoBarra: p.codigoBarra,
      nombre: p.nombre,
      cantidad: Number(p.cantidad ?? 0),
      existenciaAlmacen: 0,
      precioCompra: Number(p.precioCompra ?? 0),
      controlarStock: !!p.controlarStock,
      esServicio: !!p.esServicio,
      tipoComportamiento: p.tipoComportamiento,
      itbis: !!p.itbis
    };
  }
}
