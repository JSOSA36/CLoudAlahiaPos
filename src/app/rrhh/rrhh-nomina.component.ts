import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ParametrosService } from '../servicios/parametros.service';
import { RrhhService } from '../servicios/rrhh.service';
import { CuentaFinancieraService } from '../servicios/cuenta-financiera.service';
import { CuentaFinanciera } from '../models/CuentaFinanciera.models';
import { descargarRecibosNominaPdf, montoLegal } from './nomina-recibo-pdf';

@Component({
  selector: 'app-rrhh-nomina',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './rrhh-nomina.component.html',
  styleUrls: ['./rrhh-shared.scss', './rrhh-nomina.component.scss']
})
export class RrhhNominaComponent implements OnInit {
  listado: any[] = [];
  actual: any = null;
  crear = { fechaInicio: '', fechaFin: '', frecuencia: 'QUINCENAL' };
  loading = false;
  enviando = false;
  pagando = false;
  puedeAprobar = false;
  puedePagar = false;
  cuentas: CuentaFinanciera[] = [];
  idCuentaPago: number | null = null;

  constructor(
    private rrhh: RrhhService,
    public parametros: ParametrosService,
    private cuentasSvc: CuentaFinancieraService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.puedeAprobar = this.parametros.tieneModulo('RRHH_NOMINA_APROBAR');
    this.puedePagar = this.parametros.tieneModulo('RRHH_NOMINA_PAGAR');
    const hoy = new Date();
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const h = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
    this.crear.fechaInicio = d.toISOString().slice(0, 10);
    this.crear.fechaFin = h.toISOString().slice(0, 10);
    this.cargar();
    this.cargarCuentas();
  }

  private cargarCuentas(): void {
    this.cuentasSvc.getByEmpresa(this.parametros.IdEmpresa).subscribe({
      next: (rows) => {
        this.cuentas = (rows || []).filter((c) => c.activa !== false);
        this.sugerirCuenta();
      }
    });
  }

  private sugerirCuenta(): void {
    const idGuardada = Number(this.actual?.idCuentaFinanciera || 0);
    if (idGuardada && this.cuentas.some((c) => c.idCuentaFinanciera === idGuardada)) {
      this.idCuentaPago = idGuardada;
      return;
    }
    if (this.idCuentaPago && this.cuentas.some((c) => c.idCuentaFinanciera === this.idCuentaPago)) {
      return;
    }
    const principal = this.cuentas.find((c) => c.esPrincipal)
      || this.cuentas.find((c) => (c.tipoCuenta || '').toUpperCase() === 'BANCO')
      || this.cuentas[0];
    this.idCuentaPago = principal?.idCuentaFinanciera ?? null;
  }

  cargar(): void {
    this.rrhh.nominas(this.parametros.IdEmpresa).subscribe({
      next: (r) => (this.listado = r || [])
    });
  }

  abrir(id: number): void {
    this.rrhh.nomina(this.parametros.IdEmpresa, id).subscribe({
      next: (r) => {
        this.actual = r;
        this.sugerirCuenta();
      }
    });
  }

  nuevo(): void {
    this.rrhh.crearNomina({
      idEmpresa: this.parametros.IdEmpresa,
      fechaInicio: this.crear.fechaInicio,
      fechaFin: this.crear.fechaFin,
      frecuencia: this.crear.frecuencia
    }).subscribe({
      next: (r) => {
        this.toast('Proceso creado');
        this.actual = r;
        this.cargar();
      },
      error: (e) => this.toast(e?.error?.message || 'No se pudo crear')
    });
  }

  generar(): void {
    if (!this.actual) return;
    this.loading = true;
    this.rrhh.generarNomina(this.parametros.IdEmpresa, this.actual.idNominaProceso).subscribe({
      next: (r) => {
        this.actual = r;
        this.loading = false;
        this.toast('Pre-nómina generada');
        this.cargar();
      },
      error: (e) => {
        this.loading = false;
        this.toast(e?.error?.message || 'No se pudo generar');
      }
    });
  }

  estado(nuevo: string): void {
    if (!this.actual) return;
    if (nuevo === 'PAGADA') {
      this.marcarPagada();
      return;
    }
    this.rrhh.estadoNomina(this.parametros.IdEmpresa, this.actual.idNominaProceso, nuevo).subscribe({
      next: (r) => {
        this.actual = r;
        this.cargar();
        this.toast(this.resumenEstado(nuevo, r?.envioRecibos));
      },
      error: (e) => this.toast(e?.error?.message || 'Transición no permitida')
    });
  }

  marcarPagada(): void {
    if (!this.actual || this.pagando) return;
    const neto = this.suma('neto');
    if (neto > 0 && !this.idCuentaPago) {
      this.toast('Seleccione la cuenta de banco o caja de donde sale el pago');
      return;
    }
    this.pagando = true;
    this.rrhh.estadoNomina(
      this.parametros.IdEmpresa,
      this.actual.idNominaProceso,
      'PAGADA',
      undefined,
      this.idCuentaPago || undefined
    ).subscribe({
      next: (r) => {
        this.pagando = false;
        this.actual = r;
        this.cargar();
        this.cargarCuentas();
        this.toast(this.resumenEstado('PAGADA', r?.envioRecibos, r?.advertenciaContabilidad));
      },
      error: (e) => {
        this.pagando = false;
        this.toast(e?.error?.message || 'No se pudo marcar pagada');
      }
    });
  }

