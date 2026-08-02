import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { CuentaFinancieraService } from 'src/app/servicios/cuenta-financiera.service';
import { TesoreriaExtractoService } from 'src/app/servicios/tesoreria-extracto.service';
import { TesoreriaConciliacionService } from 'src/app/servicios/tesoreria-conciliacion.service';
import {
  AccionExtractoPendiente,
  ExtractoLineaMatch,
  ExtractoResumen,
  MovimientoFinancieroListado,
  TesoreriaExtractoImport
} from 'src/app/models/Tesoreria.models';

interface RecomendacionLinea {
  accion: AccionExtractoPendiente;
  categoria?: string;
  etiqueta: string;
}

const EXTENSIONES_PERMITIDAS = ['.csv', '.xlsx', '.xls', '.pdf'];

@Component({
  selector: 'app-extracto-bancario',
  templateUrl: './extracto-bancario.component.html',
  styleUrls: ['./extracto-bancario.component.scss'],
})
export class ExtractoBancarioComponent implements OnInit {
  cargando = false;
  cuentas: any[] = [];
  idCuenta: number | null = null;

  archivoSeleccionado: File | null = null;
  mostrarPegarCsv = false;
  contenidoCsv = '';
  nombreArchivo = 'extracto.csv';

  importActual: TesoreriaExtractoImport | null = null;
  resumen: ExtractoResumen | null = null;
  lineas: ExtractoLineaMatch[] = [];
  filtro: 'TODAS' | 'PENDIENTES' | 'RESUELTAS' = 'TODAS';

  constructor(
    private extractoService: TesoreriaExtractoService,
    private conciliacionService: TesoreriaConciliacionService,
    private cuentaService: CuentaFinancieraService,
    private parametros: ParametrosService,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Flujo unificado: el Centro de Conciliación es la única UX de trabajo.
    const qp: Record<string, string | number> = {};
    const cuenta = this.route.snapshot.queryParamMap.get('cuenta');
    const id = this.route.snapshot.queryParamMap.get('id');
    if (cuenta) qp['cuenta'] = cuenta;
    if (id) qp['id'] = id;
    this.router.navigate(['/conciliacionbancaria'], { queryParams: qp, replaceUrl: true });
  }

  // ---------- Carga / importación ----------

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;

