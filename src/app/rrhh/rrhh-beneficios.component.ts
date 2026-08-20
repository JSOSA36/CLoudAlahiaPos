import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service';
import { RrhhService } from '../servicios/rrhh.service';

@Component({
  selector: 'app-rrhh-beneficios',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './rrhh-beneficios.component.html',
  styleUrls: ['./rrhh-shared.scss']
})
export class RrhhBeneficiosComponent implements OnInit {
  listado: any[] = [];
  form: any = this.empty();
  guardando = false;
  readonly diasMes = Array.from({ length: 28 }, (_, i) => i + 1);

  constructor(
    private rrhh: RrhhService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  empty() {
    return {
      idBeneficio: 0,
      idEmpresa: this.parametros.IdEmpresa,
      codigo: '',
      nombre: '',
      descripcion: '',
      tipoCalculo: 'MONTO_FIJO',
      monto: 0,
      periodicidad: 'MENSUAL',
      afectaNomina: true,
      formaDesembolso: 'NOMINA',
      diaPagoMes: 5,
      metodoPago: 'TRANSFERENCIA',
      descontarConsumoNomina: false,
      enEspecie: false,
      activo: true
    };
  }

  cargar(): void {
    this.rrhh.beneficios(this.parametros.IdEmpresa).subscribe({
      next: (r) => (this.listado = r || [])
    });
  }

  editar(row: any): void {
    const forma = row.formaDesembolso
      || (row.afectaNomina === false ? 'NINGUNO' : 'NOMINA');
    this.form = {
      ...this.empty(),
      ...row,
      formaDesembolso: forma,
      diaPagoMes: row.diaPagoMes || 5,
      metodoPago: row.metodoPago || 'TRANSFERENCIA'
    };
  }

  nuevo(): void {
    this.form = this.empty();
  }

  etiquetaCalculo(b: any): string {
    if (b.tipoCalculo === 'PORCENTAJE_SALARIO') return '% salario';
    if (b.tipoCalculo === 'DESCUENTO_CONSUMO') return '% consumo';
    return 'Monto fijo';
  }

  etiquetaPago(b: any): string {
    if (b.tipoCalculo === 'DESCUENTO_CONSUMO') {
      return b.descontarConsumoNomina ? 'Descuento + quincena' : 'Solo % en caja';
    }
    const forma = b.formaDesembolso
      || (b.afectaNomina === false ? 'NINGUNO' : 'NOMINA');
    if (forma === 'PAGO_APARTE') {
      const metodo = (b.metodoPago || 'TRANSFERENCIA') === 'EFECTIVO' ? 'efectivo' : 'transferencia';
      return `Día ${b.diaPagoMes || '—'} · ${metodo}`;
    }
    if (forma === 'NINGUNO') return 'No se paga';
    return 'Con la nómina';
  }

  esDescuentoConsumo(): boolean {
    return this.form.tipoCalculo === 'DESCUENTO_CONSUMO';
  }

  etiquetaMonto(): string {
    if (this.form.tipoCalculo === 'PORCENTAJE_SALARIO') return 'Porcentaje del salario';
    if (this.esDescuentoConsumo()) return 'Porcentaje de descuento';
    return 'Monto';
  }

  onTipoCalculo(): void {
    if (!this.esDescuentoConsumo()) return;
    this.form.enEspecie = true;
    this.form.formaDesembolso = 'NINGUNO';
    this.form.afectaNomina = false;
    if (this.form.descontarConsumoNomina == null) this.form.descontarConsumoNomina = true;
  }

  guardar(): void {
    if (!this.form.nombre?.trim()) {
      this.toast('El nombre es obligatorio');
      return;
    }
    if (this.form.formaDesembolso === 'PAGO_APARTE') {
      const dia = Number(this.form.diaPagoMes);
      if (!dia || dia < 1 || dia > 28) {
        this.toast('Indique el día del mes (1 a 28) para el pago aparte.');
        return;
      }
    }
    this.guardando = true;
    this.form.idEmpresa = this.parametros.IdEmpresa;
    if (this.esDescuentoConsumo()) {
      this.form.formaDesembolso = 'NINGUNO';
      this.form.enEspecie = true;
      this.form.afectaNomina = false;
    } else {
      this.form.afectaNomina = this.form.formaDesembolso === 'NOMINA';
      this.form.descontarConsumoNomina = false;
    }
    this.rrhh.saveBeneficio(this.form).subscribe({
      next: (saved) => {
        this.guardando = false;
        this.form = { ...this.empty(), ...saved };
        this.cargar();
        this.toast('Beneficio guardado. Si está en un cargo, los empleados lo heredan.');
      },
      error: (e) => {
        this.guardando = false;
        this.toast(e?.error?.message || 'No se pudo guardar');
      }
    });
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2400, color: 'dark' });
    await t.present();
  }
}
