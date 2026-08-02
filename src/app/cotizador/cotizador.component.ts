import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { WaHelperService } from 'src/app/servicios/wa-helper.service';
import {
  CotizadorCalcularRequest,
  CotizadorCatalogo,
  CotizadorPropuesta,
  CotizadorService,
  ModuloComercial
} from './cotizador.service';

@Component({
  selector: 'app-cotizador',
  templateUrl: './cotizador.component.html',
  styleUrls: ['./cotizador.component.scss']
})
export class CotizadorComponent implements OnInit, OnDestroy {
  catalogo: CotizadorCatalogo | null = null;
  propuesta: CotizadorPropuesta | null = null;
  cargando = false;
  error = '';
  folio = '';
  linkPublico = '';
  mensajeAccion = '';

  tipoNegocioCodigo = '';
  seleccionados = new Set<string>();
  usuarios = 1;
  sucursales = 1;
  usaFacturacionElectronica = false;
  documentosElectronicosMensuales = 0;

  lead = {
    nombre: '',
    correo: '',
    telefono: '',
    mensaje: ''
  };

  private readonly destroy$ = new Subject<void>();
  private readonly recalcular$ = new Subject<void>();

  constructor(
    private cotizador: CotizadorService,
    private wa: WaHelperService
  ) {}

  ngOnInit(): void {
    this.recalcular$
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => this.calcular());

