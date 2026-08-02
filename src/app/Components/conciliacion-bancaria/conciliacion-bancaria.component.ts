import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { from, of } from 'rxjs';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { CuentaFinancieraService } from 'src/app/servicios/cuenta-financiera.service';
import { TesoreriaConciliacionService } from 'src/app/servicios/tesoreria-conciliacion.service';
import { TesoreriaExtractoService } from 'src/app/servicios/tesoreria-extracto.service';
import {
  AccionExtractoPendiente,
  ConciliacionLineaBanco,
  ConciliacionResumen,
  ConciliacionWorkspace,
  ExtractoPreview,
  MovimientoFinancieroListado
} from 'src/app/models/Tesoreria.models';
import {
  contarLineasBanco,
  esSeleccionableMasivo,
  etiquetaExtractoCubierto,
  etiquetaPeriodoConciliacion,
  extractoCubrePeriodoCompleto,
  filtrarLineasBanco,
  mensajeCierreExitoso,
  metricasConciliacionUx,
  MetricasConciliacionUx,
  puedeCerrarPorContrato,
  puedeEditarSesion
} from './conciliacion-workbench.util';
import {
  calcularTotalesPreview,
  diferenciaSaldoPreview,
  erroresPreview,
  esLineaPreviewValida,
  nuevaLineaPreview,
  PreviewTotales
} from './extracto-preview.util';

@Component({
  selector: 'app-conciliacion-bancaria',
  templateUrl: './conciliacion-bancaria.component.html',
  styleUrls: ['./conciliacion-bancaria.component.scss'],
})
export class ConciliacionBancariaComponent implements OnInit {
  segmento: 'trabajo' | 'historial' = 'trabajo';
  filtroBanco: 'PENDIENTES' | 'TODAS' | 'RESUELTAS' = 'PENDIENTES';
  cargando = false;

  // Wizard de importación con vista previa
  previewArchivoSel: File | null = null;
  preview: ExtractoPreview | null = null;
  previewAnalizando = false;
  previewConfirmando = false;
  previewDescartando = false;

  private static readonly extensionesPermitidas = ['.csv', '.txt', '.xlsx', '.xls', '.pdf'];
  private static readonly maxBytesArchivo = 8 * 1024 * 1024;

  cuentas: any[] = [];
  idCuenta: number | null = null;
  historial: ConciliacionResumen[] = [];
  workspace: ConciliacionWorkspace | null = null;

  periodoDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  periodoHasta = new Date().toISOString().split('T')[0];
  saldoBancoFinal = 0;
  saldoBancoInicial: number | null = null;
  toleranciaDiferencia = 0.01;
  observacionNueva = '';

  lineaAsociar: ConciliacionLineaBanco | null = null;
  candidatos: MovimientoFinancieroListado[] = [];
  busquedaCandidatos = '';
  lineasSeleccionadas = new Set<number>();

