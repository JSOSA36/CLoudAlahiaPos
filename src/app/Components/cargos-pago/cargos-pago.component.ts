import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonContent, ToastController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import {
  CargoPagoGrupo,
  CargoPagoRegla,
  CargoPagoService,
  CargoPagoTipo
} from 'src/app/servicios/cargo-pago.service';

/** Regla en pantalla; `_tempKey` solo existe en borradores locales. */
type CargoPagoReglaUi = CargoPagoRegla & { _tempKey?: string };

@Component({
  selector: 'app-cargos-pago',
  templateUrl: './cargos-pago.component.html',
  styleUrls: ['./cargos-pago.component.scss']
})
export class CargosPagoComponent implements OnInit {
  @ViewChild('content') content?: IonContent;

  cargando = false;
  guardando = false;
  reglas: CargoPagoReglaUi[] = [];

  readonly tipos: Array<{ value: CargoPagoTipo; label: string }> = [
    { value: 'PORCENTAJE', label: 'Porcentaje' },
    { value: 'MONTO_FIJO', label: 'Monto fijo' }
  ];

  readonly grupos: Array<{ value: CargoPagoGrupo; label: string; hint: string }> = [
    { value: 'TARJETA', label: 'Tarjeta', hint: 'Visa, Mastercard, Tarjeta' },
    { value: 'EFECTIVO', label: 'Efectivo', hint: 'Efectivo / cash' },
    { value: 'TRANSFERENCIA', label: 'Transferencia', hint: 'Transferencia / depósito' },
    { value: 'CHEQUE', label: 'Cheque', hint: 'Cheque' },
    { value: 'TODOS', label: 'Todos los métodos', hint: 'Cualquier cobro con método' }
  ];

