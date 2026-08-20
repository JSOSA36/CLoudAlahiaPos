import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service';
import { RrhhService } from '../servicios/rrhh.service';

@Component({
  selector: 'app-rrhh-cargos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './rrhh-cargos.component.html',
  styleUrls: ['./rrhh-shared.scss']
})
export class RrhhCargosComponent implements OnInit {
  readonly diasSemana = [
    { n: 1, nombre: 'Lunes' },
    { n: 2, nombre: 'Martes' },
    { n: 3, nombre: 'Miércoles' },
    { n: 4, nombre: 'Jueves' },
    { n: 5, nombre: 'Viernes' },
    { n: 6, nombre: 'Sábado' },
    { n: 7, nombre: 'Domingo' }
  ];
  listado: any[] = [];
  beneficios: any[] = [];
  form: any = this.empty();
  guardando = false;

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
      idCargo: 0,
      idEmpresa: this.parametros.IdEmpresa,
      codigo: '',
      nombre: '',
      descripcion: '',
      idJornada: null as number | null,
      nombreJornada: '',
      salarioBase: 0,
      moneda: 'DOP',
      frecuenciaPago: 'QUINCENAL',
      tipoEmpleado: 'FIJO',
      activo: true,
      minutosTardanzaGracia: 10,
      dias: this.diasDefault(),
      idBeneficios: [] as number[]
    };
  }

  diasDefault() {
    return this.diasSemana.map((d) => {
      const laborable = d.n <= 5;
      return {
        diaSemana: d.n,
        esLaborable: laborable,
        horaEntrada: laborable ? '08:00' : null,
        horaSalida: laborable ? '17:00' : null,
        recesoInicio: laborable ? '12:00' : null,
        recesoFin: laborable ? '13:00' : null,
        minutosEsperados: laborable ? 480 : 0
      };
    });
  }

  cargar(): void {
    const id = this.parametros.IdEmpresa;
    this.rrhh.cargos(id).subscribe({ next: (r) => (this.listado = r || []) });
    this.rrhh.beneficios(id).subscribe({ next: (r) => (this.beneficios = (r || []).filter((b: any) => b.activo)) });
  }

  editar(row: any): void {
    this.form = {
      ...this.empty(),
      ...row,
      idJornada: row.idJornada || null,
      minutosTardanzaGracia: row.minutosTardanzaGracia || 10,
      dias: this.mezclarDias(row.dias),
      idBeneficios: [...(row.idBeneficios || [])]
    };
  }

  mezclarDias(dias: any[] | undefined) {
    const map = new Map((dias || []).map((d) => [Number(d.diaSemana), d]));
    return this.diasDefault().map((base) => {
      const d = map.get(base.diaSemana);
      if (!d) return base;
      return {
        ...base,
        ...d,
        horaEntrada: this.hora(d.horaEntrada) || base.horaEntrada,
        horaSalida: this.hora(d.horaSalida) || base.horaSalida,
        recesoInicio: this.hora(d.recesoInicio),
        recesoFin: this.hora(d.recesoFin)
      };
    });
  }

  hora(v: string | null | undefined): string | null {
    if (!v) return null;
    return v.length >= 5 ? v.slice(0, 5) : v;
  }

  diaDe(n: number) {
    return this.form.dias.find((d: any) => d.diaSemana === n);
  }

  onLaborable(dia: any): void {
    if (dia.esLaborable) {
      dia.horaEntrada = dia.horaEntrada || '08:00';
      dia.horaSalida = dia.horaSalida || '17:00';
      dia.recesoInicio = dia.recesoInicio || '12:00';
      dia.recesoFin = dia.recesoFin || '13:00';
    } else {
      dia.horaEntrada = null;
      dia.horaSalida = null;
      dia.recesoInicio = null;
      dia.recesoFin = null;
      dia.minutosEsperados = 0;
    }
  }

  nuevo(): void {
    this.form = this.empty();
  }

  tieneBeneficio(id: number): boolean {
    return (this.form.idBeneficios || []).includes(id);
  }

  toggleBeneficio(id: number, ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked;
    const set = new Set<number>(this.form.idBeneficios || []);
    if (on) set.add(id);
    else set.delete(id);
    this.form.idBeneficios = [...set];
  }

  etiquetaPagoCargo(b: any): string {
    if (b.formaDesembolso === 'PAGO_APARTE') {
      return ` · día ${b.diaPagoMes || '—'} (${(b.metodoPago || 'TRANSFERENCIA') === 'EFECTIVO' ? 'efectivo' : 'transferencia'})`;
    }
    if (b.formaDesembolso === 'NINGUNO' || b.afectaNomina === false) {
      return ' · no sale en nómina';
    }
    return ' · con nómina';
  }

  guardar(): void {
    if (!this.form.nombre?.trim()) {
      this.toast('El nombre del cargo es obligatorio');
      return;
    }
    this.guardando = true;
    this.form.idEmpresa = this.parametros.IdEmpresa;
    this.form.nombreJornada = this.form.nombreJornada || `Horario · ${this.form.nombre.trim()}`;
    this.rrhh.saveCargo(this.form).subscribe({
      next: (saved) => {
        this.guardando = false;
        this.editar(saved);
        this.cargar();
        this.toast('Cargo guardado con su horario. Los empleados de este cargo lo heredan.');
      },
      error: (e) => {
        this.guardando = false;
        this.toast(e?.error?.message || 'No se pudo guardar');
      }
    });
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2600, color: 'dark' });
    await t.present();
  }
}
