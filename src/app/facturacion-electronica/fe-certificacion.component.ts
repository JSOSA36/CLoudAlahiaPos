import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EmpresaAdminListItem, EmpresaAdminService } from 'src/app/servicios/empresa-admin.service';

@Component({
  selector: 'app-fe-certificacion',
  templateUrl: './fe-certificacion.component.html',
  styleUrls: ['./fe-certificacion.component.scss'],
})
export class FeCertificacionComponent implements OnInit {
  lab: any = null;
  cargando = false;
  guardando = false;
  subiendo = false;
  reiniciando = false;
  enviandoId = 0;
  enviandoRfce = false;
  enviandoTodo = false;
  enviandoTodoEncf = '';
  private cancelarEnviarTodo = false;
  consultandoId = 0;
  simulando = false;
  excelFile: File | null = null;
  excelInput: HTMLInputElement | null = null;
  certArchivo: File | null = null;
  certPassword = '';
  guardandoCert = false;
  postulacionXml: File | null = null;
  xmlFirmado: Blob | null = null;
  xmlFirmadoNombre = '';
  firmandoXml = false;
  empresas: EmpresaAdminListItem[] = [];
  idEmpresaLab = 0;
  pasoSel = 1;
  private reanudarPaso = true;
  private readonly keyEmpresaLab = 'certecf.idEmpresaLab';
  logDgii: { idCaso: number; encf: string; estado: string; hora: string; texto: string }[] = [];
  logActivo: { idCaso: number; encf: string; estado: string; hora: string; texto: string } | null = null;
  generandoRi = false;
  generandoRiEncf = '';
  generandoRiIdx = 0;
  generandoRiTotal = 0;
  riRevisadas = false;
  private riEstado: Record<string, string> = {};
  private riMensaje: Record<string, string> = {};

  constructor(
    private fe: FacturacionElectronicaService,
    public parametro: ParametrosService,
    private empresasAdmin: EmpresaAdminService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    const saved = Number(sessionStorage.getItem(this.keyEmpresaLab) || 0);
    this.idEmpresaLab = saved || 0;
    void this.iniciarLab();
  }

  private async iniciarLab(): Promise<void> {
    await this.cargarEmpresas();
    if (this.idEmpresaLab && !this.empresas.some(e => e.idEmpresa === this.idEmpresaLab))
      this.idEmpresaLab = 0;
    if (!this.idEmpresaLab) {
      const sena = this.empresas.find(e => /sena/i.test(e.nombreComercial || ''));
      this.idEmpresaLab = sena?.idEmpresa || this.empresas[0]?.idEmpresa || this.parametro.IdEmpresa || this.parametro.GetIdEmpresa();
    }
    if (this.idEmpresaLab)
      sessionStorage.setItem(this.keyEmpresaLab, String(this.idEmpresaLab));
    await this.cargar();
  }

  get idEmpresa(): number {
    return this.idEmpresaLab || this.parametro.IdEmpresa || this.parametro.GetIdEmpresa();
  }

  get paso(): any {
    return (this.lab?.pasos || []).find((p: any) => p.numero === this.pasoSel)
      || this.lab?.pasos?.[0]
      || null;
  }

  get hechos(): number {
    return (this.lab?.pasos || []).filter((p: any) => this.esHecho(p.estado)).length;
  }

  get progresoPct(): number {
    const total = this.lab?.pasos?.length || 15;
    return total ? Math.round((this.hechos / total) * 100) : 0;
  }

  async cargarEmpresas(): Promise<void> {
    try {
      const raw = await firstValueFrom(this.empresasAdmin.listado()) || [];
      this.empresas = raw
        .map((e: any) => ({
          ...e,
          idEmpresa: Number(e.idEmpresa ?? e.IdEmpresa ?? 0),
          nombreComercial: e.nombreComercial || e.NombreComercial || '',
          rnc: e.rnc || e.RNC || e.Rnc || ''
        }))
        .filter((e: EmpresaAdminListItem) => e.idEmpresa > 0)
        .sort((a, b) => (a.nombreComercial || '').localeCompare(b.nombreComercial || '', 'es'));
    } catch {
      this.empresas = [];
    }
  }

  idDeEmpresa(e: any): number {
    return Number(e?.idEmpresa ?? e?.IdEmpresa ?? 0);
  }

  etiquetaEmpresa(e: any): string {
    return e?.nombreComercial || e?.NombreComercial || 'Empresa';
  }

  onEmpresaLab(id: number | string): void {
    const siguiente = Number(id) || 0;
    if (!siguiente || siguiente === this.idEmpresaLab) return;
    this.idEmpresaLab = siguiente;
    sessionStorage.setItem(this.keyEmpresaLab, String(siguiente));
    this.logDgii = [];
    this.logActivo = null;
    this.certArchivo = null;
    this.certPassword = '';
    this.postulacionXml = null;
    this.xmlFirmado = null;
    this.xmlFirmadoNombre = '';
    this.reanudarPaso = true;
    void this.cargar();
  }

  seleccionarPaso(n: number): void {
    this.pasoSel = n;
  }

  private pasoDondeSeguir(lab: any): number {
    const actual = Number(lab?.pasoActual || lab?.PasoActual) || 1;
    const pasos = lab?.pasos || lab?.Pasos || [];
    const sim = lab?.sesionSimulacion || lab?.SesionSimulacion;
    const p5 = pasos.find((p: any) => Number(p.numero ?? p.Numero) === 5);
    const p5Hecho = this.esHecho(p5?.estado || p5?.Estado);
    if (sim && !p5Hecho) return 5;
    if (actual > 1) return actual;
    let last = 1;
    for (const p of pasos) {
      const n = Number(p.numero ?? p.Numero);
      const est = p.estado || p.Estado;
      if (est && est !== 'Pendiente' && n > last) last = n;
    }
    return last;
  }

