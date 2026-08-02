import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { GastosService } from 'src/app/servicios/gastos.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { MetodoPagoCuentaService } from 'src/app/servicios/metodo-pago-cuenta.service';
import { CategoriaGastoService } from 'src/app/servicios/categoria-gasto.service';
import {
  CategoriaGasto,
  Gastos,
  TIPOS_COMPROBANTE_GASTO,
  TIPO_COMPROBANTE_GASTOS_MENORES,
} from 'src/app/models/Gastos.models';
import { MetodoPagoCuenta } from 'src/app/models/MetodoPagoCuenta.models';

@Component({
  selector: 'app-gasto-form',
  templateUrl: './gastoadd.component.html',
  styleUrls: ['./gastoadd.component.scss'],
})
export class GastoFormPage implements OnInit {
  @Input() gasto: Gastos = new Gastos();
  @Input() isEdit = false;

  metodosPago: MetodoPagoCuenta[] = [];
  categorias: CategoriaGasto[] = [];
  tiposComprobante = [...TIPOS_COMPROBANTE_GASTO];

  constructor(
    private gastosSrv: GastosService,
    private toastCtrl: ToastController,
    public modalCtrl: ModalController,
    private _Para: ParametrosService,
    private metodoPagoCuentaService: MetodoPagoCuentaService,
    private categoriaGastoSrv: CategoriaGastoService
  ) {}

  get esGastosMenores(): boolean {
    return (this.gasto.tipoComprobante || '') === TIPO_COMPROBANTE_GASTOS_MENORES;
  }

  ngOnInit(): void {
    this.gasto.idEmpresa = this._Para.GetIdEmpresa();
    this.gasto.idUsuario = this._Para.IdUsuario;
    this.gasto.formaPago =
      this.gasto.formaPago || this.gasto.orien || 'EFECTIVO';
    this.gasto.tipoComprobante =
      this.gasto.tipoComprobante || 'Sin comprobante';

    if (this.gasto.fechaComprobante) {
      this.gasto.fechaComprobante = String(this.gasto.fechaComprobante).split('T')[0];
    }

    this.CargarMetodosPago();
    this.cargarCategorias();
  }

  onCategoriaChange(): void {
    const cat = this.categorias.find(
      (c) => c.idCategoriaGasto === this.gasto.idCategoriaGasto
    );
    this.gasto.tipoGasto = cat?.nombre || '';
  }

  private armarGastoParaGuardar(): Gastos {
    const formaPago = (
      this.gasto.formaPago ||
      this.gasto.orien ||
      'EFECTIVO'
    ).trim();

    return {
      idGasto: this.gasto.idGasto || 0,
      idEmpresa: this._Para.GetIdEmpresa(),
      idUsuario: this._Para.IdUsuario,
      idEmpleado: this.gasto.idEmpleado ?? null,
      tipoGasto: (this.gasto.tipoGasto || '').trim(),
      idCategoriaGasto: this.gasto.idCategoriaGasto ?? null,
      tipoComprobante: this.gasto.tipoComprobante || 'Sin comprobante',
      // El e-NCF E43 lo asigna el backend desde la secuencia electrónica
      numeroComprobante: this.gasto.numeroComprobante || '',
      fechaComprobante: this.gasto.fechaComprobante,
      rncEmisorComprobante: '',
      nombreEmisorComprobante: '',
      monto: Number(this.gasto.monto) || 0,
      orien: formaPago,
      detalle: (this.gasto.detalle || '').trim(),
      formaPago,
      idCuentaFinanciera: this.gasto.idCuentaFinanciera ?? null,
      referencia: (this.gasto.referencia || '').trim(),
      estaAnulado: this.gasto.estaAnulado ?? false,
      fechaRegistro: this.gasto.fechaRegistro ?? new Date(),
    };
  }

  private async toast(message: string, color: string = 'warning'): Promise<void> {
    (await this.toastCtrl.create({ message, duration: 2200, color })).present();
  }

  private async validarGasto(): Promise<boolean> {
    if (!this.gasto.idCategoriaGasto && !this.gasto.tipoGasto?.trim()) {
      await this.toast('Seleccione una categoría de gasto.');
      return false;
    }

    if (!this.gasto.monto || Number(this.gasto.monto) <= 0) {
      await this.toast('Ingrese un monto válido mayor a cero.');
      return false;
    }

    if (!(this.gasto.formaPago || this.gasto.orien)?.trim()) {
      await this.toast('Seleccione un método de pago.');
      return false;
    }

    return true;
  }

  cargarCategorias(): void {
    this.categoriaGastoSrv
      .getByEmpresa(this._Para.GetIdEmpresa(), true)
      .subscribe({
        next: (resp) => {
          this.categorias = resp || [];
          if (this.isEdit && this.gasto.tipoGasto && !this.gasto.idCategoriaGasto) {
            const match = this.categorias.find(
              (c) =>
                c.nombre.toLowerCase() === this.gasto.tipoGasto.toLowerCase()
            );
            if (match) {
              this.gasto.idCategoriaGasto = match.idCategoriaGasto;
            }
          }
          if (!this.isEdit && !this.gasto.idCategoriaGasto && this.categorias.length) {
            const otros = this.categorias.find((c) => c.nombre === 'Otros');
            const pick = otros || this.categorias[0];
            this.gasto.idCategoriaGasto = pick.idCategoriaGasto;
            this.gasto.tipoGasto = pick.nombre;
          }
        },
        error: (err) => console.error(err),
      });
  }

  CargarMetodosPago(): void {
    this.metodoPagoCuentaService
      .getByEmpresa(this._Para.GetIdEmpresa())
      .subscribe({
        next: (resp: MetodoPagoCuenta[]) => {
          this.metodosPago = (resp || []).filter((x) => x.activo);
        },
        error: (err) => console.error(err),
      });
  }

  async guardar(): Promise<void> {
    this.onCategoriaChange();
    if (!(await this.validarGasto())) return;

    const gastoParaGuardar = this.armarGastoParaGuardar();
    const req$ = this.isEdit
      ? this.gastosSrv.actualizarGasto(gastoParaGuardar)
      : this.gastosSrv.crearGasto(gastoParaGuardar);

    req$.subscribe(async (resp: any) => {
      if (!resp.success) {
        await this.toast(resp.message || 'No se pudo guardar');
        return;
      }
      await this.toast(
        this.isEdit ? 'Gasto actualizado' : 'Gasto registrado',
        'success'
      );
      this.modalCtrl.dismiss({ recargar: true });
    });
  }

  cerrar(): void {
    this.modalCtrl.dismiss({ recargar: false });
  }
}
