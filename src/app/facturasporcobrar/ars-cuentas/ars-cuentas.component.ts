import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, ViewWillEnter } from '@ionic/angular';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ArsAseguradoraService } from 'src/app/servicios/ars-aseguradora.service';
import { ArsPagoModalComponent } from '../ars-pago-modal/ars-pago-modal.component';
import {
  ArsAntiguedad,
  ArsAseguradora,
  ArsCuentaPorCobrar,
  ArsDocumentoCxC,
  ArsPagoHistorial,
  ArsVentasResumen
} from 'src/app/models/ars-aseguradora';
import { pdfFecha, pdfMoneda } from 'src/app/shared/pdf/pdfmake-core';
import { emitirReporteTabla } from 'src/app/shared/pdf/reporte-tabla-pdf';

@Component({
  selector: 'app-ars-cuentas',
  templateUrl: './ars-cuentas.component.html',
  styleUrls: ['./ars-cuentas.component.scss'],
})
export class ArsCuentasComponent implements OnInit, ViewWillEnter {
  vista: 'documentos' | 'resumen' | 'antiguedad' | 'ventas' = 'documentos';
  cargando = false;
  arsList: ArsAseguradora[] = [];
  cuentas: ArsCuentaPorCobrar[] = [];
  documentos: ArsDocumentoCxC[] = [];
  antiguedad: ArsAntiguedad[] = [];
  ventas: ArsVentasResumen[] = [];
  historial: ArsPagoHistorial[] = [];

  idArs = 0;
  estado = '';
  fechaDesde = '';
  fechaHasta = '';
  filtro = '';
  facturaHistorial = 0;
  seleccionadas = new Set<number>();
  seleccionTick = 0;
  procesandoLote = false;
  exportandoPdf = false;