  async cargar(silencioso = false): Promise<void> {
    if (!this.idEmpresa) {
      await this.toast('Inicie sesión en la empresa a certificar.', 'warning');
      return;
    }
    if (!silencioso) this.cargando = true;
    try {
      this.lab = await firstValueFrom(this.fe.getCertecfEstado(this.idEmpresa));
      if (this.idEmpresa) sessionStorage.setItem(this.keyEmpresaLab, String(this.idEmpresa));
      const actual = this.pasoDondeSeguir(this.lab);
      if (this.reanudarPaso || (this.pasoSel === 1 && actual > 1)) {
        this.pasoSel = actual;
        this.reanudarPaso = false;
      } else if (!this.pasoSel || this.pasoSel < 1) {
        this.pasoSel = actual;
      }
      this.reconstruirLogDgii();
      if (!silencioso) {
        this.riEstado = {};
        this.riMensaje = {};
      }
    } catch (err: any) {
      if (!silencioso) this.lab = null;
      await this.toast(this.msg(err, 'No se pudo cargar el laboratorio CerteCF.'), 'danger');
    } finally {
      if (!silencioso) this.cargando = false;
    }
  }

  async guardarPostulacion(): Promise<void> {
    if (!this.lab?.postulacion) return;
    this.guardando = true;
    try {
      this.lab = await firstValueFrom(
        this.fe.guardarCertecfPostulacion(this.idEmpresa, this.lab.postulacion)
      );
      await this.toast('URLs listas para pegar en el portal.', 'success');
    } catch (err: any) {
      await this.toast(this.msg(err, 'No se pudo guardar la postulación.'), 'danger');
    } finally {
      this.guardando = false;
    }
  }

  onCertFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.certArchivo = input.files?.[0] || null;
  }

  async guardarCertificado(): Promise<void> {
    if (!this.certArchivo) {
      await this.toast('Seleccione el archivo .p12 o .pfx del contribuyente.', 'warning');
      return;
    }
    if (!this.certPassword.trim()) {
      await this.toast('Indique la contraseña del certificado.', 'warning');
      return;
    }
    this.guardandoCert = true;
    try {
      await firstValueFrom(this.fe.uploadCertificado(
        this.idEmpresa,
        this.certArchivo,
        this.certPassword.trim(),
        'CERTECF'
      ));
      this.certArchivo = null;
      this.certPassword = '';
      await this.cargar(true);
      await this.toast('Certificado digital guardado para esta empresa.', 'success');
    } catch (err: any) {
      await this.toast(this.msg(err, 'No se pudo guardar el certificado.'), 'danger');
    } finally {
      this.guardandoCert = false;
    }
  }

  onPostulacionXml(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.postulacionXml = input.files?.[0] || null;
    this.xmlFirmado = null;
    this.xmlFirmadoNombre = '';
  }

  async firmarPostulacion(): Promise<void> {
    if (!this.lab?.certificadoOk || this.lab?.certificadoVencido) {
      await this.toast('Primero cargue el certificado digital y su contraseña.', 'warning');
      return;
    }
    if (!this.postulacionXml) {
      await this.toast('Suba el XML que genera el portal (GENERAR ARCHIVO).', 'warning');
      return;
    }
    this.firmandoXml = true;
    try {
      const blob = await firstValueFrom(
        this.fe.firmarCertecfPostulacion(this.idEmpresa, this.postulacionXml)
      );
      const errTxt = await this.leerErrorBlob(blob);
      if (errTxt) {
        await this.toast(errTxt, 'danger');
        this.pushLog({
          idCaso: -1,
          encf: 'Postulación',
          estado: 'Error',
          hora: this.ahora(),
          texto: `[${this.ahora()}] Firma de postulación\nEstado   : Error\nMensaje  : ${errTxt}`,
        });
        return;
      }
      const nombre = this.postulacionXml.name.replace(/\.xml$/i, '') + '-firmado.xml';
      this.xmlFirmado = blob;
      this.xmlFirmadoNombre = nombre;
      this.bajarBlob(blob, nombre);
      this.pushLog({
        idCaso: -1,
        encf: 'Postulación',
        estado: 'Firmado',
        hora: this.ahora(),
        texto: [
          `[${this.ahora()}] XML de postulación firmado`,
          `Archivo  : ${nombre}`,
          'Siguiente: en DGII ENVIAR ARCHIVO. Luego en Alahia: Hecho en el portal.',
        ].join('\n'),
      });
      await this.cargar(true);
      await this.toast('XML firmado. En DGII pulse ENVIAR ARCHIVO. Luego aquí: Hecho en el portal.', 'success');
    } catch (err: any) {
      const txt = await this.msgBlob(err, 'No se pudo firmar el XML de postulación.');
      this.pushLog({
        idCaso: -1,
        encf: 'Postulación',
        estado: 'Error',
        hora: this.ahora(),
        texto: `[${this.ahora()}] Firma de postulación\nEstado   : Error\nMensaje  : ${txt}`,
      });
      await this.toast(txt, 'danger');
    } finally {
      this.firmandoXml = false;
    }
  }

  hostPortal(url: string | null | undefined, sufijo: string): string {
    let u = String(url || '').trim().replace(/^https?:\/\//i, '');
    const i = u.toLowerCase().indexOf(sufijo.toLowerCase());
    if (i >= 0) u = u.slice(0, i);
    return u.replace(/\/$/, '');
  }

  async marcarPaso(paso: number, estado = 'Hecho'): Promise<void> {
    try {
      this.lab = await firstValueFrom(
        this.fe.marcarCertecfPaso(this.idEmpresa, paso, estado)
      );
      await this.toast(`Paso ${paso}: ${estado}.`, 'success');
    } catch (err: any) {
      await this.toast(this.msg(err, 'No se pudo actualizar el paso.'), 'danger');
    }
  }

  onExcel(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.excelInput = input;
    this.excelFile = input.files?.[0] || null;
  }

  async subirExcel(): Promise<void> {
    if (!this.excelFile) {
      await this.toast('Seleccione el Excel descargado de CerteCF.', 'warning');
      return;
    }
    this.subiendo = true;
    try {
      await firstValueFrom(
        this.fe.uploadCertecfExcel(this.idEmpresa, this.excelFile, this.parametro.IdUsuario)
      );
      this.excelFile = null;
      if (this.excelInput) this.excelInput.value = '';
      await this.cargar();
      await this.toast(
        'Excel cargado desde cero. El siguiente a enviar es el primer E31. Un rechazo en DGII obliga a repetir todo el set.',
        'success'
      );
    } catch (err: any) {
      await this.toast(this.msg(err, 'No se pudo cargar el Excel.'), 'danger');
    } finally {
      this.subiendo = false;
    }
  }

  async reiniciarSet(): Promise<void> {
    this.reiniciando = true;
    try {
      await firstValueFrom(this.fe.reiniciarCertecfSet(this.idEmpresa));
      await this.cargar();
      await this.toast(
        'Set en cero. Cargue el Excel de CerteCF y envíe desde el primer E31. DGII no guarda lo anterior.',
        'warning'
      );
    } catch (err: any) {
      await this.toast(this.msg(err, 'No se pudo reiniciar el set.'), 'danger');
    } finally {
      this.reiniciando = false;
    }
  }

  async enviarCaso(idCaso: number, silencioso = false): Promise<boolean> {
    this.enviandoId = idCaso;
    try {
      const sesion = await firstValueFrom(this.fe.enviarCertecfCaso(this.idEmpresa, idCaso));
      this.capturarRespuesta(sesion, idCaso);
      await this.cargar(true);
      return true;
    } catch (err: any) {
      this.pushLog({
        idCaso,
        encf: this.encfDe(idCaso),
        estado: 'Error',
        hora: this.ahora(),
        texto: this.msg(err, 'Error al enviar el caso.'),
      });
      if (!silencioso) await this.toast(this.msg(err, 'Error al enviar el caso.'), 'danger');
      return false;
    } finally {
      this.enviandoId = 0;
    }
  }

  async consultarCaso(idCaso: number, silencioso = false): Promise<boolean> {
    this.consultandoId = idCaso;
    try {
      const sesion = await firstValueFrom(this.fe.consultarCertecfCaso(this.idEmpresa, idCaso));
      this.capturarRespuesta(sesion, idCaso);
      await this.cargar(true);
      return true;
    } catch (err: any) {
      this.pushLog({
        idCaso,
        encf: this.encfDe(idCaso),
        estado: 'Error',
        hora: this.ahora(),
        texto: this.msg(err, 'Error al consultar el caso.'),
      });
      if (!silencioso) await this.toast(this.msg(err, 'Error al consultar el caso.'), 'danger');
      return false;
    } finally {
      this.consultandoId = 0;
    }
  }

  async enviarOleada(sesion: any): Promise<void> {
    await this.enviarSiguiente(sesion);
  }

  async enviarSiguiente(sesion: any): Promise<void> {
    const actual = this.casoActual(sesion);
    if (!actual) {
      await this.toast('No hay comprobante pendiente en esta oleada.', 'success');
      return;
    }
    if (this.esEnProceso(actual.estado)) {
      await this.toast(`${actual.encf} está en proceso en DGII. Consulte el TrackId; no envíe el siguiente.`, 'warning');
      return;
    }
    if (this.esHechoCaso(actual)) {
      await this.toast(`${actual.encf} ya está aceptado.`, 'success');
      return;
    }
    await this.enviarCaso(actual.idCaso);
  }

  async consultarOleada(sesion: any): Promise<void> {
    await this.consultarActual(sesion);
  }

  async consultarActual(sesion: any): Promise<void> {
    const actual = this.casoActual(sesion);
    if (!actual?.trackId) {
      await this.toast('El comprobante actual no tiene TrackId. Envíelo primero.', 'warning');
      return;
    }
    await this.consultarCaso(actual.idCaso);
  }

  casoActual(sesion: any): any | null {
    const casos: any[] = sesion?.casos || [];
    const pendientes = casos.filter((c: any) => !this.esHechoCaso(c));
    if (!pendientes.length) return null;
    const enProceso = pendientes.find((c: any) => this.esEnProceso(c.estado));
    if (enProceso) return enProceso;
    pendientes.sort((a: any, b: any) =>
      (this.prioridadEnvio(a) - this.prioridadEnvio(b)) || (Number(a.orden) - Number(b.orden)));
    let actual = pendientes[0];
    const seen = new Set<number>();
    while (actual) {
      if (seen.has(actual.idCaso)) break;
      seen.add(actual.idCaso);
      const ncfMod = this.claveEncf(actual.ncfModificado);
      if (!ncfMod) break;
      const dep = casos.find((c: any) => c.idCaso !== actual.idCaso && this.claveEncf(c.encf) === ncfMod);
      if (!dep || this.esHechoCaso(dep)) break;
      actual = dep;
    }
    return actual;
  }

  private prioridadEnvio(c: any): number {
    const t = Number(c.tipoEcf);
    const m = Number(c.montoTotal) || 0;
    if (t === 31) return 1;
    if (t === 32 && m >= 250000) return 2;
    if (t === 33 || t === 34) return 3;
    if (t === 32) return 5;
    return 4;
  }

  private claveEncf(v: string | null | undefined): string {
    return (v || '').trim().toUpperCase().replace(/[-\s]/g, '');
  }

  puedeEnviarActual(sesion: any): boolean {
    if (this.enviandoTodo) return false;
    const c = this.casoActual(sesion);
    return !!c && !this.esHechoCaso(c) && !this.esEnProceso(c.estado);
  }

  puedeEnviarTodo(sesion: any): boolean {
    if (this.enviandoTodo || this.enviandoId || this.enviandoRfce || this.consultandoId) return false;
    const casos: any[] = this.sesionActualizada(sesion)?.casos || sesion?.casos || [];
    return casos.some((c: any) => !this.esHechoCaso(c) || this.esEnProceso(c.estado));
  }

  etiquetaEnviarTodo(sesion: any): string {
    if (this.enviandoTodo) {
      const n = this.conteoAceptados(this.sesionActualizada(sesion) || sesion);
      const t = (this.sesionActualizada(sesion)?.casos || sesion?.casos || []).length;
      return this.enviandoTodoEncf
        ? `Enviando ${this.enviandoTodoEncf} · ${n}/${t}`
        : `Enviando… ${n}/${t}`;
    }
    return 'Enviar todo';
  }

  detenerEnviarTodo(): void {
    this.cancelarEnviarTodo = true;
  }

  async enviarTodo(sesion: any): Promise<void> {
    if (this.enviandoTodo || !this.puedeEnviarTodo(sesion)) return;
    this.enviandoTodo = true;
    this.cancelarEnviarTodo = false;
    this.enviandoTodoEncf = '';
    try {
      while (!this.cancelarEnviarTodo) {
        const actualSesion = this.sesionActualizada(sesion) || sesion;
        const actual = this.casoActual(actualSesion);
        if (!actual) break;

        this.enviandoTodoEncf = actual.encf || '';
        const id = Number(actual.idCaso);

        if (this.esEnProceso(actual.estado)) {
          const espera = await this.esperarResultadoDgii(id, actualSesion);
          if (espera !== 'ok') {
            await this.avisarParadaEnviarTodo(actualSesion, id, espera);
            return;
          }
          continue;
        }

        const enviado = await this.enviarCaso(id, true);
        if (!enviado) {
          await this.toast(
            `Falló el envío de ${actual.encf}. Enviar todo se detuvo; no se manda el siguiente.`,
            'danger'
          );
          return;
        }

        const despues = this.casoPorId(id, actualSesion);
        if (!despues) {
          await this.toast(`No se pudo leer el resultado de ${actual.encf}. Se detuvo Enviar todo.`, 'danger');
          return;
        }
        if (this.esEnProceso(despues.estado)) {
          const espera = await this.esperarResultadoDgii(id, actualSesion);
          if (espera !== 'ok') {
            await this.avisarParadaEnviarTodo(this.sesionActualizada(sesion) || actualSesion, id, espera);
            return;
          }
          continue;
        }
        const corte = this.motivoParadaEnviarTodo(despues);
        if (corte) {
          const color = this.esRechazo(despues.estado) ? 'danger' : 'warning';
          await this.toast(corte, color);
          return;
        }
      }

      if (this.cancelarEnviarTodo) {
        await this.toast('Enviar todo detenido. El siguiente queda pendiente.', 'warning');
        return;
      }
      const fin = this.sesionActualizada(sesion) || sesion;
      const rfceOk = this.aceptadosRfce(fin) >= this.totalRfce(fin) && this.totalRfce(fin) > 0;
      await this.toast(
        rfceOk
          ? `Set enviado. Los XML íntegros están en ${this.rutaXmlConsumo()} para Browse + ENVIAR en DGII.`
          : 'No quedan comprobantes pendientes de envío.',
        'success'
      );
    } finally {
      this.enviandoTodo = false;
      this.enviandoTodoEncf = '';
      this.cancelarEnviarTodo = false;
    }
  }

  private sesionActualizada(sesion: any): any | null {
    const lab = this.lab;
    if (!lab) return sesion || null;
    const tipo = String(sesion?.tipoSet || sesion?.TipoSet || '').toUpperCase();
    if (tipo.includes('SIMUL') && lab.sesionSimulacion) return lab.sesionSimulacion;
    if (tipo === 'ACECF' && lab.sesionAcecf) return lab.sesionAcecf;
    if ((tipo === 'DATOS' || tipo === 'ECF' || !tipo) && lab.sesionActiva) return lab.sesionActiva;
    const id = Number(sesion?.idSesion);
    if (id && lab.sesionSimulacion && Number(lab.sesionSimulacion.idSesion) === id && sesion?.casos?.some((c: any) => (c.tipoPrueba || c.TipoPrueba) === 'SIMULACION'))
      return lab.sesionSimulacion;
    return sesion || lab.sesionSimulacion || lab.sesionAcecf || lab.sesionActiva || null;
  }

  private conteoAceptados(sesion: any): number {
    return (sesion?.casos || []).filter((c: any) => this.esHechoCaso(c)).length;
  }

  private casoPorId(idCaso: number, sesion?: any): any | null {
    const pools = [
      this.sesionActualizada(sesion)?.casos,
      this.lab?.sesionActiva?.casos,
      this.lab?.sesionAcecf?.casos,
      this.lab?.sesionSimulacion?.casos,
    ];
    for (const casos of pools) {
      const hit = (casos || []).find((c: any) => Number(c.idCaso) === idCaso);
      if (hit) return hit;
    }
    return null;
  }

  private motivoParadaEnviarTodo(c: any): string | null {
    if (this.esHecho(c?.estado)) {
      if (this.esSecuenciaConsumida(c?.mensaje)) {
        return `${c.encf}: DGII dice secuencia ya utilizada. Eso no sube el 0/21. DESCARGAR COMPROBANTES y cargue el Excel nuevo.`;
      }
      return null;
    }
    if (this.esRechazo(c?.estado)) {
      return `${c.encf} rechazado. DGII reinicia el set; Enviar todo se detuvo. Corrija este e-NCF y no mande el siguiente.`;
    }
    if (this.esSecuenciaConsumida(c?.mensaje)) {
      return `${c.encf}: secuencia ya utilizada. El marcador de DGII no avanza con el mismo e-NCF.`;
    }
    return `${c.encf} no quedó Aceptado (${c?.estado || 'sin estado'}). Enviar todo se detuvo.`;
  }

  private async avisarParadaEnviarTodo(sesion: any, idCaso: number, espera: 'bad' | 'secuencia' | 'wait' | 'stop' | 'cancel'): Promise<void> {
    const c = this.casoPorId(idCaso, sesion) || this.casoActual(sesion);
    const encf = c?.encf || this.enviandoTodoEncf || String(idCaso);
    if (espera === 'cancel') {
      await this.toast('Enviar todo detenido.', 'warning');
      return;
    }
    if (espera === 'wait') {
      await this.toast(
        `DGII sigue validando ${encf}. Pulse Consultar TrackId o Enviar todo otra vez; no se envió el siguiente.`,
        'warning'
      );
      return;
    }
    const corte = c ? this.motivoParadaEnviarTodo(c) : `Se detuvo en ${encf}.`;
    await this.toast(corte || `Se detuvo en ${encf}.`, espera === 'bad' ? 'danger' : 'warning');
  }

  private async esperarResultadoDgii(idCaso: number, sesion?: any): Promise<'ok' | 'bad' | 'secuencia' | 'wait' | 'stop' | 'cancel'> {
    for (let i = 0; i < 48; i++) {
      if (this.cancelarEnviarTodo) return 'cancel';
      await this.dormir(2500);
      if (this.cancelarEnviarTodo) return 'cancel';
      const ok = await this.consultarCaso(idCaso, true);
      if (!ok) continue;
      const c = this.casoPorId(idCaso, sesion);
      if (!c) return 'stop';
      if (this.esHecho(c.estado)) {
        return this.esSecuenciaConsumida(c.mensaje) ? 'secuencia' : 'ok';
      }
      if (this.esRechazo(c.estado)) return 'bad';
      if (this.esSecuenciaConsumida(c.mensaje)) return 'secuencia';
      if (!this.esEnProceso(c.estado)) return 'stop';
    }
    return 'wait';
  }

  private dormir(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  puedeConsultarActual(sesion: any): boolean {
    const c = this.casoActual(sesion);
    return !!c?.trackId;
  }

  etiquetaEnviarActual(sesion: any): string {
    const c = this.casoActual(sesion);
    if (!c) return 'Sin pendientes';
    if (this.esEnProceso(c.estado)) return `Esperando DGII · ${c.encf}`;
    if (c.estado === 'Rechazado' || c.estado === 'Error') return `Reenviar ${c.encf}`;
    return `Enviar ${c.encf}`;
  }

  esEnProceso(estado: string): boolean {
    const e = (estado || '').toLowerCase();
    return e === 'enproceso' || e === 'enviado' || e === 'enviando';
  }

  etiquetaEstado(estado: string): string {
    if (this.esEnProceso(estado)) return 'En proceso (DGII valida)';
    return estado || '';
  }


  async generarSimulacion(): Promise<void> {
    this.simulando = true;
    try {
      await firstValueFrom(this.fe.generarCertecfSimulacion(this.idEmpresa));
      await this.cargar();
      await this.toast('Simulación generada. Envíe los casos.', 'success');
    } catch (err: any) {
      await this.toast(this.msg(err, 'No se pudo generar la simulación.'), 'danger');
    } finally {
      this.simulando = false;
    }
  }

  descargar(path: string, nombre?: string): void {
    this.fe.descargarCertecfArchivo(path).subscribe({
      next: (blob) => {
        const type = (blob?.type || '').toLowerCase();
        if (type.includes('json') || type.includes('text/plain')) {
          void this.msgBlob({ error: blob }, 'No se pudo descargar.').then(m => this.toast(m, 'danger'));
          return;
        }
        this.bajarBlob(blob, nombre || (path.split('/').filter(Boolean).join('-') + '.xml'));
      },
      error: (err) => void this.msgBlob(err, 'No se pudo descargar.').then(m => this.toast(m, 'danger')),
    });
  }

  descargarRi(idCaso: number, encf?: string): void {
    this.descargar(`ri/${this.idEmpresa}/${idCaso}`, `RI-${encf || idCaso}.pdf`);
  }

  async generarLoteRi(): Promise<void> {
    const slots = this.slotsRi().filter(s => s.caso);
    if (!slots.length) {
      await this.toast('No hay e-CF de simulación para armar RI.', 'warning');
      return;
    }
    this.generandoRi = true;
    this.generandoRiIdx = 0;
    this.generandoRiTotal = slots.length;
    this.generandoRiEncf = '';
    const reset: Record<string, string> = {};
    const msgs: Record<string, string> = {};
    for (const s of this.slotsRi()) {
      reset[s.clave] = s.caso ? 'Pendiente' : 'Error';
      msgs[s.clave] = s.caso ? '' : 'Sin e-CF de simulación';
    }
    this.riEstado = reset;
    this.riMensaje = msgs;
    try {
      this.generandoRiEncf = 'Armando las 11 representaciones impresas';
      const lote = await firstValueFrom(this.fe.generarCertecfRiLote(this.idEmpresa));
      await this.cargar(true);
      const generados = lote?.slots || lote?.Slots || [];
      const porClave = new Map<string, any>();
      const porEncf = new Map<string, any>();
      for (const g of generados) {
        const clave = this.claveRiNorm(g.clave || g.Clave);
        if (clave) porClave.set(clave, g);
        const encf = String(g.encf || g.Encf || '').toUpperCase();
        if (encf) porEncf.set(encf, g);
      }
      let ok = 0;
      for (const s of slots) {
        this.generandoRiIdx++;
        this.generandoRiEncf = s.caso.encf || s.etiqueta;
        const hit = porClave.get(this.claveRiNorm(s.clave))
          || porEncf.get(String(s.caso.encf || s.caso.Encf || '').toUpperCase());
        const listo = !!(hit?.qrListo || hit?.QrListo) && this.qrRiValido(s);
        const msgApi = hit?.mensaje || hit?.Mensaje || '';
        if (listo) {
          s.caso.qrListo = true;
          s.caso.QrListo = true;
          this.riEstado = { ...this.riEstado, [s.clave]: 'Para revisar' };
          this.riMensaje = { ...this.riMensaje, [s.clave]: msgApi || 'PDF listo (mismo formato RI).' };
          ok++;
        } else {
          const aceptado = this.esHechoCaso(s.caso);
          this.riEstado = { ...this.riEstado, [s.clave]: aceptado ? 'Sin QR' : 'Error' };
          this.riMensaje = {
            ...this.riMensaje,
            [s.clave]: msgApi || (aceptado
              ? 'DGII Aceptó este e-CF, pero no quedó el QR de ese envío. No se fabrica uno falso.'
              : 'No hay RI para este recuadro.')
          };
        }
      }
      this.riRevisadas = false;
      await this.toast(
        ok
          ? `${ok}/11 RI en el escritorio (CerteCF-SUBIR-RI). Paso 5 no reenvía a DGII.`
          : 'No se pudo armar ninguna RI. Paso 5 no reenvía a DGII.',
        ok === slots.length ? 'success' : 'warning'
      );
    } catch (err: any) {
      await this.cargar(true);
      await this.toast(await this.msgBlob(err, 'No se pudieron generar los 11 PDF.'), 'danger');
    } finally {
      this.generandoRi = false;
      this.generandoRiEncf = '';
      this.generandoRiIdx = 0;
    }
  }

  estadoRi(s: { clave: string; qrListo: boolean; caso: any }): string {
    if (this.esRechazo(s.caso?.estado) || this.esFaseInvalida(s.caso)) return 'Rechazado';
    if (this.qrRiValido(s)) return 'Para revisar';
    const e = this.riEstado[s.clave];
    if (e === 'Para revisar') return this.esHechoCaso(s.caso) ? 'Sin QR' : 'Error';
    if (e && e !== 'Pendiente') return e;
    if (this.esHechoCaso(s.caso)) return 'Sin QR';
    return s.caso ? 'Pendiente' : 'Error';
  }

  mensajeRi(s: { clave: string; qrListo: boolean; caso: any }): string {
    if (this.qrRiValido(s)) {
      const mOk = this.riMensaje[s.clave];
      return mOk || 'PDF listo. Revíselo antes de subir.';
    }
    const m = this.riMensaje[s.clave];
    if (m && !/ri lista|pdf listo/i.test(m)) return m;
    if (!s.caso) return 'Sin e-CF de simulación';
    const msg = s.caso.mensaje || s.caso.Mensaje || '';
    if (this.esRechazo(s.caso.estado) || this.esFaseInvalida(s.caso))
      return msg || 'DGII rechazó este e-CF.';
    if (this.esSecuenciaConsumida(msg))
      return 'ConsultaTimbre lo tiene Rechazado o duplicado. No subir.';
    if (this.esHecho(s.caso.estado) || this.esHechoCaso(s.caso))
      return 'Sin QR del envío aceptado. Puede ver el PDF, pero no lo suba.';
    return msg;
  }

  private qrRiValido(s?: { qrListo?: boolean; caso?: any } | null): boolean {
    const c = s?.caso;
    if (!c || this.esRechazo(c.estado) || this.esFaseInvalida(c)) return false;
    if (!this.esHecho(c.estado) && !this.esHechoCaso(c)) return false;
    if (this.esSecuenciaConsumida(c.mensaje || c.Mensaje)) return false;
    const qr = String(c.urlQR || c.UrlQR || '');
    return /^https?:\/\//i.test(qr);
  }

  private esFaseInvalida(c: any): boolean {
    const t = `${c?.mensaje || ''} ${c?.Mensaje || ''} ${c?.respuestaDgii || ''}`.toLowerCase();
    return t.includes('fase válid') || t.includes('fase valid') || t.includes('omitido');
  }

  hayRiGeneradas(): boolean {
    return this.slotsRi().some(s => {
      const e = this.estadoRi(s);
      return e === 'Para revisar' || e === 'Enviado';
    });
  }

  badgeRi(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e === 'enviado' || e === 'generado' || e === 'aceptado' || e === 'para revisar') return 'success';
    if (e === 'error' || e === 'fallido' || e === 'rechazado') return 'danger';
    if (e === 'enviando' || e === 'generando' || e === 'sin qr') return 'warning';
    return 'medium';
  }

  rutaRi(): string {
    return this.lab?.rutaRi
      || this.lab?.RutaRi
      || 'C:\\Users\\USUARIO\\Desktop\\CerteCF-SUBIR-RI';
  }

  private claveRiNorm(raw: string): string {
    return String(raw || '').toLowerCase().replace(/^tipo-/, '').trim();
  }

  slotsRi(): { clave: string; etiqueta: string; caso: any; qrListo: boolean }[] {
    const casos = this.lab?.sesionSimulacion?.casos || this.lab?.SesionSimulacion?.casos || [];
    const pick = (pred: (c: any) => boolean) => {
      const hits = casos.filter(pred);
      return hits.find((c: any) => this.esHechoCaso(c) && !this.esRechazo(c.estado) && !this.esFaseInvalida(c))
        || hits.find((c: any) => !this.esRechazo(c.estado) && !this.esFaseInvalida(c))
        || hits[0]
        || null;
    };
    const slot = (clave: string, etiqueta: string, pred: (c: any) => boolean) => {
      const caso = pick(pred);
      return {
        clave,
        etiqueta,
        caso,
        qrListo: !!(caso?.qrListo || caso?.QrListo || caso?.urlQR || caso?.UrlQR)
      };
    };
    return [
      slot('tipo-31', 'Tipo 31', c => Number(c.tipoEcf) === 31 && String(c.encf || '').toUpperCase() !== 'E310000000009'),
      slot('tipo-32-250mil', 'Tipo 32 ≥ RD$250 mil', c => Number(c.tipoEcf) === 32 && Number(c.montoTotal) >= 250000),
      slot('tipo-33', 'Tipo 33', c => Number(c.tipoEcf) === 33),
      slot('tipo-34', 'Tipo 34', c => Number(c.tipoEcf) === 34),
      slot('tipo-41', 'Tipo 41', c => Number(c.tipoEcf) === 41),
      slot('tipo-43', 'Tipo 43', c => Number(c.tipoEcf) === 43),
      slot('tipo-44', 'Tipo 44', c => Number(c.tipoEcf) === 44),
      slot('tipo-45', 'Tipo 45', c => Number(c.tipoEcf) === 45),
      slot('tipo-46', 'Tipo 46', c => Number(c.tipoEcf) === 46),
      slot('tipo-47', 'Tipo 47', c => Number(c.tipoEcf) === 47),
      slot('tipo-32-consumo', 'Tipo 32 < RD$250 mil', c => Number(c.tipoEcf) === 32 && Number(c.montoTotal) < 250000),
    ];
  }

  casosOleada(sesion: any): any[] {
    const casos = sesion?.casos || [];
    if (!casos.length) return [];
    const pendientes = casos.filter((c: any) => /^(pendiente|error)$/i.test(c.estado || ''));
    const oleada = pendientes.length
      ? Math.min(...pendientes.map((c: any) => Number(c.oleada) || 1))
      : Math.max(...casos.map((c: any) => Number(c.oleada) || 1));
    return casos.filter((c: any) => (Number(c.oleada) || 1) === oleada);
  }

  oleadaActual(sesion: any): number {
    const casos = this.casosOleada(sesion);
    return Number(casos[0]?.oleada) || 1;
  }

  etiquetaOleada(sesion: any): string {
    const actual = this.casoActual(sesion);
    const t = Number(actual?.tipoEcf);
    if (t === 31 || (t === 32 && Number(actual?.montoTotal) >= 250000))
      return 'Indicador: E31 y E32 primero';
    if (t === 33 || t === 34) return 'Notas E33/E34 (después del e-NCF modificado)';
    if (t === 32) return 'RFCE: E32 < 250 mil';
    if (t) return 'Resto e-CF (E41–E47)';
    const n = this.oleadaActual(sesion);
    if (n === 2) return 'E32 ≥ 250 mil (e-CF)';
    if (n === 3) return 'E32 < 250 mil (RFCE)';
    return 'E31 y E32 primero';
  }

  canalCaso(c: any): string {
    if (Number(c.tipoEcf) === 32 && Number(c.montoTotal) < 250000) return 'RFCE';
    return 'e-CF';
  }

  esRfce(c: any): boolean {
    return Number(c.tipoEcf) === 32 && Number(c.montoTotal) < 250000;
  }

  totalEcf(sesion: any): number {
    return (sesion?.casos || []).filter((c: any) => !this.esRfce(c)).length;
  }

  aceptadosEcf(sesion: any): number {
    return (sesion?.casos || []).filter((c: any) => !this.esRfce(c) && this.esHechoCaso(c)).length;
  }

  totalRfce(sesion: any): number {
    return (sesion?.casos || []).filter((c: any) => this.esRfce(c)).length;
  }

  aceptadosRfce(sesion: any): number {
    return (sesion?.casos || []).filter((c: any) => this.esRfce(c) && this.esHechoCaso(c)).length;
  }

  casosRfce(sesion: any): any[] {
    return (sesion?.casos || []).filter((c: any) => this.esRfce(c));
  }

  rutaXmlConsumo(): string {
    return this.lab?.rutaXmlConsumo250
      || this.lab?.RutaXmlConsumo250
      || 'C:\\Users\\USUARIO\\Desktop\\CerteCF-SUBIR-consumo-250mil';
  }

  nombreXmlConsumo(c: any): string {
    let rnc = this.soloDigitos(c?.rncEmisor || c?.RncEmisor);
    if (!rnc || /^0+$/.test(rnc)) rnc = this.soloDigitos(this.lab?.rnc);
    if (!rnc || /^0+$/.test(rnc)) return `${c?.encf || ''}.xml`;
    return `${rnc}${c?.encf || ''}.xml`;
  }

  private soloDigitos(v: string | null | undefined): string {
    return String(v || '').replace(/\D/g, '');
  }

  bloqueoConsumo250(sesion: any): string {
    const rfce = this.casosRfce(sesion);
    if (!rfce.length) return '';
    if (this.aceptadosRfce(sesion) >= this.totalRfce(sesion)) return '';
    const otros = (sesion?.casos || []).filter((c: any) => !this.esRfce(c) && !this.esHechoCaso(c));
    if (otros.length) {
      const n = otros[0];
      return `Primero ${n.encf} (E${n.tipoEcf}). El consumo < 250 mil va al final, por RecepcionFC.`;
    }
    const enProc = rfce.find((c: any) => this.esEnProceso(c.estado));
    if (enProc) return `${enProc.encf} está en proceso en DGII. Consulte el TrackId.`;
    return '';
  }

  puedeEnviarConsumo250(sesion: any): boolean {
    if (this.enviandoId || this.enviandoRfce || this.enviandoTodo) return false;
    const pend = this.casosRfce(sesion).filter((c: any) => !this.esHechoCaso(c) && !this.esEnProceso(c.estado));
    if (!pend.length) return false;
    return !this.bloqueoConsumo250(sesion);
  }

  etiquetaEnviarConsumo250(sesion: any): string {
    if (this.enviandoRfce) return 'Enviando RFCE…';
    if (this.aceptadosRfce(sesion) >= this.totalRfce(sesion) && this.totalRfce(sesion) > 0)
      return 'Completado';
    return 'ENVIAR';
  }

  async enviarConsumo250(sesion: any): Promise<void> {
    const bloqueo = this.bloqueoConsumo250(sesion);
    if (bloqueo) {
      await this.toast(bloqueo, 'warning');
      return;
    }
    const ids = this.casosRfce(sesion)
      .filter((c: any) => !this.esHechoCaso(c) && !this.esEnProceso(c.estado))
      .sort((a: any, b: any) => (Number(a.orden) || 0) - (Number(b.orden) || 0))
      .map((c: any) => Number(c.idCaso));
    if (!ids.length) {
      await this.toast('Las facturas de consumo < 250 mil ya están Aceptadas.', 'success');
      return;
    }
    this.enviandoRfce = true;
    try {
      for (const id of ids) {
        await this.enviarCaso(id);
        const actualizado = this.casoPorId(id, sesion);
        if (actualizado && !this.esHechoCaso(actualizado) && this.esRechazo(actualizado.estado)) {
          await this.toast(
            `${actualizado.encf} rechazado. DGII reinicia el set; no se envían las demás de consumo.`,
            'danger'
          );
          return;
        }
      }
      await this.toast(
        'Consumo < 250 mil enviado por RecepcionFC (EncApi). No hace falta el recuadro del portal DGII.',
        'success'
      );
    } finally {
      this.enviandoRfce = false;
    }
  }

  inboundDe(tipo: string): any[] {
    return (this.lab?.inbound || []).filter((i: any) =>
      String(i.tipo || '').toUpperCase() === tipo.toUpperCase());
  }

  esRechazo(estado: string): boolean {
    const e = (estado || '').toLowerCase();
    return e === 'rechazado' || e === 'error' || e === 'fallido';
  }

  esSecuenciaConsumida(mensaje?: string | null): boolean {
    const t = (mensaje || '').toLowerCase();
    return t.includes('ya ha sido utilizado')
      || t.includes('ya han sido utilizados')
      || t.includes('utilizados previamente')
      || t.includes('secuencia ya')
      || t.includes('secuencia utilizada')
      || t.includes('secuencia usada');
  }

  esHechoCaso(c: any): boolean {
    return this.esHecho(c?.estado) || this.esSecuenciaConsumida(c?.mensaje);
  }

  etiquetaEstadoCaso(c: any): string {
    if (!this.esHecho(c?.estado) && this.esSecuenciaConsumida(c?.mensaje))
      return 'Aceptado (secuencia usada)';
    return this.etiquetaEstado(c?.estado);
  }

  esHecho(estado: string): boolean {
    return this.claseEstado(estado) === 'ok';
  }

  claseEstado(estado: string): 'ok' | 'bad' | 'wait' | '' {
    const e = (estado || '').toLowerCase();
    if (e === 'hecho' || e === 'aceptado' || e === 'aceptadocondicional') return 'ok';
    if (e === 'fallido' || e === 'rechazado' || e === 'error') return 'bad';
    if (e === 'encurso' || e === 'enviado' || e === 'enproceso') return 'wait';
    return '';
  }

  clasePaso(p: any): string {
    return this.claseEstado(p?.estado);
  }

  verRespuesta(caso: any): void {
    const existente = this.logDgii.find(x => x.idCaso === caso.idCaso);
    if (existente) {
      this.logActivo = existente;
      return;
    }
    this.pushLog(this.entradaDesdeCaso(caso));
  }

  seleccionarLog(e: { idCaso: number; encf: string; estado: string; hora: string; texto: string }): void {
    this.logActivo = e;
  }

  async copiar(valor: string | null | undefined, etiqueta: string): Promise<void> {
    if (!valor) return;
    try {
      await navigator.clipboard.writeText(valor);
      await this.toast(`${etiqueta} copiada.`, 'success');
    } catch {
      await this.toast('No se pudo copiar. Seleccione el texto a mano.', 'warning');
    }
  }

  private capturarRespuesta(sesion: any, idCaso: number): void {
    const caso = (sesion?.casos || []).find((c: any) => c.idCaso === idCaso);
    if (!caso) return;
    this.pushLog(this.entradaDesdeCaso(caso));
  }

  private reconstruirLogDgii(): void {
    const casos = [
      ...(this.lab?.sesionActiva?.casos || []),
      ...(this.lab?.sesionAcecf?.casos || []),
      ...(this.lab?.sesionSimulacion?.casos || []),
    ].filter((c: any) => c.respuestaDgii || c.RespuestaDgii || c.mensaje || c.trackId);

    const inbound = (this.lab?.inbound || []).map((i: any) => this.entradaDesdeInbound(i));
    const activoId = this.logActivo?.idCaso;
    const previo = this.logActivo;
    this.logDgii = [
      ...casos.map((c: any) => this.entradaDesdeCaso(c)),
      ...inbound,
    ].sort((a, b) => (a.hora < b.hora ? 1 : -1));
    if (previo && !this.logDgii.some(x => x.idCaso === previo.idCaso)) {
      this.logDgii = [previo, ...this.logDgii];
    }
    this.logActivo = this.logDgii.find(x => x.idCaso === activoId) || previo || this.logDgii[0] || null;
  }

  private entradaDesdeCaso(c: any) {
    const texto = c.respuestaDgii || c.RespuestaDgii || [
      `Estado   : ${c.estado || ''}`,
      c.trackId ? `TrackId  : ${c.trackId}` : '',
      c.mensaje ? `Mensaje  : ${c.mensaje}` : '',
    ].filter(Boolean).join('\n');
    const fecha = c.fechaRespuesta || c.FechaRespuesta;
    return {
      idCaso: c.idCaso,
      encf: c.encf || '',
      estado: c.estado || '',
      hora: fecha ? new Date(fecha).toLocaleTimeString() : this.ahora(),
      texto,
    };
  }

  private entradaDesdeInbound(i: any) {
    return {
      idCaso: -(Number(i.idLog) || 0),
      encf: i.encf || i.tipo || 'inbound',
      estado: i.estado || '',
      hora: i.fecha ? new Date(i.fecha).toLocaleTimeString() : this.ahora(),
      texto: [
        `[${this.ahora()}] Recepción DGII ${i.tipo || ''}`,
        i.encf ? `e-NCF    : ${i.encf}` : '',
        i.estado ? `Estado   : ${i.estado}` : '',
        i.mensaje ? `Mensaje  : ${i.mensaje}` : '',
      ].filter(Boolean).join('\n'),
    };
  }

  private pushLog(entrada: { idCaso: number; encf: string; estado: string; hora: string; texto: string }): void {
    this.logDgii = [entrada, ...this.logDgii.filter(x => x.idCaso !== entrada.idCaso)];
    this.logActivo = entrada;
  }

  private ahora(): string {
    return new Date().toLocaleTimeString();
  }

  private encfDe(idCaso: number): string {
    const casos = [
      ...(this.lab?.sesionActiva?.casos || []),
      ...(this.lab?.sesionAcecf?.casos || []),
      ...(this.lab?.sesionSimulacion?.casos || []),
    ];
    return casos.find((c: any) => c.idCaso === idCaso)?.encf || String(idCaso);
  }

  badgePaso(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e === 'hecho' || e === 'aceptado') return 'success';
    if (e === 'rechazado' || e === 'error' || e === 'fallido') return 'danger';
    if (e === 'encurso' || e === 'enviado' || e === 'enproceso') return 'warning';
    return 'medium';
  }

  private msg(err: any, fallback: string): string {
    const e = err?.error;
    if (typeof e === 'string' && e.trim()) return e;
    return e?.message || err?.message || fallback;
  }

  private async msgBlob(err: any, fallback: string): Promise<string> {
    const blob = err?.error;
    if (blob instanceof Blob) {
      const txt = await this.leerErrorBlob(blob);
      if (txt) return txt;
    }
    return this.msg(err, fallback);
  }

  private async leerErrorBlob(blob: Blob): Promise<string | null> {
    if (!blob || blob.size === 0) return null;
    const type = (blob.type || '').toLowerCase();
    if (type.includes('xml')) return null;
    try {
      const txt = (await blob.text()).trim();
      if (!txt || txt.startsWith('<')) return null;
      const parsed = JSON.parse(txt);
      return parsed?.message || parsed?.title || null;
    } catch {
      return null;
    }
  }

  private bajarBlob(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async toast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, color, duration: 3200, position: 'top' });
    await t.present();
  }
}
