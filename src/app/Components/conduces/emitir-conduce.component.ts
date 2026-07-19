import { Component, Input, OnInit } from '@angular/core';
import {
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { Almacen } from 'src/app/models/almacenes.model';
import {
  CrearConduceRequest,
  FacturaParaConduceDto,
  LineaPendienteEntregaDto,
} from 'src/app/models/conduces.models';
import { AlmacenesService } from 'src/app/servicios/almacenes.service';
import { ConducesService } from 'src/app/servicios/conduces.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-emitir-conduce',
  templateUrl: './emitir-conduce.component.html',
  styleUrls: ['./emitir-conduce.component.scss'],
})
export class EmitirConduceComponent implements OnInit {
  @Input() idFacturaHeader?: number;

  paso: 'factura' | 'lineas' = 'factura';
  cargando = false;
  guardando = false;

  qFactura = '';
  facturas: FacturaParaConduceDto[] = [];
  facturaSeleccionada: FacturaParaConduceDto | null = null;

  lineas: LineaPendienteEntregaDto[] = [];
  quienEntrega = '';
  quienRecibe = '';
  observacion = '';
  idAlmacen: number | null = null;
  almacenes: Almacen[] = [];

  constructor(
    private conducesSrv: ConducesService,
    private almacenesSrv: AlmacenesService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.quienEntrega =
      localStorage.getItem('NombreUsuario') ||
      this.parametros._Empresa?.nombreComercial ||
      '';
    this.cargarAlmacenes();
    if (this.idFacturaHeader && this.idFacturaHeader > 0) {
      this.abrirFactura({
        idFacturaHeader: this.idFacturaHeader,
        numeroDocumento: `#${this.idFacturaHeader}`,
        fecha: new Date().toISOString(),
        total: 0,
        lineasPendientes: 0,
        cantidadPendienteTotal: 0,
      });
    } else {
      this.buscarFacturas();
    }
  }

  get idEmpresa(): number {
    return this.parametros.GetIdEmpresa();
  }

  get totalAEntregar(): number {
    return this.lineas
      .filter((l) => l.seleccionado)
      .reduce((s, l) => s + Number(l.entregarAhora || 0), 0);
  }

  cargarAlmacenes(): void {
    this.almacenesSrv.getAlmacenes(this.idEmpresa).subscribe({
      next: (data) => {
        this.almacenes = (data || []).filter((a) => a.activo !== false);
        const principal = this.almacenes.find((a) => a.esPrincipal);
        if (principal) this.idAlmacen = principal.idAlmacen;
        else if (this.almacenes.length === 1) {
          this.idAlmacen = this.almacenes[0].idAlmacen;
        }
      },
      error: () => {
        this.almacenes = [];
      },
    });
  }

  buscarFacturas(): void {
    this.cargando = true;
    this.conducesSrv
      .facturasDisponibles(this.idEmpresa, { q: this.qFactura })
      .subscribe({
        next: (data) => {
          this.facturas = data || [];
          this.cargando = false;
        },
        error: async (err) => {
          this.cargando = false;
          await this.toast(err?.error?.message || 'Error al buscar facturas', 'danger');
        },
      });
  }

  async abrirFactura(f: FacturaParaConduceDto): Promise<void> {
    this.facturaSeleccionada = f;
    this.cargando = true;
    this.conducesSrv.lineasPendientes(f.idFacturaHeader, this.idEmpresa).subscribe({
      next: (data) => {
        this.lineas = (data || [])
          .filter((l) => l.cantidadPendiente > 0)
          .map((l) => ({
            ...l,
            seleccionado: true,
            entregarAhora: l.cantidadPendiente,
          }));
        this.paso = 'lineas';
        this.cargando = false;
      },
      error: async (err) => {
        this.cargando = false;
        await this.toast(err?.error?.message || 'No se pudieron cargar las líneas', 'danger');
      },
    });
  }

  volverFacturas(): void {
    this.paso = 'factura';
    this.facturaSeleccionada = null;
    this.lineas = [];
  }

  onCantidadChange(l: LineaPendienteEntregaDto): void {
    if (l.seleccionado && !(Number(l.entregarAhora) > 0)) {
      l.entregarAhora = l.cantidadPendiente;
    }
    const max = Number(l.cantidadPendiente || 0);
    let v = Number(l.entregarAhora || 0);
    if (isNaN(v) || v < 0) v = 0;
    if (v > max) v = max;
    l.entregarAhora = v;
    if (!l.seleccionado) {
      return;
    }
    if (v <= 0) {
      l.seleccionado = false;
    }
  }

  entregarTodo(): void {
    this.lineas.forEach((l) => {
      l.seleccionado = true;
      l.entregarAhora = l.cantidadPendiente;
    });
  }

  async guardar(): Promise<void> {
    if (!this.facturaSeleccionada) return;

    const detalles = this.lineas
      .filter((l) => l.seleccionado && Number(l.entregarAhora) > 0)
      .map((l) => ({
        idFacturaDetalle: l.idFacturaDetalle,
        idProducto: l.idProducto,
        cantidadEntregada: Number(l.entregarAhora),
      }));

    if (!detalles.length) {
      await this.toast('Seleccione al menos un ítem a entregar', 'warning');
      return;
    }

    const request: CrearConduceRequest = {
      idEmpresa: this.idEmpresa,
      idFacturaHeader: this.facturaSeleccionada.idFacturaHeader,
      quienEntrega: this.quienEntrega?.trim() || undefined,
      quienRecibe: this.quienRecibe?.trim() || undefined,
      observacion: this.observacion?.trim() || undefined,
      idAlmacen: this.idAlmacen || undefined,
      idUsuario: this.parametros.IdUsuario || undefined,
      detalles,
    };

    const loading = await this.loadingCtrl.create({ message: 'Emitiendo conduce...' });
    await loading.present();
    this.guardando = true;

    this.conducesSrv.crear(request).subscribe({
      next: async (conduce) => {
        await loading.dismiss();
        this.guardando = false;
        await this.toast(`Conduce ${conduce.numero} emitido`, 'success');
        await this.modalCtrl.dismiss({ conduce, refresh: true });
      },
      error: async (err) => {
        await loading.dismiss();
        this.guardando = false;
        await this.toast(err?.error?.message || 'No se pudo emitir el conduce', 'danger');
      },
    });
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2800, color });
    await t.present();
  }
}