  cuentaPago(): CuentaFinanciera | undefined {
    const id = Number(this.actual?.idCuentaFinanciera || this.idCuentaPago || 0);
    return this.cuentas.find((c) => c.idCuentaFinanciera === id);
  }

  etiquetaCuenta(c: CuentaFinanciera): string {
    const tipo = (c.tipoCuenta || 'CUENTA').toUpperCase();
    const saldo = Number(c.saldoDisponible ?? 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const banco = c.banco ? ` · ${c.banco}` : '';
    return `${c.nombre}${banco} (${tipo}) · RD$ ${saldo}`;
  }

  fondosInsuficientes(): boolean {
    const cuenta = this.cuentas.find((c) => c.idCuentaFinanciera === this.idCuentaPago);
    if (!cuenta || cuenta.permiteSaldoNegativo) return false;
    return Number(cuenta.saldoDisponible ?? 0) < this.suma('neto');
  }

  afp(e: any): number {
    return montoLegal(e, 'AFP_EMPLEADO');
  }
  sfs(e: any): number {
    return montoLegal(e, 'SFS_EMPLEADO');
  }
  isr(e: any): number {
    return montoLegal(e, 'ISR_EMPLEADO');
  }

  etiquetaEstado(estado?: string): string {
    const map: Record<string, string> = {
      BORRADOR: 'Borrador',
      EN_REVISION: 'En revisión',
      APROBADA: 'Aprobada',
      PAGADA: 'Pagada',
      CERRADA: 'Cerrada'
    };
    return map[estado || ''] || estado || '';
  }

  etiquetaFrecuencia(freq?: string): string {
    const map: Record<string, string> = {
      SEMANAL: 'Semanal',
      QUINCENAL: 'Quincenal',
      MENSUAL: 'Mensual'
    };
    return map[(freq || '').toUpperCase()] || freq || '';
  }

  monto(v: number | null | undefined): string {
    const n = Number(v || 0);
    return n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  suma(campo: string): number {
    return (this.actual?.detalle || []).reduce((s: number, e: any) => s + Number(e?.[campo] || 0), 0);
  }

  sumaLegal(codigo: string): number {
    return (this.actual?.detalle || []).reduce((s: number, e: any) => s + montoLegal(e, codigo), 0);
  }

  totalDescuentos(): number {
    return this.suma('descuentosAsistencia')
      + this.suma('prestamos')
      + this.suma('anticipos')
      + this.suma('otrosDescuentos')
      + this.sumaLegal('AFP_EMPLEADO')
      + this.sumaLegal('SFS_EMPLEADO')
      + this.sumaLegal('ISR_EMPLEADO');
  }

  recibo(e: any): void {
    this.emitirRecibos([e]);
  }

  recibosTodos(): void {
    const list = this.actual?.detalle || [];
    if (!list.length) {
      this.toast('Genere la pre-nómina antes de imprimir recibos');
      return;
    }
    this.emitirRecibos(list);
  }

  enviarRecibos(): void {
    if (!this.actual) return;
    this.enviando = true;
    this.rrhh.enviarRecibosNomina(this.parametros.IdEmpresa, this.actual.idNominaProceso).subscribe({
      next: (r) => {
        this.enviando = false;
        this.actual = { ...this.actual, envioRecibos: r };
        this.toast(r?.mensaje || 'Recibos enviados');
      },
      error: (e) => {
        this.enviando = false;
        this.toast(e?.error?.message || 'No se pudieron enviar los recibos');
      }
    });
  }

  private resumenEstado(nuevo: string, envio?: any, advertenciaContabilidad?: string): string {
    if (nuevo === 'PAGADA') {
      const partes = ['Nómina pagada. El neto salió de tesorería y se registró el gasto.'];
      if (envio?.mensaje) partes.push(envio.mensaje);
      if (advertenciaContabilidad) partes.push(advertenciaContabilidad);
      return partes.join(' ');
    }
    return 'Estado: ' + nuevo;
  }

  private emitirRecibos(empleados: any[]): void {
    try {
      const emp = this.parametros._Empresa;
      descargarRecibosNominaPdf({
        empresa: {
          nombre: emp?.nombreComercial || this.parametros.NombreEmpresa || 'Alahia ERP',
          rnc: emp?.rnc,
          direccion: emp?.direccion,
          telefono: emp?.telefono
        },
        fechaInicio: this.actual.fechaInicio,
        fechaFin: this.actual.fechaFin,
        frecuencia: this.actual.frecuencia,
        estado: this.actual.estado,
        periodKey: this.actual.periodKey,
        empleados
      });
    } catch (err: any) {
      this.toast(err?.message || 'No se pudo generar el PDF');
    }
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 4200 });
    await t.present();
  }
}