  constructor(
    private ars: ArsAseguradoraService,
    private parametro: ParametrosService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  ionViewWillEnter(): void {
    this.cargar();
  }

  get idEmpresa(): number {
    return this.parametro.GetIdEmpresa();
  }

  get documentosFiltrados(): ArsDocumentoCxC[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.documentos;
    return this.documentos.filter(d =>
      [d.numeroDocumento, d.ncf, d.nombreArs, d.nombreCliente, String(d.idFacturaHeader)]
        .some(v => (v || '').toLowerCase().includes(q))
    );
  }

  get totalPendiente(): number {
    return this.documentosFiltrados.reduce((s, d) => s + Number(d.pendienteArs || 0), 0);
  }

  get totalCobertura(): number {
    return this.documentosFiltrados.reduce((s, d) => s + Number(d.montoCubiertoArs || 0), 0);
  }

  get totalPagado(): number {
    return this.documentosFiltrados.reduce((s, d) => s + Number(d.pagadoArs || 0), 0);
  }

  get puedeExportar(): boolean {
    if (this.vista === 'documentos') return this.documentosFiltrados.length > 0;
    if (this.vista === 'resumen') return this.cuentas.length > 0;
    if (this.vista === 'antiguedad') return this.antiguedad.length > 0;
    return this.ventas.length > 0;
  }

  get documentosPendientes(): ArsDocumentoCxC[] {
    return this.documentosFiltrados.filter(d => Number(d.pendienteArs) > 0.009);
  }

  get documentosSeleccionados(): ArsDocumentoCxC[] {
    return this.documentos.filter(d => this.seleccionadas.has(d.idFacturaHeader));
  }

  get cantidadSeleccionada(): number {
    return this.seleccionadas.size;
  }

  get totalSeleccionPendiente(): number {
    return this.documentosSeleccionados.reduce((s, d) => s + Number(d.pendienteArs || 0), 0);
  }

  get arsSeleccionId(): number | null {
    const list = this.documentosSeleccionados;
    if (!list.length) return null;
    return Number(list[0].idArs) || null;
  }

  get todasVisiblesSeleccionadas(): boolean {
    const candidatas = this.candidatasSeleccion();
    return candidatas.length > 0 && candidatas.every(d => this.seleccionadas.has(d.idFacturaHeader));
  }

  estaSeleccionada(f: ArsDocumentoCxC): boolean {
    return this.seleccionadas.has(f.idFacturaHeader);
  }

  checkboxKey(f: ArsDocumentoCxC): string {
    return `${f.idFacturaHeader}-${this.seleccionadas.has(f.idFacturaHeader)}-${this.seleccionTick}`;
  }

  private candidatasSeleccion(): ArsDocumentoCxC[] {
    const pendientes = this.documentosPendientes;
    const arsId = this.arsSeleccionId ?? (this.idArs || null);
    if (arsId) return pendientes.filter(d => Number(d.idArs) === Number(arsId));
    return pendientes;
  }

  private syncSeleccion(rechazar = false): void {
    this.seleccionadas = new Set(this.seleccionadas);
    if (rechazar) this.seleccionTick++;
  }

  private podarSeleccion(): void {
    const ids = new Set(this.documentosPendientes.map(d => d.idFacturaHeader));
    for (const id of Array.from(this.seleccionadas)) {
      if (!ids.has(id)) this.seleccionadas.delete(id);
    }
    this.syncSeleccion();
  }

  async onSeleccionChange(f: ArsDocumentoCxC, ev: Event): Promise<void> {
    const checked = !!((ev as CustomEvent)?.detail?.checked);
    const id = f.idFacturaHeader;

    if (!checked) {
      this.seleccionadas.delete(id);
      this.syncSeleccion();
      return;
    }

    if (Number(f.pendienteArs) <= 0.009) {
      this.toast('Esta factura ARS ya está saldada', 'warning');
      this.syncSeleccion(true);
      return;
    }

    if (this.seleccionadas.size > 0) {
      const actual = this.arsSeleccionId;
      if (actual != null && actual !== Number(f.idArs)) {
        this.toast('Solo puede cotejar facturas de la misma ARS', 'warning');
        this.syncSeleccion(true);
        return;
      }
    }

    this.seleccionadas.add(id);
    this.syncSeleccion();
  }

  toggleSeleccionarTodas(): void {
    if (this.todasVisiblesSeleccionadas) {
      this.seleccionadas.clear();
      this.syncSeleccion();
      return;
    }

    const pendientes = this.documentosPendientes;
    if (!pendientes.length) {
      this.toast('No hay facturas pendientes en el filtro', 'warning');
      return;
    }

    const arsIds = [...new Set(pendientes.map(d => Number(d.idArs)))];
    let arsId = this.arsSeleccionId ?? (this.idArs || null);
    if (!arsId) {
      if (arsIds.length > 1) {
        this.toast('Filtre por una ARS o seleccione facturas de la misma aseguradora', 'warning');
        return;
      }
      arsId = arsIds[0];
    }

    this.seleccionadas.clear();
    pendientes
      .filter(d => Number(d.idArs) === Number(arsId))
      .forEach(d => this.seleccionadas.add(d.idFacturaHeader));
    this.syncSeleccion();
  }

  limpiarSeleccion(): void {
    this.seleccionadas.clear();
    this.syncSeleccion();
  }

  cargarCatalogos() {
    this.ars.listar(this.idEmpresa, false).subscribe({
      next: (rows) => this.arsList = (rows || []).map(this.normalizarArs),
      error: () => this.toast('Error cargando ARS', 'danger')
    });
  }

  cargar(event?: any) {
    this.cargando = true;
    const extras: Record<string, string | number> = {};
    if (this.idArs) extras['idArs'] = this.idArs;
    if (this.estado) extras['estado'] = this.estado;
    if (this.fechaDesde) extras['fechaDesde'] = this.fechaDesde;
    if (this.fechaHasta) extras['fechaHasta'] = this.fechaHasta;

    const terminar = () => {
      this.cargando = false;
      const refresher = event?.target as { complete?: () => void } | undefined;
      refresher?.complete?.();
    };

    this.ars.documentos(this.idEmpresa, extras).subscribe({
      next: (docs) => {
        this.documentos = docs || [];
        this.podarSeleccion();
        terminar();
      },
      error: () => {
        terminar();
        this.toast('Error cargando documentos ARS', 'danger');
      }
    });

    this.ars.cuentasPorCobrar(this.idEmpresa, extras).subscribe({
      next: (rows) => this.cuentas = rows || []
    });
    this.ars.antiguedad(this.idEmpresa, this.idArs).subscribe({
      next: (rows) => this.antiguedad = rows || []
    });
    this.ars.ventas(this.idEmpresa, extras).subscribe({
      next: (rows) => this.ventas = rows || []
    });
  }

  verHistorial(doc: ArsDocumentoCxC) {
    this.facturaHistorial = doc.idFacturaHeader;
    this.ars.pagos(this.idEmpresa, doc.idFacturaHeader, doc.idArs).subscribe({
      next: (rows) => this.historial = rows || [],
      error: () => this.toast('Error cargando historial', 'danger')
    });
  }

  async cobrar(doc: ArsDocumentoCxC) {
    if (Number(doc.pendienteArs) <= 0.009) {
      this.toast('Esta cuenta ARS ya está saldada', 'warning');
      return;
    }
    await this.abrirModalPago([doc]);
  }

  async cotejarSeleccionadas(): Promise<void> {
    const seleccion = this.documentosSeleccionados.filter(d => Number(d.pendienteArs) > 0.009);
    if (!seleccion.length) {
      this.toast('Seleccione al menos una factura pendiente', 'warning');
      return;
    }

    const arsIds = [...new Set(seleccion.map(d => Number(d.idArs)))];
    if (arsIds.length > 1) {
      this.toast('Solo puede cotejar facturas de la misma ARS', 'warning');
      return;
    }

    await this.abrirModalPago(seleccion);
  }

  private async abrirModalPago(documentos: ArsDocumentoCxC[]): Promise<void> {
    this.procesandoLote = true;
    const modal = await this.modalCtrl.create({
      component: ArsPagoModalComponent,
      cssClass: 'modal-factura-full',
      componentProps: {
        documentos,
        idEmpresa: this.idEmpresa,
        idUsuario: this.parametro.IdUsuario
      }
    });
    modal.onDidDismiss().then((res) => {
      this.procesandoLote = false;
      if (res.data?.actualizado) {
        this.limpiarSeleccion();
        this.toast(res.data.message || 'Cobro ARS registrado', 'success');
        this.cargar();
      }
    });
    await modal.present();
  }

  private normalizarArs = (raw: any): ArsAseguradora => {
    const p = new ArsAseguradora();
    p.idArs = Number(raw?.idArs ?? raw?.IdArs ?? 0);
    p.nombre = String(raw?.nombre ?? raw?.Nombre ?? '');
    p.activo = raw?.activo ?? raw?.Activo ?? true;
    return p;
  };

  private async toast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }

  exportarPdf(): void {
    if (!this.puedeExportar) {
      void this.toast('No hay datos para exportar', 'warning');
      return;
    }

    this.exportandoPdf = true;
    try {
      if (this.vista === 'documentos') this.pdfDocumentos();
      else if (this.vista === 'resumen') this.pdfResumen();
      else if (this.vista === 'antiguedad') this.pdfAntiguedad();
      else this.pdfVentas();
    } catch {
      void this.toast('No se pudo generar el PDF', 'danger');
    } finally {
      this.exportandoPdf = false;
    }
  }

  private etiquetaFiltros(): string {
    const ars = this.arsList.find(a => Number(a.idArs) === Number(this.idArs))?.nombre;
    const partes = [
      ars || 'Todas las ARS',
      this.estado || 'Todos los estados'
    ];
    if (this.fechaDesde) partes.push(`Desde ${pdfFecha(this.fechaDesde)}`);
    if (this.fechaHasta) partes.push(`Hasta ${pdfFecha(this.fechaHasta)}`);
    if (this.filtro.trim()) partes.push(`Buscar: ${this.filtro.trim()}`);
    return partes.join(' · ');
  }

  private pdfDocumentos(): void {
    const rows = this.documentosFiltrados;
    emitirReporteTabla({
      titulo: 'Cuentas por cobrar ARS',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: this.etiquetaFiltros(),
      landscape: true,
      kpis: [
        { label: 'Documentos', value: String(rows.length) },
        { label: 'Cobertura', value: pdfMoneda(this.totalCobertura) },
        { label: 'Pagado', value: pdfMoneda(this.totalPagado) },
        { label: 'Pendiente ARS', value: pdfMoneda(this.totalPendiente) }
      ],
      secciones: [{
        columnas: [
          { header: 'Documento', width: 72 },
          { header: 'Fecha', width: 58 },
          { header: 'ARS', width: 90 },
          { header: 'Cliente', width: '*' },
          { header: 'Estado', width: 58 },
          { header: 'Cobertura', width: 70, align: 'right' },
          { header: 'Pagado', width: 70, align: 'right' },
          { header: 'Pendiente', width: 70, align: 'right' }
        ],
        filas: rows.map(d => [
          d.numeroDocumento || `FACT-${d.idFacturaHeader}`,
          pdfFecha(d.fecha),
          d.nombreArs,
          d.nombreCliente || '—',
          d.estadoArs || 'Pendiente',
          pdfMoneda(d.montoCubiertoArs),
          pdfMoneda(d.pagadoArs),
          pdfMoneda(d.pendienteArs)
        ]),
        filaTotales: [
          'Totales',
          '',
          '',
          '',
          '',
          pdfMoneda(this.totalCobertura),
          pdfMoneda(this.totalPagado),
          pdfMoneda(this.totalPendiente)
        ]
      }],
      nombreArchivo: `CxC-ARS-documentos.pdf`
    });
  }