  constructor(
    private conciliacionService: TesoreriaConciliacionService,
    private extractoService: TesoreriaExtractoService,
    private cuentaService: CuentaFinancieraService,
    private parametros: ParametrosService,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['cuenta']) {
        this.idCuenta = Number(params['cuenta']) || null;
      }
      if (params['id']) {
        this.abrirConciliacion(Number(params['id']));
      }
    });
    this.cargarCuentas();
  }

  get idEmpresa(): number {
    return this.parametros.GetIdEmpresa();
  }

  get idUsuario(): number {
    return this.parametros.IdUsuario;
  }

  get lineasFiltradas(): ConciliacionLineaBanco[] {
    return filtrarLineasBanco(this.workspace?.lineasBanco || [], this.filtroBanco);
  }

  /** Contadores desde las mismas líneas del listado Banco (fuente única). */
  get conteoBanco(): {
    total: number;
    pendientes: number;
    conciliadas: number;
    excluidas: number;
    resueltas: number;
  } {
    return contarLineasBanco(this.workspace?.lineasBanco || []);
  }

  get pendientesLibroPeriodo(): number {
    return this.workspace?.movimientosLibroPendientes?.length
      ?? this.workspace?.estadisticas?.movimientosLibroPendientes
      ?? 0;
  }

  /** Métricas UX: diferencia de período vs variación histórica vs brecha de cuenta. */
  get metricasUx(): MetricasConciliacionUx {
    return metricasConciliacionUx(
      this.workspace?.saldos,
      this.conteoBanco.pendientes,
      this.pendientesLibroPeriodo
    );
  }

  get mostrarContextoSaldos(): boolean {
    const m = this.metricasUx;
    return m.hayVariacionHistorica || Math.abs(m.brechaBalanceCuenta) > 0.0001;
  }

  get mensajeCierreListo(): string {
    return mensajeCierreExitoso(this.metricasUx);
  }

  /**
   * Cierre alineado al contrato UX: solo DiferenciaPeriodo + pendientes.
   * Filtra bloqueos legacy de brecha acumulada (Banco−Libros).
   */
  get evaluacionCierre() {
    const ws = this.workspace;
    const lineas = ws?.lineasBanco || [];
    const hayReclas = lineas.some(l =>
      (l.accionTomada || '').toUpperCase() === 'RECLASIFICAR_PAGO'
      && (l.estadoMatch || '').toUpperCase() === 'RECLASIFICACION_PENDIENTE_CONTABLE'
    );
    return puedeCerrarPorContrato(this.metricasUx, ws?.bloqueos, {
      tieneExtractoOLineas: !!ws?.extracto || lineas.length > 0,
      hayReclasificacionPendiente: hayReclas
    });
  }

  get puedeCerrarUi(): boolean {
    return this.evaluacionCierre.puedeCerrar;
  }

  get bloqueosCierreUi(): string[] {
    return this.evaluacionCierre.bloqueos;
  }

  get motivoNoCerrarUi(): string {
    return this.evaluacionCierre.motivo;
  }

  get etiquetaPeriodoSesion(): string {
    if (!this.workspace) return '';
    return etiquetaPeriodoConciliacion(
      this.workspace.conciliacion.periodoDesde,
      this.workspace.conciliacion.periodoHasta
    );
  }

  get etiquetaExtractoSesion(): string {
    if (!this.workspace?.extracto) return 'Sin extracto';
    return etiquetaExtractoCubierto(this.workspace.extracto, this.workspace.lineasBanco || []);
  }

  /** Extracto no cubre todo el período → puede explicar diferencias de saldo. */
  get advertenciaCoberturaExtracto(): string | null {
    const ws = this.workspace;
    if (!ws?.extracto) return null;
    const cubre = extractoCubrePeriodoCompleto(
      ws.conciliacion.periodoDesde,
      ws.conciliacion.periodoHasta,
      ws.extracto.periodoDesde,
      ws.extracto.periodoHasta,
      ws.lineasBanco || []
    );
    if (cubre) return null;
    return 'El extracto importado no corresponde al período completo de la conciliación. Esto puede generar un sesgo entre el período de la sesión y el marco del extracto.';
  }

  /**
   * Contexto informativo: extracto resuelto pero hay variación histórica / brecha de cuenta.
   * No se presenta como error de matching del período.
   */
  get advertenciaVariacionHistorica(): string | null {
    const ws = this.workspace;
    if (!ws?.extracto || !ws.saldos) return null;
    if (this.advertenciaCoberturaExtracto) return null;
    if (this.conteoBanco.pendientes > 0) return null;
    const m = this.metricasUx;
    if (!m.hayVariacionHistorica && Math.abs(m.brechaBalanceCuenta) <= (Number(ws.saldos.toleranciaDiferencia) || 0)) {
      return null;
    }
    if (!m.hayVariacionHistorica) return null;
    return `Incluye saldo de apertura y/o movimientos anteriores al extracto: ${this.formatearMonto(m.variacionHistorica)}. No indica líneas del extracto sin resolver.`;
  }

  private formatearMonto(valor: number): string {
    try {
      return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2
      }).format(valor);
    } catch {
      return `RD$${valor.toFixed(2)}`;
    }
  }

  get lineasSeleccionablesVisibles(): ConciliacionLineaBanco[] {
    return this.lineasFiltradas.filter(linea => this.lineaSeleccionable(linea));
  }

  get todasSeleccionadasVisibles(): boolean {
    const visibles = this.lineasSeleccionablesVisibles;
    return visibles.length > 0
      && visibles.every(linea => this.lineasSeleccionadas.has(linea.idTesoreriaExtractoLinea));
  }

  cargarCuentas(): void {
    this.cuentaService.getByEmpresa(this.idEmpresa).subscribe({
      next: resp => {
        this.cuentas = resp || [];
        if (!this.idCuenta && this.cuentas.length === 1) {
          this.idCuenta = this.cuentas[0].idCuentaFinanciera;
        }
        if (this.idCuenta) {
          this.onCuentaChange();
        }
      }
    });
  }

  onCuentaChange(): void {
    this.workspace = null;
    this.lineaAsociar = null;
    this.resetWizardPreview();
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    if (!this.idCuenta) return;
    this.conciliacionService.historial(this.idEmpresa, this.idCuenta).subscribe({
      next: resp => {
        this.historial = resp || [];
        const abierta = this.historial.find(h => h.estado === 'EN_PROCESO' || h.estado === 'BORRADOR');
        if (abierta && !this.workspace) {
          this.abrirConciliacion(abierta.idTesoreriaConciliacion);
        }
      },
      error: err => this.toast(err?.error?.message || 'Error al cargar historial.', 'danger')
    });
  }

  crearConciliacion(): void {
    if (!this.idCuenta) {
      this.toast('Seleccione una cuenta.', 'warning');
      return;
    }
    if (this.periodoDesde > this.periodoHasta) {
      this.toast('El periodo desde no puede ser mayor que el periodo hasta.', 'warning');
      return;
    }
    this.cargando = true;
    this.conciliacionService.crear({
      idEmpresa: this.idEmpresa,
      idUsuario: this.idUsuario,
      idCuentaFinanciera: this.idCuenta,
      periodoDesde: this.periodoDesde,
      periodoHasta: this.periodoHasta,
      saldoBancoFinal: Number(this.saldoBancoFinal) || 0,
      saldoBancoInicial: this.saldoBancoInicial != null ? Number(this.saldoBancoInicial) : undefined,
      toleranciaDiferencia: Number(this.toleranciaDiferencia) || 0,
      observacion: this.observacionNueva || undefined
    }).subscribe({
      next: resp => {
        this.toast('Conciliación creada.', 'success');
        this.abrirConciliacion(resp.idTesoreriaConciliacion);
        this.cargarHistorial();
        this.cargando = false;
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo crear.', 'danger');
        this.cargando = false;
      }
    });
  }

  abrirConciliacion(id: number): void {
    if (!id) return;
    if (this.workspace && this.workspace.conciliacion.idTesoreriaConciliacion !== id) {
      this.resetWizardPreview();
    }
    this.cargando = true;
    this.conciliacionService.workspace(this.idEmpresa, id).subscribe({
      next: ws => {
        this.aplicarWorkspace(ws);
        this.segmento = 'trabajo';
        this.cargando = false;
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo cargar el workspace.', 'danger');
        this.cargando = false;
      }
    });
  }

  /** Única vía para pintar KPIs + listados a partir del mismo payload. */
  private aplicarWorkspace(ws: ConciliacionWorkspace, opciones?: { limpiarSeleccion?: boolean }): void {
    this.workspace = ws;
    this.idCuenta = ws.conciliacion.idCuentaFinanciera;
    if (opciones?.limpiarSeleccion !== false) {
      this.lineasSeleccionadas.clear();
    }
    this.sincronizarHistorialResumen(ws);
  }

  /** Actualiza el resumen del historial con los mismos conteos del workspace abierto. */
  private sincronizarHistorialResumen(ws: ConciliacionWorkspace): void {
    const idx = this.historial.findIndex(
      h => h.idTesoreriaConciliacion === ws.conciliacion.idTesoreriaConciliacion
    );
    if (idx < 0) return;
    const conteo = contarLineasBanco(ws.lineasBanco || []);
    this.historial[idx] = {
      ...this.historial[idx],
      estado: ws.conciliacion.estado,
      diferencia: ws.saldos?.diferencia ?? this.historial[idx].diferencia,
      movimientosConciliados: conteo.conciliadas,
      movimientosPendientes: conteo.pendientes
    };
  }

  refrescarWorkspace(limpiarSeleccion = true): void {
    if (!this.workspace) return;
    const id = this.workspace.conciliacion.idTesoreriaConciliacion;
    this.cargando = true;
    this.conciliacionService.workspace(this.idEmpresa, id).subscribe({
      next: ws => {
        this.aplicarWorkspace(ws, { limpiarSeleccion });
        this.cargando = false;
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo refrescar el workspace.', 'danger');
        this.cargando = false;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Wizard de importación: seleccionar → analizar → vista previa editable → confirmar
  // ---------------------------------------------------------------------------

  get pasoPreview(): 1 | 2 | 3 | 4 {
    if (this.previewConfirmando) return 4;
    if (this.preview) return 3;
    if (this.previewArchivoSel) return 2;
    return 1;
  }

  get wizardOcupado(): boolean {
    return this.previewAnalizando || this.previewConfirmando || this.previewDescartando;
  }

  get totalesPreview(): PreviewTotales {
    return calcularTotalesPreview(this.preview?.lineas || []);
  }

  get erroresPreviewActual(): string[] {
    return this.preview ? erroresPreview(this.preview.lineas) : [];
  }

  get diferenciaSaldoPreviewActual(): number | null {
    return this.preview ? diferenciaSaldoPreview(this.preview, this.preview.lineas) : null;
  }

  lineaPreviewInvalida(linea: ExtractoPreview['lineas'][number]): boolean {
    return !esLineaPreviewValida(linea);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.workspace || this.wizardOcupado) return;

    const ext = ('.' + (file.name.split('.').pop() || '')).toLowerCase();
    if (!ConciliacionBancariaComponent.extensionesPermitidas.includes(ext)) {
      this.toast(`Formato no soportado: ${ext}. Use CSV, TXT, XLS, XLSX o PDF.`, 'warning');
      return;
    }
    if (file.size > ConciliacionBancariaComponent.maxBytesArchivo) {
      this.toast('El archivo excede 8 MB.', 'warning');
      return;
    }

    // Si había una vista previa anterior sin confirmar, se descarta en el backend.
    if (this.preview) {
      this.descartarPreviewBackend(this.preview);
    }
    this.preview = null;
    this.previewArchivoSel = file;
  }

  analizarArchivo(): void {
    if (!this.workspace || !this.previewArchivoSel || this.previewAnalizando) return;
    this.previewAnalizando = true;
    this.extractoService.previewArchivo(
      this.idEmpresa,
      this.workspace.conciliacion.idCuentaFinanciera,
      this.idUsuario,
      this.previewArchivoSel
    ).subscribe({
      next: pv => {
        this.preview = this.normalizarPreview(pv);
        this.previewAnalizando = false;
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo analizar el archivo.', 'danger');
        this.previewAnalizando = false;
      }
    });
  }

  agregarLineaPreview(): void {
    if (!this.preview) return;
    const ultima = this.preview.lineas[this.preview.lineas.length - 1];
    this.preview.lineas.push(nuevaLineaPreview(ultima?.fechaMovimiento || this.preview.periodoHasta));
  }

  eliminarLineaPreview(index: number): void {
    if (!this.preview) return;
    this.preview.lineas.splice(index, 1);
  }

  confirmarPreview(): void {
    if (!this.workspace || !this.preview || this.wizardOcupado) return;
    const errores = this.erroresPreviewActual;
    if (errores.length) {
      this.toast(errores[0], 'warning');
      return;
    }

    const pv = this.preview;
    const idConciliacion = this.workspace.conciliacion.idTesoreriaConciliacion;
    this.previewConfirmando = true;

    // 1) Guarda correcciones, 2) confirma el import, 3) adjunta con matching automático.
    this.extractoService.actualizarPreview(pv.idTesoreriaExtractoImport, {
      idEmpresa: this.idEmpresa,
      idUsuario: this.idUsuario,
      banco: pv.banco || undefined,
      numeroCuentaBanco: pv.numeroCuentaBanco || undefined,
      moneda: pv.moneda || undefined,
      periodoDesde: pv.periodoDesde || undefined,
      periodoHasta: pv.periodoHasta || undefined,
      saldoInicial: pv.saldoInicial ?? undefined,
      saldoFinal: pv.saldoFinal ?? undefined,
      observacion: pv.observacion || undefined,
      reemplazarTodas: pv.lineas.map(l => ({
        fechaMovimiento: l.fechaMovimiento,
        descripcion: l.descripcion || undefined,
        referencia: l.referencia || undefined,
        debito: Number(l.debito) || 0,
        credito: Number(l.credito) || 0,
        balance: l.balance ?? null
      }))
    }).pipe(
      switchMap(() => this.extractoService.confirmarPreview(
        this.idEmpresa,
        pv.idTesoreriaExtractoImport,
        this.idUsuario
      ))
    ).subscribe({
      next: imp => {
        this.conciliacionService.adjuntarExtracto({
          idTesoreriaConciliacion: idConciliacion,
          idTesoreriaExtractoImport: imp.idTesoreriaExtractoImport,
          idEmpresa: this.idEmpresa,
          idUsuario: this.idUsuario,
          ejecutarMatching: true
        }).subscribe({
          next: () => {
            this.toast('Extracto importado y conciliado automáticamente donde fue posible.', 'success');
            this.resetWizardPreview();
            this.refrescarWorkspace();
          },
          error: err => {
            // El import ya quedó confirmado; solo falló el adjuntar.
            this.toast(err?.error?.message || 'Extracto importado, pero no se pudo adjuntar a la conciliación.', 'danger');
            this.resetWizardPreview();
            this.refrescarWorkspace();
          }
        });
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo confirmar la vista previa.', 'danger');
        this.previewConfirmando = false;
      }
    });
  }

  cancelarPreview(): void {
    if (this.wizardOcupado) return;
    if (this.preview) {
      this.descartarPreviewBackend(this.preview, true);
      return;
    }
    this.resetWizardPreview();
  }

  private descartarPreviewBackend(pv: ExtractoPreview, notificar = false): void {
    this.previewDescartando = true;
    this.extractoService.descartarPreview(
      this.idEmpresa,
      pv.idTesoreriaExtractoImport,
      this.idUsuario
    ).subscribe({
      next: () => {
        if (notificar) this.toast('Vista previa descartada.', 'medium');
        this.previewDescartando = false;
        this.resetWizardPreview();
      },
      error: () => {
        // Se limpia igualmente en el cliente; la vista previa nunca se confirmó.
        if (notificar) this.toast('No se pudo descartar en el servidor, se limpió localmente.', 'warning');
        this.previewDescartando = false;
        this.resetWizardPreview();
      }
    });
  }

  private resetWizardPreview(): void {
    this.previewArchivoSel = null;
    this.preview = null;
    this.previewAnalizando = false;
    this.previewConfirmando = false;
  }

  /** Normaliza fechas a yyyy-MM-dd para los inputs date del grid. */
  private normalizarPreview(pv: ExtractoPreview): ExtractoPreview {
    const soloFecha = (v?: string) => (v ? v.split('T')[0] : v);
    return {
      ...pv,
      adapter: pv.adapter || pv.adapterUsado,
      periodoDesde: soloFecha(pv.periodoDesde),
      periodoHasta: soloFecha(pv.periodoHasta),
      warnings: pv.warnings || [],
      lineas: (pv.lineas || []).map(l => ({
        ...l,
        fechaMovimiento: soloFecha(l.fechaMovimiento) || '',
        debito: Number(l.debito) || 0,
        credito: Number(l.credito) || 0
      }))
    };
  }

  ejecutarMatching(): void {
    if (!this.workspace) return;
    this.cargando = true;
    this.conciliacionService.matching({
      idTesoreriaConciliacion: this.workspace.conciliacion.idTesoreriaConciliacion,
      idEmpresa: this.idEmpresa,
      idUsuario: this.idUsuario
    }).subscribe({
      next: ws => {
        this.aplicarWorkspace(ws);
        this.toast('Matching actualizado.', 'success');
        this.cargando = false;
      },
      error: err => {
        this.toast(err?.error?.message || 'Error en matching.', 'danger');
        this.cargando = false;
      }
    });
  }

  async abrirAcciones(linea: ConciliacionLineaBanco): Promise<void> {
    if (!this.esEditable()) return;

    const buttons: any[] = [];

    if (linea.esCandidatoReclasificacion || linea.accionRecomendada === 'RECLASIFICAR_PAGO') {
      buttons.push({
        text: 'Reclasificar pago (Caja → Banco)',
        handler: () => this.abrirReclasificarPago(linea)
      });
    }

    if (linea.estadoMatch === 'SUGERIDO' && linea.idMovimientoFinanciero
        && !linea.esCandidatoReclasificacion) {
      buttons.push({
        text: 'Confirmar sugerencia',
        handler: () => this.resolver(linea, 'ASOCIAR', linea.idMovimientoFinanciero)
      });
    }
    buttons.push({
      text: 'Buscar / asociar en libro',
      handler: () => this.abrirAsociar(linea)
    });

    if ((linea.clasificacionLinea === 'BANCARIO_PURO' || linea.clasificacionLinea === 'DESCONOCIDO')
        && !linea.esCandidatoReclasificacion) {
      if (linea.debito > 0) {
        buttons.push({
          text: 'Crear gasto',
          handler: () => this.crearBancario(linea, 'CREAR_GASTO')
        });
      } else {
        buttons.push({
          text: 'Crear ingreso',
          handler: () => this.crearBancario(linea, 'CREAR_INGRESO')
        });
      }
      buttons.push({
        text: 'Registrar ajuste bancario',
        handler: () => this.crearBancario(linea, 'CREAR_AJUSTE')
      });
    }

    if (['CONFIRMADO', 'AUTO_CONCILIADO', 'NUEVO_MOV', 'SUGERIDO'].includes(linea.estadoMatch)
        && linea.accionTomada !== 'RECLASIFICAR_PAGO') {
      buttons.push({
        text: 'Deshacer',
        role: 'destructive',
        handler: () => this.deshacer(linea)
      });
    }

    buttons.push({ text: 'Cancelar', role: 'cancel' });

    const sheet = await this.actionSheetCtrl.create({
      header: linea.descripcion || linea.referencia || 'Línea bancaria',
      subHeader: linea.instruccionUsuario || undefined,
      buttons
    });
    await sheet.present();
  }

  aplicarRecomendada(linea: ConciliacionLineaBanco): void {
    const accion = (linea.accionRecomendada || 'ASOCIAR') as AccionExtractoPendiente;
    if (accion === 'RECLASIFICAR_PAGO' || linea.esCandidatoReclasificacion) {
      this.abrirReclasificarPago(linea);
      return;
    }
    if (accion === 'ASOCIAR') {
      if (linea.idMovimientoFinanciero) {
        this.resolver(linea, 'ASOCIAR', linea.idMovimientoFinanciero);
      } else {
        this.abrirAsociar(linea);
      }
      return;
    }
    if (linea.clasificacionLinea === 'OPERATIVO') {
      this.toast(linea.instruccionUsuario || 'Asocie el movimiento operativo existente.', 'warning');
      this.abrirAsociar(linea);
      return;
    }
    this.crearBancario(linea, accion);
  }

  async abrirReclasificarPago(linea: ConciliacionLineaBanco): Promise<void> {
    if (!linea.idMovimientoFinanciero) {
      this.toast('Seleccione primero el cobro en otra cuenta (abrir asociar con otras cuentas).', 'warning');
      this.abrirAsociarCruzado(linea);
      return;
    }

    const evidencias = (linea.evidenciasReclasificacion || []).map(e => `• ${e}`).join('<br>');
    const tratamiento = linea.tratamientoPrevisto === 'ANTES_CIERRE'
      ? 'La caja aún está abierta: el cierre usará la forma de pago efectiva.'
      : 'La caja/período histórico se conserva; se registrará una reclasificación posterior auditada.';

    const alert = await this.alertCtrl.create({
      header: 'Reclasificar pago',
      message:
        `<strong>Banco:</strong> ${linea.credito?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} · ${linea.descripcion || ''}`
        + `<br><strong>ERP:</strong> ${linea.nombreCuentaOrigenSugerida || 'otra cuenta'}`
        + (linea.metodoPagoOriginalSugerido ? ` · ${linea.metodoPagoOriginalSugerido}` : '')
        + (linea.numeroDocumentoSugerido ? `<br>Factura ${linea.numeroDocumentoSugerido}` : '')
        + (linea.clienteSugerido ? ` · ${linea.clienteSugerido}` : '')
        + `<br><strong>Confianza:</strong> ${linea.confianzaReclasificacion || '—'}`
        + (evidencias ? `<br><br>${evidencias}` : '')
        + `<br><br>${tratamiento}`
        + `<br><br>Impacto: sale de Caja / entra a Banco. No se crea un ingreso nuevo ni se altera el e-CF.`,
      inputs: [
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Motivo de la corrección (obligatorio)',
          attributes: { maxlength: 500 }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar reclasificación',
          handler: data => {
            if (!data.motivo?.trim() || data.motivo.trim().length < 5) {
              this.toast('Indique un motivo (mín. 5 caracteres).', 'warning');
              return false;
            }
            this.resolver(
              linea,
              'RECLASIFICAR_PAGO',
              linea.idMovimientoFinanciero,
              undefined,
              data.motivo.trim()
            );
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  abrirAsociarCruzado(linea: ConciliacionLineaBanco): void {
    this.lineaAsociar = linea;
    this.busquedaCandidatos = '';
    this.buscarCandidatos(true);
  }

  lineaSeleccionable(linea: ConciliacionLineaBanco): boolean {
    return esSeleccionableMasivo(linea.estadoMatch);
  }

  lineaSeleccionada(linea: ConciliacionLineaBanco): boolean {
    return this.lineasSeleccionadas.has(linea.idTesoreriaExtractoLinea);
  }

  alternarSeleccion(linea: ConciliacionLineaBanco, seleccionada: boolean): void {
    if (!this.lineaSeleccionable(linea)) return;
    if (seleccionada) {
      this.lineasSeleccionadas.add(linea.idTesoreriaExtractoLinea);
    } else {
      this.lineasSeleccionadas.delete(linea.idTesoreriaExtractoLinea);
    }
  }

  alternarTodasVisibles(seleccionadas: boolean): void {
    this.lineasSeleccionablesVisibles.forEach(linea => {
      if (seleccionadas) {
        this.lineasSeleccionadas.add(linea.idTesoreriaExtractoLinea);
      } else {
        this.lineasSeleccionadas.delete(linea.idTesoreriaExtractoLinea);
      }
    });
  }

  async conciliarSeleccionadas(): Promise<void> {
    if (!this.workspace || this.cargando || this.lineasSeleccionadas.size === 0) return;

    const seleccionadas = this.workspace.lineasBanco.filter(linea =>
      this.lineasSeleccionadas.has(linea.idTesoreriaExtractoLinea)
      && this.lineaSeleccionable(linea)
    );
    const ejecutables = seleccionadas
      .map(linea => ({ linea, accion: this.accionMasivaPara(linea) }))
      .filter(item => item.accion != null) as Array<{
        linea: ConciliacionLineaBanco;
        accion: AccionExtractoPendiente;
      }>;
    const requierenRevision = seleccionadas.length - ejecutables.length;

    const alert = await this.alertCtrl.create({
      header: 'Conciliar selección',
      message:
        `Se procesarán <strong>${ejecutables.length}</strong> línea(s) con su acción recomendada.`
        + (requierenRevision
          ? `<br><br><strong>${requierenRevision}</strong> requieren asociación o revisión manual y no serán modificadas.`
          : '')
        + '<br><br>Esta operación puede crear movimientos bancarios reales.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: `Conciliar ${ejecutables.length}`,
          role: 'confirm',
          handler: () => {
            if (ejecutables.length) this.ejecutarConciliacionMasiva(ejecutables);
          }
        }
      ]
    });
    await alert.present();
  }

  private accionMasivaPara(linea: ConciliacionLineaBanco): AccionExtractoPendiente | null {
    const recomendada = (linea.accionRecomendada || '') as AccionExtractoPendiente;
    // Nunca ejecutar reclasificaciones en masa: requieren confirmación y motivo.
    if (recomendada === 'RECLASIFICAR_PAGO' || linea.esCandidatoReclasificacion) return null;
    if (recomendada === 'ASOCIAR') {
      return linea.idMovimientoFinanciero ? 'ASOCIAR' : null;
    }
    if (linea.clasificacionLinea === 'OPERATIVO') return null;
    return ['CREAR_GASTO', 'CREAR_INGRESO', 'CREAR_AJUSTE', 'IGNORAR'].includes(recomendada)
      ? recomendada
      : null;
  }

  private ejecutarConciliacionMasiva(
    items: Array<{ linea: ConciliacionLineaBanco; accion: AccionExtractoPendiente }>
  ): void {
    if (!this.workspace) return;
    const idConciliacion = this.workspace.conciliacion.idTesoreriaConciliacion;
    this.cargando = true;

    // Secuencial para respetar saldos, auditoría e idempotencia.
    from(items).pipe(
      concatMap(item => this.conciliacionService.resolverLinea({
        idTesoreriaConciliacion: idConciliacion,
        idTesoreriaExtractoLinea: item.linea.idTesoreriaExtractoLinea,
        idEmpresa: this.idEmpresa,
        idUsuario: this.idUsuario,
        accion: item.accion,
        idMovimientoFinanciero: item.accion === 'ASOCIAR'
          ? item.linea.idMovimientoFinanciero
          : undefined,
        categoria: item.linea.categoriaSugerida,
        motivo: item.linea.descripcion || item.linea.referencia || 'Movimiento bancario'
      }).pipe(
        map(() => ({ ok: true, linea: item.linea, error: '' })),
        catchError(err => of({
          ok: false,
          linea: item.linea,
          error: err?.error?.message || 'No se pudo resolver.'
        }))
      )),
      toArray()
    ).subscribe(resultados => {
      const exitosas = resultados.filter(r => r.ok);
      const fallidas = resultados.filter(r => !r.ok);
      exitosas.forEach(r => this.lineasSeleccionadas.delete(r.linea.idTesoreriaExtractoLinea));

      if (fallidas.length) {
        const detalle = fallidas.slice(0, 3)
          .map(r => `${r.linea.descripcion || r.linea.referencia}: ${r.error}`)
          .join(' · ');
        this.toast(
          `${exitosas.length} conciliada(s); ${fallidas.length} pendiente(s). ${detalle}`,
          'warning'
        );
      } else {
        this.toast(`${exitosas.length} línea(s) conciliadas correctamente.`, 'success');
      }
      this.refrescarWorkspace(false);
    });
  }

  async crearBancario(linea: ConciliacionLineaBanco, accion: AccionExtractoPendiente): Promise<void> {
    const esIngreso = accion === 'CREAR_INGRESO';
    const esAjuste = accion === 'CREAR_AJUSTE';
    const alert = await this.alertCtrl.create({
      header: esIngreso
        ? 'Crear ingreso'
        : esAjuste
          ? 'Ajuste bancario'
          : 'Crear gasto',
      message: esAjuste
        ? (linea.instruccionUsuario || 'Registra solo el movimiento de tesorería (ajuste puro).')
        : (linea.instruccionUsuario
          || 'Se registrará en el módulo correspondiente, Tesorería y Contabilidad (si está activa). Origen: Conciliación Bancaria.'),
      inputs: [
        {
          name: 'motivo',
          type: 'text',
          value: linea.descripcion || linea.categoriaSugerida || '',
          placeholder: esIngreso ? 'Descripción / categoría del ingreso' : esAjuste ? 'Motivo del ajuste' : 'Tipo / detalle del gasto'
        },
        {
          name: 'categoria',
          type: 'text',
          value: linea.categoriaSugerida || (esIngreso ? 'INTERES_BANCARIO' : 'COMISION_BANCARIA'),
          placeholder: esAjuste ? 'Categoría bancaria' : 'Clasificación sugerida (opcional)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: esAjuste ? 'Registrar y conciliar' : (esIngreso ? 'Crear ingreso' : 'Crear gasto'),
          handler: data => {
            if (!data.motivo?.trim()) {
              this.toast('Indique el motivo o descripción.', 'warning');
              return false;
            }
            this.resolver(linea, accion, undefined, data.categoria?.trim(), data.motivo.trim());
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  abrirAsociar(linea: ConciliacionLineaBanco): void {
    this.lineaAsociar = linea;
    this.busquedaCandidatos = '';
    this.buscarCandidatos(!!linea.esCandidatoReclasificacion);
  }

  buscarCandidatos(incluirOtrasCuentas = false): void {
    if (!this.workspace || !this.lineaAsociar) return;
    this.conciliacionService.buscarCandidatos({
      idTesoreriaConciliacion: this.workspace.conciliacion.idTesoreriaConciliacion,
      idTesoreriaExtractoLinea: this.lineaAsociar.idTesoreriaExtractoLinea,
      idEmpresa: this.idEmpresa,
      search: this.busquedaCandidatos || undefined,
      monto: Math.abs(this.lineaAsociar.montoNeto) || undefined,
      top: 40,
      incluirOtrasCuentas: incluirOtrasCuentas || !!this.lineaAsociar.esCandidatoReclasificacion
    }).subscribe({
      next: resp => this.candidatos = resp || [],
      error: err => this.toast(err?.error?.message || 'Error al buscar candidatos.', 'danger')
    });
  }

  asociarCandidato(mov: MovimientoFinancieroListado): void {
    if (!this.lineaAsociar) return;
    if (this.lineaAsociar.esCandidatoReclasificacion
        || this.lineaAsociar.accionRecomendada === 'RECLASIFICAR_PAGO') {
      const linea = { ...this.lineaAsociar, idMovimientoFinanciero: mov.idMovimientoFinanciero };
      this.lineaAsociar = null;
      this.candidatos = [];
      this.abrirReclasificarPago(linea);
      return;
    }
    this.resolver(this.lineaAsociar, 'ASOCIAR', mov.idMovimientoFinanciero);
    this.lineaAsociar = null;
    this.candidatos = [];
  }

  deshacer(linea: ConciliacionLineaBanco): void {
    if (!this.workspace || this.cargando) return;
    this.cargando = true;
    this.conciliacionService.deshacerMatch({
      idTesoreriaConciliacion: this.workspace.conciliacion.idTesoreriaConciliacion,
      idTesoreriaExtractoLinea: linea.idTesoreriaExtractoLinea,
      idEmpresa: this.idEmpresa,
      idUsuario: this.idUsuario,
      motivo: 'Deshecho desde centro de trabajo'
    }).subscribe({
      next: () => {
        this.toast('Match deshecho.', 'success');
        this.refrescarWorkspace();
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo deshacer.', 'danger');
        this.cargando = false;
      }
    });
  }

  private resolver(
    linea: ConciliacionLineaBanco,
    accion: AccionExtractoPendiente,
    idMovimiento?: number,
    categoria?: string,
    motivo?: string
  ): void {
    if (!this.workspace || this.cargando) return;
    this.cargando = true;
    this.conciliacionService.resolverLinea({
      idTesoreriaConciliacion: this.workspace.conciliacion.idTesoreriaConciliacion,
      idTesoreriaExtractoLinea: linea.idTesoreriaExtractoLinea,
      idEmpresa: this.idEmpresa,
      idUsuario: this.idUsuario,
      accion,
      idMovimientoFinanciero: idMovimiento,
      categoria,
      motivo
    }).subscribe({
      next: () => {
        this.toast('Línea actualizada.', 'success');
        this.refrescarWorkspace();
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo resolver.', 'danger');
        this.cargando = false;
      }
    });
  }

  etiquetaAccion(linea: ConciliacionLineaBanco): string {
    const accion = (linea.accionRecomendada || '').toString();
    if (accion === 'RECLASIFICAR_PAGO' || linea.esCandidatoReclasificacion) return 'Reclasificar pago';
    if (accion === 'ASOCIAR' && linea.idMovimientoFinanciero) return 'Confirmar';
    if (accion === 'ASOCIAR') return 'Asociar';
    if (accion === 'CREAR_INGRESO') return 'Crear ingreso';
    if (accion === 'CREAR_AJUSTE') return 'Registrar ajuste';
    if (accion === 'CREAR_GASTO') return 'Crear gasto';
    if (linea.clasificacionLinea === 'OPERATIVO') return 'Asociar';
    return 'Revisar';
  }

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      SUGERIDO: 'Sugerido',
      AMBIGUO: 'Ambiguo',
      DUPLICADO: 'Posible duplicado',
      DIFERENCIA: 'Diferencia',
      CONFIRMADO: 'Confirmado',
      AUTO_CONCILIADO: 'Auto-conciliado',
      NUEVO_MOV: 'Movimiento creado',
      IGNORADO: 'Ignorado',
      RESUELTO: 'Resuelto',
      EN_PROCESO: 'En proceso',
      BORRADOR: 'Borrador',
      CERRADA: 'Cerrada',
      ANULADA: 'Anulada'
    };
    return map[estado] || estado;
  }

  etiquetaClasificacion(clasificacion?: string): string {
    if (clasificacion === 'BANCARIO_PURO') return 'Bancario';
    if (clasificacion === 'OPERATIVO') return 'Operativo';
    if (clasificacion === 'DESCONOCIDO') return 'Por clasificar';
    return clasificacion || '';
  }

  cerrar(): void {
    if (!this.workspace) return;
    if (!this.puedeCerrarUi) {
      this.toast(this.motivoNoCerrarUi || 'Aún no se puede cerrar.', 'warning');
      return;
    }
    if (this.cargando) return;

    this.alertCtrl.create({
      header: 'Cerrar conciliación',
      message: 'El expediente quedará inmutable. ¿Confirma el cierre?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar',
          handler: () => this.ejecutarCierre()
        }
      ]
    }).then(a => a.present());
  }

  private ejecutarCierre(): void {
    if (!this.workspace) return;
    this.cargando = true;
    this.conciliacionService.cerrar(
      this.idEmpresa,
      this.workspace.conciliacion.idTesoreriaConciliacion,
      this.idUsuario
    ).subscribe({
      next: () => {
        this.toast('Conciliación cerrada.', 'success');
        this.cargarHistorial();
        this.refrescarWorkspace();
      },
      error: err => {
        this.toast(err?.error?.message || 'No se pudo cerrar.', 'danger');
        this.cargando = false;
      }
    });
  }

  async reabrir(): Promise<void> {
    if (!this.workspace) return;
    const alert = await this.alertCtrl.create({
      header: 'Reabrir conciliación',
      inputs: [{ name: 'motivo', type: 'textarea', placeholder: 'Motivo obligatorio' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Reabrir',
          handler: data => {
            if (!data.motivo?.trim()) {
              this.toast('Indique el motivo.', 'warning');
              return false;
            }
            this.conciliacionService.reabrir({
              idTesoreriaConciliacion: this.workspace!.conciliacion.idTesoreriaConciliacion,
              idEmpresa: this.idEmpresa,
              idUsuario: this.idUsuario,
              motivo: data.motivo.trim()
            }).subscribe({
              next: () => {
                this.toast('Conciliación reabierta.', 'success');
                this.refrescarWorkspace();
                this.cargarHistorial();
              },
              error: err => this.toast(err?.error?.message || 'Error al reabrir.', 'danger')
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  esEditable(): boolean {
    return puedeEditarSesion(this.workspace);
  }

  colorEstado(estado: string): string {
    if (estado === 'CERRADA') return 'success';
    if (estado === 'EN_PROCESO') return 'warning';
    return 'medium';
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2800, color });
    await t.present();
  }
}
