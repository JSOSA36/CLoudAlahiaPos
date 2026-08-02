import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { CuentaFinancieraService } from 'src/app/servicios/cuenta-financiera.service';
import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-modal-cuenta-financiera',
  templateUrl: './modal-cuenta-financiera.component.html',
  styleUrls: ['./modal-cuenta-financiera.component.scss'],
})
export class ModalCuentaFinancieraComponent implements OnInit {
  @Input() cuenta: any = null;
  @Output() onGuardar = new EventEmitter<any>();

  guardando = false;
  isEdit = false;
  cuentasContables: any[] = [];

  model: any = {
    idCuentaFinanciera: 0,
    idEmpresa: 0,
    nombre: '',
    tipoCuenta: 'CAJA',
    banco: '',
    numeroCuenta: '',
    balanceInicial: 0,
    fechaSaldoInicial: null,
    color: '#2563eb',
    icono: 'wallet-outline',
    activa: true,
    moneda: 'DOP',
    codigo: '',
    idCuentaContable: null,
    esPrincipal: false,
    permiteSaldoNegativo: false,
    permiteMovimientosManuales: true,
    descripcion: ''
  };

  tiposCuenta = [
    { nombre: 'CAJA', icono: 'cash-outline' },
    { nombre: 'BANCO', icono: 'business-outline' },
    { nombre: 'TARJETA', icono: 'card-outline' }
  ];

  monedas = ['DOP', 'USD', 'EUR'];

  iconos = [
    'wallet-outline',
    'cash-outline',
    'business-outline',
    'card-outline',
    'cash',
    'card',
    'storefront-outline'
  ];

  constructor(
    private cuentaService: CuentaFinancieraService,
    private cuentaContableService: CuentaContableService,
    private parametros: ParametrosService,
    private alertCtrl: AlertController,
    public modalCtrl: ModalController
  ) {}

  ngOnInit(): void {
    if (this.cuenta) {
      this.isEdit = true;
      this.model = { ...this.cuenta };
      if (this.model.fechaSaldoInicial) {
        this.model.fechaSaldoInicial = String(this.model.fechaSaldoInicial).substring(0, 10);
      }
    }

    this.model.idEmpresa = this.parametros.GetIdEmpresa();
    if (!this.model.moneda) this.model.moneda = 'DOP';
    if (this.model.permiteMovimientosManuales === undefined) {
      this.model.permiteMovimientosManuales = true;
    }

    this.cuentaContableService.getByEmpresa(this.model.idEmpresa).subscribe({
      next: (resp) => {
        this.cuentasContables = (resp || []).filter((c: any) => c.activa !== false);
      },
      error: () => {
        this.cuentasContables = [];
      }
    });
  }

  numeroEnmascarado(): string {
    const n = (this.model.numeroCuenta || '').replace(/\s/g, '');
    if (n.length <= 4) return n;
    return '****' + n.slice(-4);
  }

  async MostrarAlerta(titulo: string, mensaje: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  Validar(): boolean {
    if (!this.model.nombre?.trim()) {
      this.MostrarAlerta('Nombre', 'Debes indicar un nombre');
      return false;
    }
    if (!this.model.tipoCuenta) {
      this.MostrarAlerta('Tipo', 'Debes seleccionar un tipo de cuenta');
      return false;
    }
    return true;
  }

  guardar(): void {
    if (!this.Validar()) return;
    this.guardando = true;

    const req = this.isEdit
      ? this.cuentaService.update(this.model)
      : this.cuentaService.create(this.model);

    req.subscribe({
      next: (resp) => {
        this.guardando = false;
        const payload = this.isEdit ? this.model : resp;
        this.onGuardar.emit(payload);
        this.modalCtrl.dismiss(payload);
      },
      error: (err) => {
        console.error(err);
        this.guardando = false;
        this.MostrarAlerta(
          'Error',
          err?.error?.message || (this.isEdit ? 'No se pudo actualizar la cuenta' : 'No se pudo crear la cuenta')
        );
      }
    });
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }
}