  constructor(
    private cargos: CargoPagoService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  trackRegla(_: number, regla: CargoPagoReglaUi): string | number {
    return regla._tempKey || regla.idCargoPagoRegla;
  }

  esBorrador(regla: CargoPagoReglaUi): boolean {
    return !regla.idCargoPagoRegla || regla.idCargoPagoRegla <= 0 || !!regla._tempKey;
  }

  cargar(): void {
    const idEmpresa = this.parametros.GetIdEmpresa();
    if (!idEmpresa) {
      void this.toast('No hay empresa en sesión. Vuelve a iniciar sesión.', 'warning');
      return;
    }
    this.cargando = true;
    this.cargos.listar(idEmpresa).subscribe({
      next: (rows) => {
        this.reglas = (rows || []).map(r => ({ ...r }));
        this.cargando = false;
      },
      error: async () => {
        this.cargando = false;
        await this.toast('No se pudieron cargar los cargos.', 'danger');
      }
    });
  }

  async nuevaRegla(): Promise<void> {
    const idEmpresa = this.parametros.GetIdEmpresa();
    if (!idEmpresa) {
      await this.toast('No hay empresa en sesión. Vuelve a iniciar sesión.', 'warning');
      return;
    }

    const borrador: CargoPagoReglaUi = {
      idCargoPagoRegla: 0,
      idEmpresa,
      nombre: 'Nuevo cargo',
      tipo: 'PORCENTAJE',
      valor: 6,
      grupoMetodo: 'TARJETA',
      activo: true,
      orden: this.reglas.length + 1,
      _tempKey: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    };

    this.reglas = [borrador, ...this.reglas];
    await this.toast('Cargo nuevo listo. Completa y pulsa Guardar.', 'primary');
    setTimeout(() => {
      void this.content?.scrollToTop(300);
    }, 50);
  }

  onValorInput(regla: CargoPagoReglaUi, event: Event): void {
    const raw = (event as CustomEvent)?.detail?.value;
    const n = Number(raw);
    regla.valor = Number.isFinite(n) ? n : 0;
  }

  guardar(regla: CargoPagoReglaUi): void {
    if (!regla.nombre?.trim()) {
      void this.toast('Indique el nombre del cargo.', 'warning');
      return;
    }
    const valor = Number(regla.valor);
    if (!Number.isFinite(valor) || valor < 0) {
      void this.toast('El valor del cargo no es válido.', 'warning');
      return;
    }
    if (regla.tipo === 'PORCENTAJE' && valor > 100) {
      void this.toast('El porcentaje no puede superar 100.', 'warning');
      return;
    }

    const idEmpresa = this.parametros.GetIdEmpresa();
    if (!idEmpresa) {
      void this.toast('No hay empresa en sesión. Vuelve a iniciar sesión.', 'warning');
      return;
    }

    const payload: CargoPagoRegla = {
      idCargoPagoRegla: this.esBorrador(regla) ? 0 : Number(regla.idCargoPagoRegla),
      idEmpresa,
      nombre: regla.nombre.trim(),
      tipo: regla.tipo,
      valor,
      grupoMetodo: regla.grupoMetodo,
      activo: !!regla.activo,
      orden: Number(regla.orden) || 1
    };

    this.guardando = true;
    this.cargos.guardar(payload).subscribe({
      next: async (saved) => {
        this.guardando = false;
        await this.toast('Cargo guardado.', 'success');
        if (saved?.idCargoPagoRegla) {
          const key = regla._tempKey;
          this.reglas = this.reglas.map(r => {
            if (key ? r._tempKey === key : r === regla) {
              const { _tempKey, ...rest } = { ...r, ...saved } as CargoPagoReglaUi;
              return rest;
            }
            return r;
          });
        } else {
          this.cargar();
        }
      },
      error: async (err) => {
        this.guardando = false;
        const msg = typeof err?.error === 'string'
          ? err.error
          : (err?.error?.message || 'No se pudo guardar el cargo.');
        await this.toast(msg, 'danger');
      }
    });
  }

  async eliminar(regla: CargoPagoReglaUi): Promise<void> {
    if (this.esBorrador(regla)) {
      this.reglas = this.reglas.filter(r => r !== regla);
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar cargo',
      message: `¿Eliminar “${regla.nombre}”? Las facturas ya cobradas no cambian.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.cargos.eliminar(this.parametros.GetIdEmpresa(), regla.idCargoPagoRegla)
              .subscribe({
                next: () => this.cargar(),
                error: () => void this.toast('No se pudo eliminar.', 'danger')
              });
          }
        }
      ]
    });
    await alert.present();
  }

  etiquetaValor(regla: CargoPagoRegla): string {
    if (regla.tipo === 'MONTO_FIJO') {
      return `RD$ ${Number(regla.valor || 0).toFixed(2)}`;
    }
    return `${Number(regla.valor || 0)}%`;
  }

  etiquetaGrupo(grupo: string): string {
    return this.grupos.find(g => g.value === grupo)?.label || grupo;
  }

  iconoGrupo(grupo: string): string {
    switch ((grupo || '').toUpperCase()) {
      case 'TARJETA': return 'card-outline';
      case 'EFECTIVO': return 'cash-outline';
      case 'TRANSFERENCIA': return 'swap-horizontal-outline';
      case 'CHEQUE': return 'document-text-outline';
      default: return 'wallet-outline';
    }
  }

  ejemploMonto(regla: CargoPagoRegla): string {
    const base = 1000;
    const valor = Number(regla.valor || 0);
    const monto = regla.tipo === 'MONTO_FIJO'
      ? valor
      : Math.round(base * valor) / 100;
    return `RD$ ${monto.toFixed(2)}`;
  }

  ejemploTotal(regla: CargoPagoRegla): string {
    const base = 1000;
    const valor = Number(regla.valor || 0);
    const monto = regla.tipo === 'MONTO_FIJO'
      ? valor
      : Math.round(base * valor) / 100;
    return `RD$ ${(base + monto).toFixed(2)}`;
  }

  private async toast(message: string, color: string): Promise<void> {
    (await this.toastCtrl.create({ message, duration: 2200, color })).present();
  }
}
