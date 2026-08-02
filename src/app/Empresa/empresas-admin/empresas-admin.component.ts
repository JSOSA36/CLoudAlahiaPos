import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  EmpresaAdminAltaRequest,
  EmpresaAdminDetalle,
  EmpresaAdminListItem,
  EmpresaAdminService,
  ModuloCatalogoItem
} from 'src/app/servicios/empresa-admin.service';

@Component({
  selector: 'app-empresas-admin',
  templateUrl: './empresas-admin.component.html',
  styleUrls: ['./empresas-admin.component.scss']
})
export class EmpresasAdminComponent implements OnInit {
  loading = false;
  guardando = false;
  lista: EmpresaAdminListItem[] = [];
  filtro = '';

  mostrarForm = false;
  editandoId: number | null = null;

  form: EmpresaAdminAltaRequest = this.emptyForm();
  catalogo: ModuloCatalogoItem[] = [];
  seleccion = new Set<string>();

  // Demo panel (edición)
  demoEsDemo = true;
  demoDias = 15;
  demoMonto = 0;

  constructor(
    private api: EmpresaAdminService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  get listaFiltrada(): EmpresaAdminListItem[] {
    const q = (this.filtro || '').trim().toLowerCase();
    if (!q) return this.lista;
    return this.lista.filter(e =>
      `${e.nombreComercial} ${e.rnc || ''} ${e.correElectronico || ''}`.toLowerCase().includes(q)
    );
  }

  get modulosAsignables(): ModuloCatalogoItem[] {
    return this.catalogo.filter(m => m.asignable);
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      this.lista = (await firstValueFrom(this.api.listado())) || [];
    } catch {
      await this.toast('No se pudo cargar el listado', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async abrirAlta(): Promise<void> {
    this.editandoId = null;
    this.form = this.emptyForm();
    this.mostrarForm = true;
    await this.cargarCatalogo();
    // Premarcar plantilla (todos asignables)
    this.seleccion = new Set(this.modulosAsignables.map(m => m.codigo));
  }

  async abrirEditar(item: EmpresaAdminListItem): Promise<void> {
    this.loading = true;
    try {
      const d: EmpresaAdminDetalle = await firstValueFrom(this.api.detalle(item.idEmpresa));
      this.editandoId = d.idEmpresa;
      this.form = {
        nombreComercial: d.nombreComercial || '',
        rnc: d.rnc || '',
        direccion: d.direccion || '',
        telefono: d.telefono || '',
        correElectronico: d.correElectronico || '',
        adminPassword: '',
        limiteUsuario: d.limiteUsuario || 5,
        esDemo: d.esDemoVigente,
        diasDemo: 15,
        montoServicio: d.montoServicio || 0,
        codigosModulo: d.codigosModulo || []
      };
      this.demoEsDemo = d.esDemoVigente;
      this.demoDias = 15;
      this.demoMonto = d.montoServicio > 0 ? d.montoServicio : 0;
      this.catalogo = d.modulosDisponibles || [];
      this.seleccion = new Set((d.codigosModulo || []).map(c => c.trim()));
      this.mostrarForm = true;
    } catch {
      await this.toast('No se pudo cargar la empresa', 'danger');
    } finally {
      this.loading = false;
    }
  }

  cerrarForm(): void {
    this.mostrarForm = false;
    this.editandoId = null;
  }

  toggleModulo(codigo: string): void {
    if (this.seleccion.has(codigo)) this.seleccion.delete(codigo);
    else this.seleccion.add(codigo);
  }

  isChecked(codigo: string): boolean {
    return this.seleccion.has(codigo);
  }

  seleccionarTodos(): void {
    this.seleccion = new Set(this.modulosAsignables.map(m => m.codigo));
  }

  limpiarSeleccion(): void {
    this.seleccion.clear();
  }

  async guardar(): Promise<void> {
    if (this.editandoId) {
      await this.guardarEdicion();
      return;
    }
    await this.guardarAlta();
  }

  private async guardarAlta(): Promise<void> {
    if (!this.form.nombreComercial?.trim() || !this.form.direccion?.trim()
      || !this.form.correElectronico?.trim() || !this.form.adminPassword?.trim()) {
      await this.toast('Completa nombre, dirección, correo y contraseña', 'warning');
      return;
    }
    if (!this.form.esDemo && (!this.form.montoServicio || this.form.montoServicio <= 0)) {
      await this.toast('Sin demo, indica Monto servicio (USD) mayor que 0', 'warning');
      return;
    }
    if (this.seleccion.size === 0) {
      await this.toast('Selecciona al menos un módulo', 'warning');
      return;
    }

    this.guardando = true;
    try {
      const body: EmpresaAdminAltaRequest = {
        ...this.form,
        nombreComercial: this.form.nombreComercial.trim(),
        direccion: this.form.direccion.trim(),
        correElectronico: this.form.correElectronico.trim(),
        adminPassword: this.form.adminPassword.trim(),
        diasDemo: this.form.diasDemo > 0 ? this.form.diasDemo : 15,
        codigosModulo: [...this.seleccion]
      };
      const res = await firstValueFrom(this.api.alta(body));
      await this.alertCtrl.create({
        header: 'Empresa creada',
        message: `${res.message}<br/><br/><strong>Usuario:</strong> ${res.user}<br/><strong>Contraseña:</strong> ${res.password}`,
        buttons: ['OK']
      }).then(a => a.present());
      this.cerrarForm();
      await this.cargar();
    } catch (err: any) {
      await this.toast(err?.error?.message || 'No se pudo crear la empresa', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  private async guardarEdicion(): Promise<void> {
    if (!this.editandoId) return;
    if (this.seleccion.size === 0) {
      await this.toast('Selecciona al menos un módulo', 'warning');
      return;
    }
    if (!this.demoEsDemo && (!this.demoMonto || this.demoMonto <= 0)) {
      await this.toast('Para desactivar demo indica Monto servicio (USD) > 0', 'warning');
      return;
    }

    this.guardando = true;
    try {
      await firstValueFrom(this.api.sincronizarModulos(this.editandoId, [...this.seleccion]));
      await firstValueFrom(this.api.actualizarDemo(this.editandoId, {
        esDemo: this.demoEsDemo,
        diasDemo: this.demoDias > 0 ? this.demoDias : 15,
        montoServicio: this.demoMonto
      }));
      await this.toast('Empresa actualizada', 'success');
      this.cerrarForm();
      await this.cargar();
    } catch (err: any) {
      await this.toast(err?.error?.message || 'No se pudo guardar', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  private async cargarCatalogo(): Promise<void> {
    try {
      this.catalogo = (await firstValueFrom(this.api.catalogoModulos())) || [];
    } catch {
      this.catalogo = [];
      await this.toast('No se pudo cargar el catálogo de módulos', 'danger');
    }
  }

  private emptyForm(): EmpresaAdminAltaRequest {
    return {
      nombreComercial: '',
      rnc: '',
      direccion: '',
      telefono: '',
      correElectronico: '',
      adminPassword: '',
      limiteUsuario: 5,
      esDemo: true,
      diasDemo: 15,
      montoServicio: 0,
      codigosModulo: []
    };
  }

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, color, duration: 2800, position: 'top' });
    await t.present();
  }
}