    const nombre = file.name.toLowerCase();
    const valido = EXTENSIONES_PERMITIDAS.some(ext => nombre.endsWith(ext));
    if (!valido) {
      this.mostrarToast('Formato no soportado. Use CSV, XLSX, XLS o PDF.', 'warning');
      return;
    }
    this.archivoSeleccionado = file;
  }

  quitarArchivo(): void {
    this.archivoSeleccionado = null;
  }

  importarArchivo(): void {
    if (!this.idCuenta) {
      this.mostrarToast('Seleccione una cuenta.', 'warning');
      return;
    }
    if (!this.archivoSeleccionado) {
      this.mostrarToast('Seleccione un archivo de extracto.', 'warning');
      return;
    }

    this.cargando = true;
    this.extractoService.importarArchivo(
      this.parametros.GetIdEmpresa(),
      this.idCuenta,
      this.parametros.IdUsuario,
      this.archivoSeleccionado
    ).subscribe({
      next: resp => {
        this.importActual = resp;
        this.archivoSeleccionado = null;
        this.refrescarDatos();
        this.mostrarToast('Extracto importado correctamente.', 'success');
      },
      error: err => {
        this.mostrarToast(err?.error?.message || 'Error al importar el archivo.', 'danger');
        this.cargando = false;
      }
    });
  }

  importarTexto(): void {
    if (!this.idCuenta) {
      this.mostrarToast('Seleccione una cuenta.', 'warning');
      return;
    }
    if (!this.contenidoCsv.trim()) {
      this.mostrarToast('Ingrese o pegue contenido CSV.', 'warning');
      return;
    }

    this.cargando = true;
    this.extractoService.importar({
      idEmpresa: this.parametros.GetIdEmpresa(),
      idCuentaFinanciera: this.idCuenta,
      idUsuario: this.parametros.IdUsuario,
      nombreArchivo: this.nombreArchivo,
      contenidoCsv: this.contenidoCsv
    }).subscribe({
      next: resp => {
        this.importActual = resp;
        this.refrescarDatos();
        this.mostrarToast('Extracto importado.', 'success');
      },
      error: err => {
        this.mostrarToast(err?.error?.message || 'Error al importar.', 'danger');
        this.cargando = false;
      }
    });
  }

  cargarImport(idImport: number): void {
    this.cargando = true;
    this.extractoService.getById(this.parametros.GetIdEmpresa(), idImport).subscribe({
      next: resp => {
        this.importActual = resp;
        if (!this.idCuenta) {
          this.idCuenta = resp.idCuentaFinanciera;
        }
        this.refrescarDatos();
      },
      error: () => {
        this.mostrarToast('No se encontró el extracto indicado.', 'warning');
        this.cargando = false;
      }
    });
  }

  refrescarDatos(): void {
    this.cargarSugerencias();
    this.cargarResumen();
  }

  cargarSugerencias(): void {
    if (!this.importActual) return;
    this.extractoService
      .sugerencias(
        this.parametros.GetIdEmpresa(),
        this.importActual.idTesoreriaExtractoImport
      )
      .subscribe({
        next: resp => {
          this.lineas = resp || [];
          this.cargando = false;
        },
        error: err => {
          this.mostrarToast(err?.error?.message || 'Error al cargar las líneas.', 'danger');
          this.cargando = false;
        }
      });
  }

  cargarResumen(): void {
    if (!this.importActual) return;
    this.extractoService
      .resumen(
        this.parametros.GetIdEmpresa(),
        this.importActual.idTesoreriaExtractoImport
      )
      .subscribe({
        next: resp => this.resumen = resp,
        error: () => this.resumen = null
      });
  }

  // ---------- Estado de líneas / filtro ----------

  get lineasFiltradas(): ExtractoLineaMatch[] {
    if (this.filtro === 'PENDIENTES') {
      return this.lineas.filter(l => this.esPendiente(l) || this.esSugerida(l));
    }
    if (this.filtro === 'RESUELTAS') {
      return this.lineas.filter(l => !this.esPendiente(l) && !this.esSugerida(l));
    }
    return this.lineas;
  }

  get pendientesCount(): number {
    return this.lineas.filter(l => this.esPendiente(l)).length;
  }

  get totalSugeridas(): number {
    return this.lineas.filter(l => this.esSugerida(l)).length;
  }

  esPendiente(linea: ExtractoLineaMatch): boolean {
    return (linea.estadoMatch || '').toUpperCase() === 'PENDIENTE';
  }

  esSugerida(linea: ExtractoLineaMatch): boolean {
    return (linea.estadoMatch || '').toUpperCase() === 'SUGERIDO';
  }

  esAutoConciliada(linea: ExtractoLineaMatch): boolean {
    const estado = (linea.estadoMatch || '').toUpperCase();
    return !!linea.esAutoConciliado
      && (estado === 'CONFIRMADO' || estado === 'AUTO_CONCILIADO' || estado === 'CONCILIADO');
  }

  etiquetaEstado(linea: ExtractoLineaMatch): string {
    if (this.esAutoConciliada(linea)) return 'AUTO';
    switch ((linea.estadoMatch || '').toUpperCase()) {
      case 'PENDIENTE': return 'Pendiente';
      case 'SUGERIDO': return 'Sugerido';
      case 'CONFIRMADO':
      case 'CONCILIADO':
      case 'AUTO_CONCILIADO':
      case 'MATCH': return 'Conciliado';
      case 'DESCARTADO': return 'Descartado';
      case 'IGNORADO': return 'Ignorado';
      case 'NUEVO_MOV': return 'Mov. creado';
      default: return linea.estadoMatch;
    }
  }

  claseEstado(linea: ExtractoLineaMatch): string {
    if (this.esAutoConciliada(linea)) return 'auto';
    switch ((linea.estadoMatch || '').toUpperCase()) {
      case 'PENDIENTE': return 'pendiente';
      case 'SUGERIDO': return 'sugerido';
      case 'CONFIRMADO':
      case 'CONCILIADO':
      case 'AUTO_CONCILIADO':
      case 'MATCH':
      case 'NUEVO_MOV': return 'confirmado';
      case 'DESCARTADO':
      case 'IGNORADO': return 'ignorado';
      default: return 'neutro';
    }
  }

  confianzaPct(linea: ExtractoLineaMatch): number | null {
    if (linea.scoreSugerido == null) return null;
    const score = Number(linea.scoreSugerido);
    return Math.round(score <= 1 ? score * 100 : score);
  }

  // ---------- Recomendación de acción/categoría ----------

  recomendacion(linea: ExtractoLineaMatch): RecomendacionLinea {
    const desc = (linea.descripcion || '').toLowerCase();
    const esDebito = (linea.debito || 0) > 0;

    const backend = (linea.accionRecomendada || '').toUpperCase() as AccionExtractoPendiente;
    if (backend && ['CREAR_GASTO', 'CREAR_INGRESO', 'CREAR_AJUSTE', 'ASOCIAR', 'IGNORAR'].includes(backend)) {
      return {
        accion: backend,
        categoria: linea.categoriaSugerida,
        etiqueta: this.etiquetaAccion(backend, linea.categoriaSugerida)
      };
    }
    if (linea.categoriaSugerida) {
      const accion: AccionExtractoPendiente = esDebito ? 'CREAR_GASTO' : 'CREAR_INGRESO';
      return {
        accion,
        categoria: linea.categoriaSugerida,
        etiqueta: this.etiquetaAccion(accion, linea.categoriaSugerida)
      };
    }

    if (/comisi[oó]n|cargo por|fee|mantenimiento|manejo de cuenta|servicio bancario/.test(desc)) {
      return { accion: 'CREAR_GASTO', categoria: 'COMISION_BANCARIA', etiqueta: 'Crear gasto · Comisión bancaria' };
    }
    if (/impuesto|0\.15|dgii|itbis|retenci[oó]n|ley 288/.test(desc)) {
      return { accion: 'CREAR_GASTO', categoria: 'IMPUESTO_BANCARIO', etiqueta: 'Crear gasto · Impuesto bancario' };
    }
    if (/inter[eé]s/.test(desc)) {
      return esDebito
        ? { accion: 'CREAR_GASTO', categoria: 'INTERES_PAGADO', etiqueta: 'Crear gasto · Interés pagado' }
        : { accion: 'CREAR_INGRESO', categoria: 'INTERES_GANADO', etiqueta: 'Crear ingreso · Interés ganado' };
    }
    if (/reverso|ajuste|correcci[oó]n/.test(desc)) {
      return { accion: 'CREAR_AJUSTE', etiqueta: 'Ajuste bancario' };
    }
    if (/transferencia|dep[oó]sito|pago recibido|ach/.test(desc)) {
      return { accion: 'ASOCIAR', etiqueta: 'Asociar a movimiento existente' };
    }

    return esDebito
      ? { accion: 'CREAR_GASTO', categoria: 'GASTO_BANCARIO', etiqueta: 'Crear gasto' }
      : { accion: 'CREAR_INGRESO', categoria: 'INGRESO_BANCARIO', etiqueta: 'Crear ingreso' };
  }

  private etiquetaAccion(accion: AccionExtractoPendiente, categoria?: string): string {
    const base: Record<AccionExtractoPendiente, string> = {
      CREAR_GASTO: 'Crear gasto',
      CREAR_INGRESO: 'Crear ingreso',
      CREAR_AJUSTE: 'Ajuste bancario',
      ASOCIAR: 'Asociar a movimiento existente',
      RECLASIFICAR_PAGO: 'Reclasificar pago',
      IGNORAR: 'Ignorar'
    };
    return categoria ? `${base[accion]} · ${categoria}` : base[accion];
  }

  // ---------- Acciones sobre líneas ----------

  async abrirAcciones(linea: ExtractoLineaMatch): Promise<void> {
    const reco = this.recomendacion(linea);
    const marcar = (accion: AccionExtractoPendiente, texto: string) =>
      accion === reco.accion ? `${texto} (recomendado)` : texto;

    const sheet = await this.actionSheetCtrl.create({
      header: linea.descripcion || 'Resolver línea del extracto',
      buttons: [
        {
          text: marcar('CREAR_GASTO', 'Crear gasto'),
          icon: 'arrow-down-circle-outline',
          handler: () => { this.crearGastoIngreso(linea, 'CREAR_GASTO'); }
        },
        {
          text: marcar('CREAR_INGRESO', 'Crear ingreso'),
          icon: 'arrow-up-circle-outline',
          handler: () => { this.crearGastoIngreso(linea, 'CREAR_INGRESO'); }
        },
        {
          text: marcar('CREAR_AJUSTE', 'Ajuste bancario'),
          icon: 'build-outline',
          handler: () => { this.crearAjuste(linea); }
        },
        {
          text: marcar('ASOCIAR', 'Asociar a movimiento existente'),
          icon: 'git-merge-outline',
          handler: () => { this.asociarExistente(linea); }
        },
        {
          text: marcar('IGNORAR', 'Ignorar línea'),
          icon: 'eye-off-outline',
          role: 'destructive',
          handler: () => { this.ignorarLinea(linea); }
        },
        { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  aplicarRecomendada(linea: ExtractoLineaMatch): void {
    const reco = this.recomendacion(linea);
    switch (reco.accion) {
      case 'ASOCIAR':
        if (linea.movimientoSugerido || linea.idMovimientoFinanciero) {
          this.confirmarMatch(linea);
        } else {
          this.asociarExistente(linea);
        }
        break;
      case 'IGNORAR':
        this.ignorarLinea(linea);
        break;
      case 'CREAR_AJUSTE':
        this.crearAjuste(linea);
        break;
      default:
        this.crearGastoIngreso(linea, reco.accion as 'CREAR_GASTO' | 'CREAR_INGRESO');
    }
  }

  async crearGastoIngreso(linea: ExtractoLineaMatch, accion: 'CREAR_GASTO' | 'CREAR_INGRESO'): Promise<void> {
    const reco = this.recomendacion(linea);
    const alert = await this.alertCtrl.create({
      header: accion === 'CREAR_GASTO' ? 'Crear gasto desde extracto' : 'Crear ingreso desde extracto',
      subHeader: linea.descripcion || undefined,
      inputs: [
        {
          name: 'categoria',
          type: 'text',
          placeholder: 'Categoría',
          value: linea.categoriaSugerida || reco.categoria || ''
        },
        {
          name: 'motivo',
          type: 'text',
          placeholder: 'Motivo / descripción',
          value: linea.descripcion || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: data => {
            this.resolver(linea, accion, {
              categoria: data.categoria?.trim() || reco.categoria,
              motivo: data.motivo?.trim() || linea.descripcion || undefined
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async crearAjuste(linea: ExtractoLineaMatch): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Ajuste bancario',
      subHeader: linea.descripcion || undefined,
      inputs: [
        {
          name: 'motivo',
          type: 'text',
          placeholder: 'Motivo del ajuste',
          value: linea.descripcion || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Registrar ajuste',
          handler: data => {
            this.resolver(linea, 'CREAR_AJUSTE', {
              motivo: data.motivo?.trim() || linea.descripcion || undefined
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async asociarExistente(linea: ExtractoLineaMatch): Promise<void> {
    if (!this.idCuenta) return;

    this.conciliacionService
      .pendientesConciliacion(this.parametros.GetIdEmpresa(), this.idCuenta)
      .subscribe({
        next: async movimientos => {
          const candidatos = (movimientos || []).slice(0, 30);
          if (!candidatos.length) {
            this.mostrarToast('No hay movimientos pendientes para asociar.', 'warning');
            return;
          }
          await this.presentarSeleccionMovimiento(linea, candidatos);
        },
        error: err => this.mostrarToast(err?.error?.message || 'Error al buscar movimientos.', 'danger')
      });
  }

  private async presentarSeleccionMovimiento(
    linea: ExtractoLineaMatch,
    movimientos: MovimientoFinancieroListado[]
  ): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Asociar movimiento existente',
      subHeader: `Línea: ${linea.descripcion || 'sin descripción'} (${this.formatoMonto(linea.montoNeto)})`,
      inputs: movimientos.map(m => ({
        name: `mov_${m.idMovimientoFinanciero}`,
        type: 'radio' as const,
        label: `${this.fechaCorta(m.fechaMovimiento)} · ${m.tipoMovimiento} · ${this.formatoMonto(m.monto)} · ${m.motivo || 'Sin motivo'}`,
        value: m.idMovimientoFinanciero,
        checked: linea.movimientoSugerido?.idMovimientoFinanciero === m.idMovimientoFinanciero
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Asociar',
          handler: (idMovimiento: number) => {
            if (!idMovimiento) {
              this.mostrarToast('Seleccione un movimiento.', 'warning');
              return false;
            }
            this.resolver(linea, 'ASOCIAR', { idMovimientoFinanciero: idMovimiento });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async ignorarLinea(linea: ExtractoLineaMatch): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Ignorar línea',
      message: '¿Marcar esta línea como ignorada? No se creará ningún movimiento.',
      inputs: [
        { name: 'motivo', type: 'text', placeholder: 'Motivo (opcional)' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Ignorar',
          role: 'destructive',
          handler: data => {
            this.resolver(linea, 'IGNORAR', { motivo: data.motivo?.trim() || undefined });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private resolver(
    linea: ExtractoLineaMatch,
    accion: AccionExtractoPendiente,
    extras: { idMovimientoFinanciero?: number; categoria?: string; motivo?: string } = {}
  ): void {
    this.extractoService.resolverLinea({
      idTesoreriaExtractoLinea: linea.idTesoreriaExtractoLinea,
      idEmpresa: this.parametros.GetIdEmpresa(),
      idUsuario: this.parametros.IdUsuario,
      accion,
      ...extras
    }).subscribe({
      next: resultado => {
        const msj: Record<AccionExtractoPendiente, string> = {
          CREAR_GASTO: 'Gasto registrado desde el extracto.',
          CREAR_INGRESO: 'Ingreso registrado desde el extracto.',
          CREAR_AJUSTE: 'Ajuste bancario registrado.',
          ASOCIAR: 'Línea asociada al movimiento.',
          RECLASIFICAR_PAGO: 'Pago reclasificado desde el extracto.',
          IGNORAR: 'Línea ignorada.'
        };
        this.mostrarToast(
          resultado?.yaResuelta ? 'La línea ya estaba resuelta.' : msj[accion],
          accion === 'IGNORAR' ? 'medium' : 'success'
        );
        this.refrescarDatos();
      },
      error: err => this.mostrarToast(err?.error?.message || 'Error al resolver la línea.', 'danger')
    });
  }

  confirmarMatch(linea: ExtractoLineaMatch): void {
    const idMov = linea.idMovimientoFinanciero
      ?? linea.movimientoSugerido?.idMovimientoFinanciero;
    if (!idMov) {
      this.mostrarToast('No hay movimiento sugerido para asociar.', 'warning');
      return;
    }
    this.extractoService.confirmarMatch({
      idTesoreriaExtractoLinea: linea.idTesoreriaExtractoLinea,
      idEmpresa: this.parametros.GetIdEmpresa(),
      idUsuario: this.parametros.IdUsuario,
      idMovimientoFinanciero: idMov
    }).subscribe({
      next: () => {
        this.mostrarToast('Match confirmado.', 'success');
        this.refrescarDatos();
      },
      error: err => this.mostrarToast(err?.error?.message || 'Error al confirmar.', 'danger')
    });
  }

  async revisarAuto(linea: ExtractoLineaMatch): Promise<void> {
    const mov = linea.movimientoSugerido;
    const detalle = mov
      ? `Movimiento #${mov.idMovimientoFinanciero} · ${mov.tipoMovimiento} · ${this.formatoMonto(mov.monto)} · ${this.fechaCorta(mov.fechaMovimiento)}<br>${mov.motivo || ''}`
      : `Movimiento asociado #${linea.idMovimientoFinanciero ?? '—'}`;

    const alert = await this.alertCtrl.create({
      header: 'Conciliada automáticamente',
      subHeader: linea.descripcion || undefined,
      message: `Esta línea fue conciliada de forma automática por coincidencia exacta.<br><br>${detalle}`,
      buttons: [{ text: 'Entendido', role: 'cancel' }]
    });
    await alert.present();
  }

  descartarLinea(linea: ExtractoLineaMatch): void {
    this.extractoService.descartar(
      this.parametros.GetIdEmpresa(),
      linea.idTesoreriaExtractoLinea,
      this.parametros.IdUsuario
    ).subscribe({
      next: () => {
        this.mostrarToast('Sugerencia descartada.', 'medium');
        this.refrescarDatos();
      },
      error: err => this.mostrarToast(err?.error?.message || 'Error al descartar.', 'danger')
    });
  }

  // ---------- Cierre del extracto ----------

  async cerrarExtracto(): Promise<void> {
    if (!this.importActual || !this.resumen?.puedeCerrar) {
      this.mostrarToast('Aún hay líneas pendientes o diferencia de saldo.', 'warning');
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Cerrar extracto',
      message: '¿Confirmar cierre? El saldo de libros debe coincidir con el estado de cuenta.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar',
          handler: () => {
            this.extractoService.cerrar(
              this.parametros.GetIdEmpresa(),
              this.importActual!.idTesoreriaExtractoImport,
              this.parametros.IdUsuario
            ).subscribe({
              next: resp => {
                this.resumen = resp;
                if (this.importActual) {
                  this.importActual.estado = 'CERRADO';
                }
                this.mostrarToast('Extracto cerrado.', 'success');
                this.refrescarDatos();
              },
              error: err => this.mostrarToast(err?.error?.message || 'No se pudo cerrar.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // ---------- Navegación / utilidades ----------

  irConciliacion(): void {
    const qp: any = {};
    if (this.idCuenta) qp.cuenta = this.idCuenta;
    if (this.importActual) qp.import = this.importActual.idTesoreriaExtractoImport;
    this.router.navigate(['/conciliacionbancaria'], { queryParams: qp });
  }

  getNombreCuenta(id: number): string {
    return this.cuentas.find(c => c.idCuentaFinanciera === id)?.nombre || '';
  }

  cuentaEnmascarada(numero?: string): string {
    if (!numero) return '—';
    const limpio = numero.replace(/\s/g, '');
    if (limpio.length <= 4) return `••••${limpio}`;
    return `•••• ${limpio.slice(-4)}`;
  }

  private formatoMonto(monto: number): string {
    return (monto ?? 0).toLocaleString('es-DO', {
      style: 'currency',
      currency: 'DOP',
      currencyDisplay: 'code'
    });
  }

  private fechaCorta(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-DO');
  }

  private async mostrarToast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
