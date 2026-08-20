export interface VariablesPlantillaDocumento {
  cliente: string;
  cedula: string;
  fecha: string;
  numeroDocumento: string;
  doctor: string;
  edad?: string;
  nombreEmpresa?: string;
  eslogan?: string;
  direccion?: string;
  telefono?: string;
  cargoDoctor?: string;
  procedimiento?: string;
  horasReposo?: number | null;
  observaciones?: string;
  medicamentos?: string;
  indicaciones?: string;
  firma?: string;
  sello?: string;
}

const FIRMA_VACIA =
  '<span style="color:#94a3b8;font-size:11px;">Firma del doctor</span>';

const SELLO_VACIO =
  '<span style="font-size:9px;color:#94a3b8;text-align:center;padding:8px;display:block;">Sello</span>';

function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function calcularEdadPaciente(fechaNacimiento?: string | Date | null): string {
  if (fechaNacimiento == null || fechaNacimiento === '') {
    return '';
  }

  let nacimiento: Date;
  if (fechaNacimiento instanceof Date) {
    nacimiento = fechaNacimiento;
  } else {
    const texto = String(fechaNacimiento).trim();
    if (!texto) {
      return '';
    }
    const valor = texto.includes('T') ? texto : `${texto.substring(0, 10)}T00:00:00`;
    nacimiento = new Date(valor);
  }

  if (Number.isNaN(nacimiento.getTime())) {
    return '';
  }

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }

  if (edad < 0 || edad > 130) {
    return '';
  }

  return `${edad} ${edad === 1 ? 'año' : 'años'}`;
}

export function formatearFechaDocumento(fecha: string): string {
  if (!fecha?.trim()) {
    return '';
  }

  const valor = fecha.includes('T') ? fecha : `${fecha}T00:00:00`;
  const fechaObj = new Date(valor);

  if (Number.isNaN(fechaObj.getTime())) {
    return fecha;
  }

  return fechaObj.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function generarHtmlDocumentoClinico(
  plantillaHtml: string,
  variables: VariablesPlantillaDocumento
): string {
  if (!plantillaHtml?.trim()) {
    return '';
  }

  const mapa: Record<string, string> = {
    '{{CLIENTE}}': escapeHtml(variables.cliente),
    '{{CEDULA}}': escapeHtml(variables.cedula),
    '{{EDAD}}': escapeHtml(variables.edad || ''),
    '{{FECHA}}': escapeHtml(formatearFechaDocumento(variables.fecha)),
            '{{NUMERO_DOCUMENTO}}': variables.numeroDocumento?.trim()
              ? escapeHtml(variables.numeroDocumento.trim())
              : '{{NUMERO_DOCUMENTO}}',
    '{{DOCTOR}}': escapeHtml(variables.doctor),
    '{{NOMBRE_EMPRESA}}': escapeHtml(variables.nombreEmpresa || ''),
    '{{ESLOGAN}}': escapeHtml(variables.eslogan || ''),
    '{{DIRECCION}}': escapeHtml(variables.direccion || ''),
    '{{TELEFONO}}': escapeHtml(variables.telefono || ''),
    '{{CARGO_DOCTOR}}': escapeHtml(variables.cargoDoctor || 'ODONTÓLOGO'),
    '{{PROCEDIMIENTO}}': escapeHtml(variables.procedimiento || ''),
    '{{HORAS_REPOSO}}': escapeHtml(
      variables.horasReposo != null ? String(variables.horasReposo) : ''
    ),
    '{{OBSERVACIONES}}': escapeHtml(variables.observaciones || ''),
    '{{MEDICAMENTOS}}': escapeHtml(variables.medicamentos || ''),
    '{{INDICACIONES}}': escapeHtml(variables.indicaciones || ''),
    '{{FIRMA}}': variables.firma?.trim() || FIRMA_VACIA,
    '{{SELLO}}': variables.sello?.trim() || SELLO_VACIO
  };

  let html = plantillaHtml;

  for (const [token, valor] of Object.entries(mapa)) {
    html = html.split(token).join(valor);
  }

  return html;
}

const ESTILOS_IMPRESION_COLOR = `
<style id="alahia-print-colors">
  html, body, * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .deco-top { background-color: #93c5fd !important; opacity: 0.35 !important; }
  .deco-bottom { background-color: #60a5fa !important; opacity: 0.25 !important; }
  .logo-box { background-color: transparent !important; }
  .cabecera-clinica h1, .brand h1 { color: #1e3a8a !important; }
  .titulo-wrap h2, .nombre-doctor, .reposo-horas { color: #1e3a8a !important; }
  .numero-badge { background-color: #1e3a8a !important; color: #fff !important; }
  .footer-contacto { background-color: #1e3a8a !important; color: #fff !important; }
  .subtitulo, .seccion-label { color: #3b82f6 !important; }
  .subtitulo::before, .subtitulo::after { background-color: #93c5fd !important; }
  .caja-contenido, .caja-procedimiento, .aviso-importante {
    background-color: #eff6ff !important;
    border-color: #bfdbfe !important;
  }
  .caja-indicaciones, .caja-reposo {
    background-color: #f8fafc !important;
    border-color: #e2e8f0 !important;
  }
  .icono-reloj { background-color: #dbeafe !important; color: #2563eb !important; }
  .linea-firma { border-color: #1e3a8a !important; }
  .sello-area { border-color: #93c5fd !important; background-color: #f8fafc !important; }
</style>`;

export function prepararHtmlParaImpresion(html: string): string {
  if (!html?.trim()) {
    return html;
  }

  let result = html;

  if (!result.includes('alahia-print-colors')) {
    if (result.includes('</head>')) {
      result = result.replace('</head>', `${ESTILOS_IMPRESION_COLOR}</head>`);
    } else {
      result = `${ESTILOS_IMPRESION_COLOR}${result}`;
    }
  }

  return result
    .replace(
      'class="logo-box"',
      'class="logo-box" style="background-color:transparent!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;"'
    )
    .replace(
      'class="numero-badge"',
      'class="numero-badge" style="background-color:#1e3a8a!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;"'
    )
    .replace(
      'class="footer-contacto"',
      'class="footer-contacto" style="background-color:#1e3a8a!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;"'
    )
    .replace(
      'class="caja-contenido"',
      'class="caja-contenido" style="background-color:#eff6ff!important;border:1px solid #bfdbfe!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;"'
    )
    .replace(
      'class="caja-indicaciones"',
      'class="caja-indicaciones" style="background-color:#f8fafc!important;border:1px solid #e2e8f0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;"'
    )
    .replace(
      'class="caja-procedimiento"',
      'class="caja-procedimiento" style="background-color:#eff6ff!important;border:1px solid #bfdbfe!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;"'
    );
}

/** @deprecated Usar prepararHtmlParaImpresion */
export function inyectarEstilosImpresionColor(html: string): string {
  return prepararHtmlParaImpresion(html);
}
