import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  SuscripcionCobrosService,
  SuscripcionCiclo,
  SuscripcionEvento,
  SuscripcionResumen,
  SuscripcionEmpresaCobro,
  SuscripcionCuentaCobro
} from '../servicios/suscripcion-cobros.service';
import {
  EmpresaCargosRecurrentesService,
  EmpresaCargoRecurrente,
  SuscripcionCalculoFactura
} from '../servicios/empresa-cargos-recurrentes.service';
import { PagoEmpresaService } from '../servicios/PagoEmpresaService';
import { PagoEmpresa } from '../models/PagoEmpresa.models';
import { ParametrosService } from '../servicios/parametros.service';
import { ModulosService } from '../servicios/modulos.service';

@Component({
  selector: 'app-cobros-admin',
  templateUrl: './cobros-admin.component.html',
  styleUrls: ['./cobros-admin.component.scss']
})
export class CobrosAdminComponent implements OnInit {
  resumen: SuscripcionResumen | null = null;
  pagos: PagoEmpresa[] = [];
  ciclos: SuscripcionCiclo[] = [];
  eventos: SuscripcionEvento[] = [];
  filtroEstado = '';
  loading = false;
  empresaEventosId: number | null = null;

  // Cargos recurrentes (asignación MacroBits → clientes)
  empresasCliente: SuscripcionEmpresaCobro[] = [];
  empresaCargosId: number | null = null;
  empresaCargosNombre = '';
  cargos: EmpresaCargoRecurrente[] = [];
  calculo: SuscripcionCalculoFactura | null = null;
  montoServicioInput = 0;
  cargoAdicionalInput = 0;
  limiteFacturacionInput = 0;
  cargoReconexionDopInput = 500;
  guardandoTarifa = false;
  cuentasCobro: SuscripcionCuentaCobro[] = [];
  mostrarFormCuenta = false;
  cuentaForm = {
    id: null as number | null,
    banco: '',
    numeroCuenta: '',
    titular: '',
    cedula: '',
    correo: '',
    cuentaEstandar: '',
    activo: true,
    orden: 1
  };
  modulosCatalogo: any[] = [];
  mostrarAltaCargo = false;
  nuevoCargo = {
    tipoCargo: 'SERVICIO',
    idModulo: null as number | null,
    codigo: '',
    nombre: '',
    montoMensual: 0,
    observacion: ''
  };

  constructor(
    private cobros: SuscripcionCobrosService,
    private cargosSvc: EmpresaCargosRecurrentesService,
    private pagosSvc: PagoEmpresaService,
    private parametros: ParametrosService,
    private modulosSvc: ModulosService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarEmpresasCliente();
    this.cargarCuentasCobro();
    this.modulosSvc.getAll().subscribe({
      next: (m) => this.modulosCatalogo = (m as any[]) || [],
      error: () => {}
    });
  }

  cargarCuentasCobro() {
    this.cobros.cuentasCobro(false).subscribe({
      next: (list) => this.cuentasCobro = list || [],
      error: async () => this.toast('No se pudieron cargar las cuentas de cobro', 'danger')
    });
  }

  editarCuenta(c: SuscripcionCuentaCobro) {
    this.cuentaForm = {
      id: c.id,
      banco: c.banco,
      numeroCuenta: c.numeroCuenta,
      titular: c.titular,
      cedula: c.cedula,
      correo: c.correo || '',
      cuentaEstandar: c.cuentaEstandar || '',
      activo: c.activo,
      orden: c.orden
    };
    this.mostrarFormCuenta = true;
  }

  nuevaCuenta() {
    this.cuentaForm = {
      id: null,
      banco: '',
      numeroCuenta: '',
      titular: '',
      cedula: '',
      correo: '',
      cuentaEstandar: '',
      activo: true,
      orden: (this.cuentasCobro.length || 0) + 1
    };
    this.mostrarFormCuenta = true;
  }

