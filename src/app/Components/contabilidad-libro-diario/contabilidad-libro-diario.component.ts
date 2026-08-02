import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { ContabilidadLibrosService } from 'src/app/servicios/contabilidad-libros.service';
import { AsientoContableService } from 'src/app/servicios/asiento-contable.service';
import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import {
  LibroDiarioAsientoGrupo,
  LibroDiarioLinea
} from 'src/app/models/AsientoContable.models';
import { CuentaContable } from 'src/app/models/CuentaContable.models';
import { ModalAsientoContableComponent } from '../modal-asiento-contable/modal-asiento-contable.component';

@Component({
  selector: 'app-contabilidad-libro-diario',
  templateUrl: './contabilidad-libro-diario.component.html',
  styleUrls: ['./contabilidad-libro-diario.component.scss'],
})
export class ContabilidadLibroDiarioComponent implements OnInit {
  cargando = false;
  lineas: LibroDiarioLinea[] = [];
  asientos: LibroDiarioAsientoGrupo[] = [];
  cuentas: CuentaContable[] = [];
  fechaInicio = '';
  fechaFin = '';

  constructor(
    private librosService: ContabilidadLibrosService,
    private asientoService: AsientoContableService,
    private cuentaService: CuentaContableService,
    private parametros: ParametrosService,
    private router: Router,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = inicioMes.toISOString();
    this.fechaFin = hoy.toISOString();
    this.cargarCuentas();
    this.cargar();
  }

  cargarCuentas(): void {
    this.cuentaService.getByEmpresa(this.parametros.GetIdEmpresa()).subscribe({
      next: (cuentas) => {
        this.cuentas = (cuentas || []).filter(c => c.activa);
      }
    });
  }

  cargar(): void {
    this.cargando = true;
    this.librosService.getLibroDiario(
      this.parametros.GetIdEmpresa(),
      this.fechaInicio,
      this.fechaFin
    ).subscribe({
      next: (resp) => {
        this.lineas = resp || [];
        this.asientos = this.agruparPorAsiento(this.lineas);
        this.cargando = false;
      },
      error: () => {
        this.lineas = [];
        this.asientos = [];
        this.cargando = false;
      }
    });
  }

  get totalDebito(): number {
    return this.asientos.reduce((s, a) => s + a.totalDebito, 0);
  }

  get totalCredito(): number {
    return this.asientos.reduce((s, a) => s + a.totalCredito, 0);
  }

  trackByAsiento(_: number, a: LibroDiarioAsientoGrupo): number {
    return a.idAsientoContable;
  }

  async verDetalleAsiento(grupo: LibroDiarioAsientoGrupo): Promise<void> {
    this.asientoService.getById(grupo.idAsientoContable, this.parametros.GetIdEmpresa()).subscribe({
      next: async (detalle) => {
        const modal = await this.modalCtrl.create({
          component: ModalAsientoContableComponent,
          componentProps: {
            asiento: detalle,
            cuentas: this.cuentas,
            soloLectura: true
          }
        });
        await modal.present();
      }
    });
  }

  async abrirDocumentoOrigen(grupo: LibroDiarioAsientoGrupo, event?: Event): Promise<void> {
    event?.stopPropagation();

    const ruta = this.resolverRutaOrigen(grupo);
    if (!ruta) {
      const toast = await this.toastCtrl.create({
        message: 'Este asiento no tiene documento origen navegable (manual o sin referencia).',
        duration: 2800,
        color: 'medium',
        position: 'top'
      });
      await toast.present();
      return;
    }

    await this.router.navigate(ruta.commands, { queryParams: ruta.queryParams });
  }

  private agruparPorAsiento(lineas: LibroDiarioLinea[]): LibroDiarioAsientoGrupo[] {
    const map = new Map<number, LibroDiarioAsientoGrupo>();
    const orden: number[] = [];

    for (const l of lineas) {
      let g = map.get(l.idAsientoContable);
      if (!g) {
        const origenLabel = this.labelOrigen(l.origenModulo, l.tipoOperacion);
        g = {
          idAsientoContable: l.idAsientoContable,
          numero: l.numero,
          fecha: l.fecha,
          concepto: l.concepto || 'Sin concepto',
          estado: l.estado,
          origenModulo: l.origenModulo,
          origenLabel,
          origenReferenciaId: l.origenReferenciaId,
          tipoOperacion: l.tipoOperacion,
          esAutomatico: l.esAutomatico,
          lineas: [],
          totalDebito: 0,
          totalCredito: 0,
          cuadrado: true,
          puedeAbrirOrigen: this.puedeAbrirOrigen(l.origenModulo, l.tipoOperacion, l.origenReferenciaId)
        };
        map.set(l.idAsientoContable, g);
        orden.push(l.idAsientoContable);
      }

      g.lineas.push(l);
      g.totalDebito += l.debito || 0;
      g.totalCredito += l.credito || 0;
    }

    return orden.map(id => {
      const g = map.get(id)!;
      g.cuadrado = Math.abs(g.totalDebito - g.totalCredito) < 0.01;
      return g;
    });
  }

  private labelOrigen(origenModulo?: string, tipoOperacion?: string): string {
    const op = (tipoOperacion || '').toUpperCase();
    const mod = (origenModulo || '').trim();

    if (op === 'COBRO') return 'CxC';
    if (op === 'PAGO') return 'CxP';
    if (op === 'COGS') return 'Venta';
    if (op === 'REVERSO') return 'Ajuste';

    switch (mod) {
      case 'Ventas': return 'Venta';
      case 'Compras': return 'Compra';
      case 'Gastos': return 'Gasto';
      case 'Ingresos': return 'Ingreso';
      case 'Banco': return 'Banco';
      case 'Inventario': return 'Ajuste';
      case 'NotasCredito': return 'Nota crédito';
      case 'Manual': return 'Manual';
      default: return mod || 'Manual';
    }
  }

  private puedeAbrirOrigen(
    origenModulo?: string,
    tipoOperacion?: string,
    origenReferenciaId?: number | null
  ): boolean {
    const mod = (origenModulo || '').trim();
    if (!mod || mod === 'Manual') return false;
    if (mod === 'Compras' && origenReferenciaId && origenReferenciaId > 0) return true;
    if (['Ventas', 'Gastos', 'Ingresos', 'Banco', 'Inventario'].includes(mod)) return true;
    const op = (tipoOperacion || '').toUpperCase();
    return op === 'COBRO' || op === 'PAGO';
  }

  private resolverRutaOrigen(grupo: LibroDiarioAsientoGrupo): {
    commands: any[];
    queryParams?: Record<string, any>;
  } | null {
    const mod = (grupo.origenModulo || '').trim();
    const op = (grupo.tipoOperacion || '').toUpperCase();
    const id = grupo.origenReferenciaId;

    if (op === 'COBRO') {
      return { commands: ['/cuentaxcobrar'] };
    }
    if (op === 'PAGO') {
      return { commands: ['/compras/cxp'] };
    }

    switch (mod) {
      case 'Ventas':
        return { commands: ['/historicofact'] };
      case 'Compras':
        if (id && id > 0) {
          return { commands: ['/compras', id] };
        }
        return { commands: ['/compras/facturas'] };
      case 'Gastos':
        return {
          commands: ['/listadogastos'],
          queryParams: id ? { idGasto: id } : undefined
        };
      case 'Ingresos':
        return { commands: ['/Listadoingresos'] };
      case 'Banco':
        return { commands: ['/transferenciasfinancieras'] };
      case 'Inventario':
        return { commands: ['/movimientosinventario'] };
      default:
        return null;
    }
  }
}
