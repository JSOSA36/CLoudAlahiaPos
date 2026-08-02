import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { CategoriaGasto } from 'src/app/models/Gastos.models';
import { CategoriaGastoService } from 'src/app/servicios/categoria-gasto.service';
import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';
import { CuentaContable } from 'src/app/models/CuentaContable.models';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-categorias-gasto',
  templateUrl: './categorias-gasto.component.html',
  styleUrls: ['./categorias-gasto.component.scss'],
})
export class CategoriasGastoComponent implements OnInit {
  categorias: CategoriaGasto[] = [];
  cuentasGasto: CuentaContable[] = [];
  cargando = false;
  editando: CategoriaGasto | null = null;
  formNombre = '';
  formDescripcion = '';
  formActivo = true;
  formIdCuentaContable: number | null = null;

  constructor(
    private srv: CategoriaGastoService,
    private cuentaSrv: CuentaContableService,
    private para: ParametrosService,
    public modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();
    this.cargar();
  }

  cargarCuentas(): void {
    this.cuentaSrv.getByEmpresa(this.para.GetIdEmpresa()).subscribe({
      next: (res) => {
        this.cuentasGasto = (res || []).filter(
          (c) =>
            c.activa &&
            c.permiteMovimiento &&
            (c.tipoCuenta === 'Gastos' || c.tipoCuenta === 'Costos')
        );
      },
    });
  }

  nombreCuenta(id?: number | null): string {
    if (!id) return 'Mapeo general (GASTO_OPERATIVO)';
    const c = this.cuentasGasto.find((x) => x.idCuentaContable === id);
    return c ? `${c.codigo} — ${c.nombre}` : `Cuenta #${id}`;
  }

  cargar(): void {
    this.cargando = true;
    this.srv.getByEmpresa(this.para.GetIdEmpresa(), false).subscribe({
      next: (res) => {
        this.categorias = res || [];
        this.cargando = false;
      },
      error: async () => {
        this.cargando = false;
        await this.toast('Error cargando categorías', 'danger');
      },
    });
  }

  nuevo(): void {
    this.editando = null;
    this.formNombre = '';
    this.formDescripcion = '';
    this.formActivo = true;
    this.formIdCuentaContable = null;
  }

  editar(c: CategoriaGasto): void {
    this.editando = { ...c };
    this.formNombre = c.nombre;
    this.formDescripcion = c.descripcion || '';
    this.formActivo = c.activo;
    this.formIdCuentaContable = c.idCuentaContable ?? null;
  }

  cancelarForm(): void {
    this.editando = null;
    this.formNombre = '';
    this.formDescripcion = '';
    this.formActivo = true;
    this.formIdCuentaContable = null;
  }

  async guardar(): Promise<void> {
    const nombre = (this.formNombre || '').trim();
    if (!nombre) {
      await this.toast('El nombre es obligatorio');
      return;
    }

    if (this.editando) {
      const payload: CategoriaGasto = {
        ...this.editando,
        nombre,
        descripcion: (this.formDescripcion || '').trim() || null,
        activo: this.formActivo,
        idCuentaContable: this.formIdCuentaContable,
      };
      this.srv.update(payload.idCategoriaGasto, payload).subscribe({
        next: async (resp) => {
          if (resp?.success === false) {
            await this.toast(resp.message || 'No se pudo actualizar');
            return;
          }
          await this.toast('Categoría actualizada', 'success');
          this.cancelarForm();
          this.cargar();
        },
        error: async () => this.toast('Error al actualizar', 'danger'),
      });
      return;
    }

    this.srv
      .create({
        idEmpresa: this.para.GetIdEmpresa(),
        nombre,
        descripcion: (this.formDescripcion || '').trim() || null,
        activo: true,
        orden: 50,
        idCuentaContable: this.formIdCuentaContable,
      })
      .subscribe({
        next: async (resp) => {
          if (resp?.success === false) {
            await this.toast(resp.message || 'No se pudo crear');
            return;
          }
          await this.toast('Categoría creada', 'success');
          this.cancelarForm();
          this.cargar();
        },
        error: async () => this.toast('Error al crear', 'danger'),
      });
  }

  async desactivar(c: CategoriaGasto): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Desactivar categoría',
      message: `¿Desactivar “${c.nombre}”?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: () => {
            this.srv.deactivate(c.idCategoriaGasto).subscribe({
              next: async () => {
                await this.toast('Categoría desactivada', 'success');
                this.cargar();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async toast(message: string, color = 'warning'): Promise<void> {
    (await this.toastCtrl.create({ message, duration: 2000, color })).present();
  }
}