  private pdfResumen(): void {
    emitirReporteTabla({
      titulo: 'Cuentas por cobrar ARS · Por aseguradora',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: this.etiquetaFiltros(),
      kpis: [
        { label: 'ARS', value: String(this.cuentas.length) },
        { label: 'Pendiente', value: pdfMoneda(this.cuentas.reduce((s, c) => s + Number(c.totalPendiente || 0), 0)) }
      ],
      secciones: [{
        columnas: [
          { header: 'ARS', width: '*' },
          { header: 'Docs', width: 40, align: 'right' },
          { header: 'Original', width: 80, align: 'right' },
          { header: 'Pagado', width: 80, align: 'right' },
          { header: 'Pendiente', width: 80, align: 'right' }
        ],
        filas: this.cuentas.map(c => [
          c.nombreArs,
          c.documentos,
          pdfMoneda(c.totalOriginal),
          pdfMoneda(c.totalPagado),
          pdfMoneda(c.totalPendiente)
        ]),
        filaTotales: [
          'Totales',
          this.cuentas.reduce((s, c) => s + Number(c.documentos || 0), 0),
          pdfMoneda(this.cuentas.reduce((s, c) => s + Number(c.totalOriginal || 0), 0)),
          pdfMoneda(this.cuentas.reduce((s, c) => s + Number(c.totalPagado || 0), 0)),
          pdfMoneda(this.cuentas.reduce((s, c) => s + Number(c.totalPendiente || 0), 0))
        ]
      }],
      nombreArchivo: `CxC-ARS-resumen.pdf`
    });
  }

  private pdfAntiguedad(): void {
    emitirReporteTabla({
      titulo: 'Cuentas por cobrar ARS · Antigüedad',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: this.etiquetaFiltros(),
      landscape: true,
      kpis: [
        { label: 'Pendiente', value: pdfMoneda(this.antiguedad.reduce((s, a) => s + Number(a.totalPendiente || 0), 0)) }
      ],
      secciones: [{
        columnas: [
          { header: 'ARS', width: '*' },
          { header: '0-30', width: 70, align: 'right' },
          { header: '31-60', width: 70, align: 'right' },
          { header: '61-90', width: 70, align: 'right' },
          { header: '+90', width: 70, align: 'right' },
          { header: 'Total', width: 80, align: 'right' }
        ],
        filas: this.antiguedad.map(a => [
          a.nombreArs,
          pdfMoneda(a.dias0A30),
          pdfMoneda(a.dias31A60),
          pdfMoneda(a.dias61A90),
          pdfMoneda(a.diasMas90),
          pdfMoneda(a.totalPendiente)
        ]),
        filaTotales: [
          'Totales',
          pdfMoneda(this.antiguedad.reduce((s, a) => s + Number(a.dias0A30 || 0), 0)),
          pdfMoneda(this.antiguedad.reduce((s, a) => s + Number(a.dias31A60 || 0), 0)),
          pdfMoneda(this.antiguedad.reduce((s, a) => s + Number(a.dias61A90 || 0), 0)),
          pdfMoneda(this.antiguedad.reduce((s, a) => s + Number(a.diasMas90 || 0), 0)),
          pdfMoneda(this.antiguedad.reduce((s, a) => s + Number(a.totalPendiente || 0), 0))
        ]
      }],
      nombreArchivo: `CxC-ARS-antiguedad.pdf`
    });
  }

  private pdfVentas(): void {
    emitirReporteTabla({
      titulo: 'Cuentas por cobrar ARS · Ventas',
      empresa: this.parametro.NombreEmpresa,
      subtitulo: this.etiquetaFiltros(),
      landscape: true,
      kpis: [
        { label: 'Ventas', value: String(this.ventas.reduce((s, v) => s + Number(v.documentos || 0), 0)) },
        { label: 'Pendiente ARS', value: pdfMoneda(this.ventas.reduce((s, v) => s + Number(v.pendienteArs || 0), 0)) }
      ],
      secciones: [{
        columnas: [
          { header: 'ARS', width: '*' },
          { header: 'Docs', width: 40, align: 'right' },
          { header: 'Ventas', width: 72, align: 'right' },
          { header: 'Cobertura', width: 72, align: 'right' },
          { header: 'Cliente', width: 72, align: 'right' },
          { header: 'Pendiente', width: 72, align: 'right' }
        ],
        filas: this.ventas.map(v => [
          v.nombreArs,
          v.documentos,
          pdfMoneda(v.totalVentas),
          pdfMoneda(v.coberturaArs),
          pdfMoneda(v.pagadoPaciente),
          pdfMoneda(v.pendienteArs)
        ]),
        filaTotales: [
          'Totales',
          this.ventas.reduce((s, v) => s + Number(v.documentos || 0), 0),
          pdfMoneda(this.ventas.reduce((s, v) => s + Number(v.totalVentas || 0), 0)),
          pdfMoneda(this.ventas.reduce((s, v) => s + Number(v.coberturaArs || 0), 0)),
          pdfMoneda(this.ventas.reduce((s, v) => s + Number(v.pagadoPaciente || 0), 0)),
          pdfMoneda(this.ventas.reduce((s, v) => s + Number(v.pendienteArs || 0), 0))
        ]
      }],
      nombreArchivo: `CxC-ARS-ventas.pdf`
    });
  }
}
