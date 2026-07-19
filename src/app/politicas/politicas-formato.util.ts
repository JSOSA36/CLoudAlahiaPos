export type PoliticasBloque =
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'lista'; items: string[] };

/**
 * Convierte el texto plano de políticas (con rayas ----) en bloques
 * tipográficos: títulos en negrita, párrafos y viñetas.
 */
export function formatearPoliticasContenido(contenido: string | null | undefined): PoliticasBloque[] {
  if (!contenido?.trim()) return [];

  const texto = normalizarEncoding(contenido);
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const bloques: PoliticasBloque[] = [];
  let listaActual: string[] = [];
  let parrafoBuffer: string[] = [];

  const flushLista = () => {
    if (listaActual.length) {
      bloques.push({ tipo: 'lista', items: [...listaActual] });
      listaActual = [];
    }
  };

  const flushParrafo = () => {
    if (parrafoBuffer.length) {
      bloques.push({ tipo: 'parrafo', texto: parrafoBuffer.join(' ').trim() });
      parrafoBuffer = [];
    }
  };

  const esRaya = (l: string) => /^[-–—=]{3,}\s*$/.test(l);
  // "4. Soporte…" y subsecciones "4.1 Horario…", "4.2 …"
  const esTitulo = (l: string) =>
    /^\d+\.\d+\s+\S/.test(l) ||
    /^\d+\.\s+\S/.test(l) ||
    /^(Importante|Políticas del Servicio|Principios de Operación)/i.test(l);
  const esBullet = (l: string) =>
    /^[•·▪►]\s*/.test(l) ||
    /^[-*]\s+/.test(l) ||
    /^â€[¢˜]/.test(l);

  for (const raw of lineas) {
    const linea = raw.trim();

    if (!linea || esRaya(linea)) {
      flushLista();
      flushParrafo();
      continue;
    }

    if (esBullet(linea)) {
      flushParrafo();
      const item = linea
        .replace(/^â€[¢˜]\s*/, '')
        .replace(/^[•·▪►]\s*/, '')
        .replace(/^[-*]\s+/, '')
        .trim();
      if (item) listaActual.push(item);
      continue;
    }

    if (esTitulo(linea)) {
      flushLista();
      flushParrafo();
      bloques.push({ tipo: 'titulo', texto: linea });
      continue;
    }

    flushLista();
    parrafoBuffer.push(linea);
  }

  flushLista();
  flushParrafo();

  return bloques;
}

/** Escapa HTML y resalta MacroBits / MacroBits SRL en negrita. */
export function resaltarMacroBitsHtml(texto: string | null | undefined): string {
  if (!texto) return '';
  const escaped = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(
    /\bMacroBits(?:\s+SRL)?\b/gi,
    (marca) => `<strong class="marca-macrobits">${marca}</strong>`
  );
}

/** Corrige mojibake típico UTF-8 leído como Latin-1 (PolÃticas → Políticas). */
function normalizarEncoding(texto: string): string {
  // Si ya se ve bien (tiene tildes reales), no tocar
  if (/[áéíóúñÁÉÍÓÚÑ]/.test(texto) && !/Ã.|â€/.test(texto)) {
    return texto;
  }

  // Solo aplicar si hay señales claras de mojibake
  if (!/Ã.|â€/.test(texto)) {
    return texto;
  }

  try {
    const bytes = new Uint8Array([...texto].map(c => c.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    if (/[áéíóúñÁÉÍÓÚÑ]/.test(decoded) || decoded.includes('•')) {
      return decoded;
    }
  } catch {
    // fallback manual abajo
  }

  return texto
    .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó').replace(/Ãš/g, 'Ú').replace(/Ã‘/g, 'Ñ')
    .replace(/Ã /g, 'à')
    .replace(/â€¢/g, '•')
    .replace(/â€“/g, '–')
    .replace(/â€”/g, '—')
    .replace(/Â /g, ' ')
    .replace(/Â/g, '');
}