  async guardarCuentaCobro() {
    if (!this.cuentaForm.banco.trim()
      || !this.cuentaForm.numeroCuenta.trim()
      || !this.cuentaForm.titular.trim()
      || !this.cuentaForm.cedula.trim()) {
      await this.toast('Banco, cuenta, titular y cédula son obligatorios', 'warning');
      return;
    }
    try {
      await firstValueFrom(this.cobros.guardarCuentaCobro({
        id: this.cuentaForm.id || undefined,
        banco: this.cuentaForm.banco.trim(),
        numeroCuenta: this.cuentaForm.numeroCuenta.trim(),
        titular: this.cuentaForm.titular.trim(),
        cedula: this.cuentaForm.cedula.trim(),
        correo: this.cuentaForm.correo.trim() || undefined,
        cuentaEstandar: this.cuentaForm.cuentaEstandar.trim() || undefined,
        activo: this.cuentaForm.activo,
        orden: this.cuentaForm.orden
      }));
      await this.toast('Cuenta de cobro guardada', 'success');
      this.mostrarFormCuenta = false;
      this.cargarCuentasCobro();
    } catch (e: any) {
      await this.toast(e?.error?.message || 'No se pudo guardar la cuenta', 'danger');
    }
  }

  async eliminarCuenta(c: SuscripcionCuentaCobro) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar cuenta',
      message: `¿Eliminar ${c.banco} · ${c.numeroCuenta}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.cobros.eliminarCuentaCobro(c.id));
              await this.toast('Cuenta eliminada', 'success');
              this.cargarCuentasCobro();
            } catch (e: any) {
              await this.toast(e?.error?.message || 'No se pudo eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  cargarEmpresasCliente() {
    this.cobros.empresas().subscribe({
      next: (list) => {
        this.empresasCliente = list || [];
        // Si no hay selección, dejar lista lista para que MacroBits elija
      },
      error: async () => this.toast('No se pudo cargar el listado de clientes', 'danger')
    });
  }

  cargar() {
    this.loading = true;
    this.cobros.resumen().subscribe({
      next: (r) => { this.resumen = r; this.ciclos = r.ciclosAbiertos || []; },
      error: () => {}
    });
    this.pagosSvc.obtenerPagos().subscribe({
      next: (p) => { this.pagos = p || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get pagosFiltrados(): PagoEmpresa[] {
    if (!this.filtroEstado) return this.pagos;
    return this.pagos.filter(p => (p.estado || '').toUpperCase() === this.filtroEstado);
  }

  estadoPagoClass(estado?: string | null): string {
    const e = (estado || '').toUpperCase();
    if (e === 'APROBADO') return 'status--ok';
    if (e === 'PENDIENTE') return 'status--warn';
    if (e === 'RECHAZADO') return 'status--bad';
    return 'status--muted';
  }

  async aprobar(pago: PagoEmpresa) {
    const usuario = localStorage.getItem('Usuario') || 'MacroBits';
    this.pagosSvc.validarPago({
      idPago: pago.id,
      estado: 'APROBADO',
      observacion: '',
      usuarioValida: usuario
    }).subscribe({
      next: async () => {
        await this.toast('Pago aprobado. Empresa reactivada.', 'success');
        this.cargar();
      },
      error: async (e) => this.toast(e?.error?.message || 'Error al aprobar', 'danger')
    });
  }

  async rechazar(pago: PagoEmpresa) {
    const alert = await this.alertCtrl.create({
      header: 'Rechazar pago',
      inputs: [{ name: 'obs', type: 'textarea', placeholder: 'Observación / motivo' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          handler: (data) => {
            this.pagosSvc.validarPago({
              idPago: pago.id,
              estado: 'RECHAZADO',
              observacion: data?.obs || 'Comprobante no válido',
              usuarioValida: localStorage.getItem('Usuario') || 'MacroBits'
            }).subscribe({
              next: async () => {
                await this.toast('Pago rechazado', 'warning');
                this.cargar();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  verEventos(idEmpresa: number) {
    this.empresaEventosId = idEmpresa;
    this.cobros.eventos(idEmpresa).subscribe({
      next: (e) => this.eventos = e || []
    });
  }

  verCargos(idEmpresa: number) {
    this.empresaCargosId = idEmpresa;
    const emp = this.empresasCliente.find(e => e.idEmpresa === idEmpresa);
    this.empresaCargosNombre = emp?.nombreComercial || (`#${idEmpresa}`);
    this.mostrarAltaCargo = true; // listo para que MacroBits agregue el recargo
    this.cargarCargos();
  }

  onEmpresaCargosChange(id: number | string | null) {
    const n = Number(id);
    if (!n) {
      this.empresaCargosId = null;
      this.empresaCargosNombre = '';
      this.cargos = [];
      this.calculo = null;
      return;
    }
    this.verCargos(n);
  }

  abrirCargosPorId() {
    const id = Number(this.empresaCargosId);
    if (!id || id <= 0) {
      this.toast('Seleccione un cliente', 'warning');
      return;
    }
    this.verCargos(id);
  }

  cargarCargos() {
    if (!this.empresaCargosId) return;
    this.cargosSvc.listar(this.empresaCargosId).subscribe({
      next: (c) => this.cargos = c || []
    });
    this.cargosSvc.calculo(this.empresaCargosId).subscribe({
      next: (c) => {
        this.calculo = c;
        this.montoServicioInput = Number(c?.montoServicio ?? c?.montoPlan ?? 0);
        this.cargoAdicionalInput = Number(c?.cargoAdicional ?? 0);
        this.limiteFacturacionInput = Number(c?.limiteFacturacion ?? 0);
        this.cargoReconexionDopInput = Number(c?.cargoReconexionDop ?? 500);
      },
      error: () => { this.calculo = null; }
    });
  }

  async guardarTarifaEmpresa() {
    if (!this.empresaCargosId) return;
    const monto = Number(this.montoServicioInput);
    const cargo = Number(this.cargoAdicionalInput);
    const limite = Number(this.limiteFacturacionInput);
    const reconexDop = Number(this.cargoReconexionDopInput);
    if (Number.isNaN(monto) || monto < 0 || Number.isNaN(cargo) || cargo < 0) {
      await this.toast('Indique montos válidos (USD ≥ 0)', 'warning');
      return;
    }
    if (Number.isNaN(limite) || limite < 0) {
      await this.toast('El límite de facturas debe ser 0 o mayor', 'warning');
      return;
    }
    if (Number.isNaN(reconexDop) || reconexDop < 0) {
      await this.toast('El cargo de reconexión (RD$) debe ser 0 o mayor', 'warning');
      return;
    }

    this.guardandoTarifa = true;
    try {
      const calc = await firstValueFrom(this.cobros.tarifaEmpresa(
        this.empresaCargosId,
        monto,
        cargo,
        limite,
        this.parametros.IdUsuario || undefined,
        reconexDop
      ));

      // Aplicar respuesta al instante (sin esperar otro GET)
      this.calculo = calc;
      this.montoServicioInput = Number(calc?.montoServicio ?? calc?.montoPlan ?? monto);
      this.cargoAdicionalInput = Number(calc?.cargoAdicional ?? cargo);
      this.limiteFacturacionInput = Number(calc?.limiteFacturacion ?? limite);
      this.cargoReconexionDopInput = Number(calc?.cargoReconexionDop ?? reconexDop);

      await this.toast(
        `Tarifa guardada: USD ${this.montoServicioInput.toFixed(2)} + ${this.cargoAdicionalInput.toFixed(2)}`,
        'success'
      );
      this.cargarEmpresasCliente();
      this.cargarCargos();
    } catch (e: any) {
      const msg = e?.error?.message
        || e?.message
        || (e?.status === 404
          ? 'Endpoint no encontrado: reinicia la API con el build nuevo'
          : 'No se pudo guardar la tarifa');
      await this.toast(msg, 'danger');
    } finally {
      this.guardandoTarifa = false;
    }
  }

  onTipoCargoChange() {
    if (this.nuevoCargo.tipoCargo !== 'MODULO') {
      this.nuevoCargo.idModulo = null;
    }
  }

  onModuloChange() {
    const m = this.modulosCatalogo.find(x => (x.id ?? x.moduloId) === this.nuevoCargo.idModulo);
    if (!m) return;
    this.nuevoCargo.codigo = m.codigo || '';
    this.nuevoCargo.nombre = m.nombre || '';
    this.nuevoCargo.montoMensual = Number(m.precioUSD ?? m.precioUsd ?? 0);
  }

  async guardarCargo() {
    if (!this.empresaCargosId) return;
    if (!this.nuevoCargo.nombre.trim() && this.nuevoCargo.tipoCargo !== 'MODULO') {
      await this.toast('Indique el nombre del cargo', 'warning');
      return;
    }
    if (this.nuevoCargo.tipoCargo === 'MODULO' && !this.nuevoCargo.idModulo) {
      await this.toast('Seleccione un módulo', 'warning');
      return;
    }

    try {
      await firstValueFrom(this.cargosSvc.crear({
        idEmpresa: this.empresaCargosId,
        tipoCargo: this.nuevoCargo.tipoCargo,
        idModulo: this.nuevoCargo.idModulo || undefined,
        codigo: this.nuevoCargo.codigo || undefined,
        nombre: this.nuevoCargo.nombre || undefined,
        montoMensual: this.nuevoCargo.montoMensual,
        observacion: this.nuevoCargo.observacion || undefined,
        idUsuarioCreacion: this.parametros.IdUsuario || undefined
      }));
      await this.toast('Cargo agregado', 'success');
      this.mostrarAltaCargo = false;
      this.nuevoCargo = { tipoCargo: 'SERVICIO', idModulo: null, codigo: '', nombre: '', montoMensual: 0, observacion: '' };
      this.cargarCargos();
    } catch (e: any) {
      await this.toast(e?.error?.message || 'Error al crear cargo', 'danger');
    }
  }

  async editarMonto(cargo: EmpresaCargoRecurrente) {
    const alert = await this.alertCtrl.create({
      header: 'Editar monto',
      message: cargo.nombre,
      inputs: [{
        name: 'monto',
        type: 'number',
        value: String(cargo.montoMensual),
        placeholder: 'Monto mensual USD',
        min: 0,
        attributes: { step: '0.01' }
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          // No usar async aquí: Ionic cancela/rompe el PUT al cerrar el alert.
          handler: (data) => {
            const monto = Number(data?.monto);
            if (isNaN(monto) || monto < 0) {
              this.toast('Monto inválido', 'warning');
              return false;
            }
            void this.guardarMontoCargo(cargo, monto);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async guardarMontoCargo(cargo: EmpresaCargoRecurrente, monto: number) {
    try {
      await firstValueFrom(this.cargosSvc.actualizar({
        id: cargo.id,
        montoMensual: monto,
        idUsuarioModificacion: this.parametros.IdUsuario || undefined
      }));
      await this.toast('Monto actualizado', 'success');
      this.cargarCargos();
    } catch (e: any) {
      await this.toast(e?.error?.message || 'Error al actualizar monto', 'danger');
    }
  }

  async desactivarCargo(cargo: EmpresaCargoRecurrente) {
    const alert = await this.alertCtrl.create({
      header: 'Desactivar cargo',
      message: `¿Desactivar "${cargo.nombre}"? No quita permisos/licencia.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          handler: () => {
            void this.ejecutarDesactivarCargo(cargo);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async ejecutarDesactivarCargo(cargo: EmpresaCargoRecurrente) {
    try {
      await firstValueFrom(this.cargosSvc.desactivar(cargo.id, this.parametros.IdUsuario || undefined));
      await this.toast('Cargo desactivado', 'warning');
      this.cargarCargos();
    } catch (e: any) {
      await this.toast(e?.error?.message || 'Error', 'danger');
    }
  }

  async procesarDiario() {
    try {
      await firstValueFrom(this.cobros.procesarDiario());
      await this.toast('Ciclo diario ejecutado', 'success');
      this.cargar();
    } catch {
      await this.toast('Error al procesar ciclo', 'danger');
    }
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2600, color, position: 'top' });
    await t.present();
  }
}