    this.cargando = true;
    this.cotizador.catalogo().subscribe({
      next: (cat) => {
        this.catalogo = cat;
        this.cargando = false;
        if (cat.tiposNegocio?.length) {
          this.seleccionarTipo(cat.tiposNegocio[0].codigo);
        } else {
          this.solicitarRecalculo();
        }
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.message || 'No se pudo cargar el catálogo del cotizador.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get categorias(): string[] {
    if (!this.catalogo) return [];
    return [...new Set(this.catalogo.categorias.map((c) => c.nombre))].sort((a, b) => {
      const oa = this.catalogo!.categorias.find((x) => x.nombre === a)?.orden ?? 0;
      const ob = this.catalogo!.categorias.find((x) => x.nombre === b)?.orden ?? 0;
      return oa - ob;
    });
  }

  modulosDe(categoria: string): ModuloComercial[] {
    return (this.catalogo?.modulos || [])
      .filter((m) => m.categoriaComercial === categoria)
      .sort((a, b) => a.orden - b.orden);
  }

  seleccionarTipo(codigo: string): void {
    this.tipoNegocioCodigo = codigo;
    const tipo = this.catalogo?.tiposNegocio.find((t) => t.codigo === codigo);
    this.seleccionados = new Set(tipo?.modulosPreseleccionados || []);
    this.solicitarRecalculo();
  }

  toggleModulo(codigo: string): void {
    if (this.seleccionados.has(codigo)) this.seleccionados.delete(codigo);
    else this.seleccionados.add(codigo);
    this.solicitarRecalculo();
  }

  estaSeleccionado(codigo: string): boolean {
    return this.seleccionados.has(codigo);
  }

  onCambioOperacion(): void {
    this.solicitarRecalculo();
  }

  aceptarRecomendacion(codigo: string): void {
    this.seleccionados.add(codigo);
    this.solicitarRecalculo();
  }

  private solicitarRecalculo(): void {
    this.recalcular$.next();
  }

  private armarRequest(): CotizadorCalcularRequest {
    return {
      tipoNegocioCodigo: this.tipoNegocioCodigo || undefined,
      codigosModulos: [...this.seleccionados],
      usuarios: Math.max(1, Number(this.usuarios) || 1),
      sucursales: Math.max(1, Number(this.sucursales) || 1),
      usaFacturacionElectronica: !!this.usaFacturacionElectronica,
      documentosElectronicosMensuales: Math.max(
        0,
        Number(this.documentosElectronicosMensuales) || 0
      )
    };
  }

  calcular(): void {
    if (!this.catalogo) return;
    this.cargando = true;
    this.error = '';
    this.cotizador.calcular(this.armarRequest()).subscribe({
      next: (p) => {
        this.propuesta = p;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.message || 'No se pudo calcular la propuesta.';
      }
    });
  }

  guardar(): void {
    if (!this.propuesta) return;
    this.cotizador.guardar(this.armarRequest(), this.propuesta).subscribe({
      next: (r) => {
        this.folio = r.folio;
        this.linkPublico = this.cotizador.buildLinkPublico(r.folio);
        this.mensajeAccion = `Propuesta guardada: ${r.folio}`;
      },
      error: (err) => (this.mensajeAccion = err?.error?.message || 'No se pudo guardar.')
    });
  }

  get linkCompartir(): string {
    return this.linkPublico || (this.folio ? this.cotizador.buildLinkPublico(this.folio) : '');
  }

  copiarLink(): void {
    const link = this.linkCompartir;
    if (!link) {
      this.mensajeAccion = 'Guarde la propuesta antes de compartir.';
      return;
    }
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(
        () => (this.mensajeAccion = 'Link copiado. Puede pegarlo en WhatsApp.'),
        () => (this.mensajeAccion = link)
      );
    } else {
      this.mensajeAccion = link;
    }
  }

  compartirWhatsApp(): void {
    if (!this.folio) {
      this.mensajeAccion = 'Guarde la propuesta antes de compartir.';
      return;
    }
    const link = this.linkCompartir;
    const precio = this.propuesta?.precioMensualUSD != null
      ? `${Number(this.propuesta.precioMensualUSD).toFixed(2)} USD/mes`
      : '';
    const nombre = (this.lead.nombre || '').trim();
    const msg =
      (nombre ? `Hola ${nombre}, ` : 'Hola, ')
      + `aquí tiene su cotización Alahia ERP (${this.folio})`
      + (precio ? ` — estimado ${precio}` : '')
      + `:\n${link}`;

    const phone = this.toWaPhone(this.lead.telefono);
    if (phone) {
      const ok = this.wa.openChat(phone, msg);
      this.mensajeAccion = ok
        ? 'WhatsApp abierto con el link de la cotización.'
        : 'No se pudo abrir WhatsApp. Copie el link e inténtelo de nuevo.';
      return;
    }

    // Sin teléfono: abre WhatsApp Web para elegir contacto
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    this.mensajeAccion = 'WhatsApp abierto. Elija el contacto para enviar el link.';
  }

  private toWaPhone(raw: string): string | null {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length >= 11 && digits.startsWith('1')) return digits;
    if (digits.length === 10 && /^(809|829|849)/.test(digits)) return '1' + digits;
    if (digits.length >= 11) return digits;
    return null;
  }

  enviarCorreo(): void {
    if (!this.folio) {
      this.mensajeAccion = 'Guarde la propuesta antes de enviarla.';
      return;
    }
    if (!this.lead.correo) {
      this.mensajeAccion = 'Indique un correo.';
      return;
    }
    this.cotizador.enviarCorreo(this.folio, this.lead.correo, this.lead.nombre).subscribe({
      next: () => (this.mensajeAccion = 'Cotización enviada por correo.'),
      error: (err) => (this.mensajeAccion = err?.error?.message || 'No se pudo enviar.')
    });
  }

  solicitar(tipo: string): void {
    this.cotizador
      .solicitar({
        folio: this.folio || undefined,
        tipo,
        nombre: this.lead.nombre,
        correo: this.lead.correo,
        telefono: this.lead.telefono,
        mensaje: this.lead.mensaje,
        seleccion: this.armarRequest()
      })
      .subscribe({
        next: () => (this.mensajeAccion = 'Solicitud registrada. Un asesor le contactará.'),
        error: (err) => (this.mensajeAccion = err?.error?.message || 'No se pudo registrar.')
      });
  }

  nombreModulo(codigo: string): string {
    return this.catalogo?.modulos.find((m) => m.codigo === codigo)?.nombre || codigo;
  }
}
