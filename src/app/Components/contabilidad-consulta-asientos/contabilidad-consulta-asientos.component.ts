import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AsientoContableService } from 'src/app/servicios/asiento-contable.service';
import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { AsientoContable } from 'src/app/models/AsientoContable.models';
import { CuentaContable } from 'src/app/models/CuentaContable.models';
import { ModalAsientoContableComponent } from '../modal-asiento-contable/modal-asiento-contable.component';

@Component({
  selector: 'app-contabilidad-consulta-asientos',
  templateUrl: './contabilidad-consulta-asientos.component.html',
  styleUrls: ['./contabilidad-consulta-asientos.component.scss'],
})
export class ContabilidadConsultaAsientosComponent implements OnInit {
  cargando = false;
  asientos: AsientoContable[] = [];
  cuentas: CuentaContable[] = [];
  fechaInicio = '';
  fechaFin = '';
  idCuentaSeleccionada: number | null = null;
  numero = '';
  concepto = '';

  constructor(
    private asientoService: AsientoContableService,
    private cuentaService: CuentaContableService,
    private parametros: ParametrosService,
    private modalCtrl: ModalController
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
        this.cuentas = cuentas.filter(c => c.activa);
      }
    });
  }

  cargar(): void {
    this.cargando = true;
    this.asientoService.consultar(this.parametros.GetIdEmpresa(), {
      desde: this.fechaInicio,
      hasta: this.fechaFin,
      idCuentaContable: this.idCuentaSeleccionada ?? undefined,
      numero: this.numero.trim() || undefined,
      concepto: this.concepto.trim() || undefined
    }).subscribe({
      next: (resp) => {
        this.asientos = resp;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  async verAsiento(asiento: AsientoContable): Promise<void> {
    this.asientoService.getById(asiento.idAsientoContable!, this.parametros.GetIdEmpresa()).subscribe({
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

  estadoColor(estado: string): string {
    switch (estado) {
      case 'Confirmado': return 'success';
      case 'Borrador': return 'warning';
      case 'Anulado': return 'medium';
      default: return 'primary';
    }
  }
}
