import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

export const PDF_AZUL = '#1b4f72';
export const PDF_TEXTO = '#1d2b3a';
export const PDF_MUTED = '#5b6b7c';

export function obtenerPdfMake(): any {
  const lib: any = (pdfMake as any).createPdf
    ? pdfMake
    : (pdfMake as any).default || pdfMake;
  const fonts: any = pdfFonts as any;
  const vfs =
    fonts.pdfMake?.vfs ||
    fonts.default?.pdfMake?.vfs ||
    fonts.vfs ||
    (typeof window !== 'undefined' ? (window as any).pdfMake?.vfs : null);
  if (!vfs) {
    throw new Error('No se pudieron cargar las fuentes del PDF.');
  }
  lib.vfs = vfs;
  return lib;
}

export function pdfTexto(valor?: string | number | null): string {
  if (valor == null || String(valor).trim() === '') {
    return '—';
  }
  return String(valor).trim();
}

export function pdfMoneda(valor?: number | null): string {
  return Number(valor || 0).toLocaleString('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function pdfNumero(valor?: number | null, decimales = 2): string {
  return Number(valor || 0).toLocaleString('es-DO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
}

export function pdfFecha(valor?: string | Date | null): string {
  if (!valor) {
    return '—';
  }
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) {
    return String(valor).substring(0, 10);
  }
  return d.toLocaleDateString('es-DO');
}

export function pdfFechaHora(valor?: string | Date | null): string {
  if (!valor) {
    return '—';
  }
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) {
    return String(valor);
  }
  return d.toLocaleString('es-DO');
}

export function pdfEncabezado(textos: string[]) {
  return textos.map(h => ({
    text: h,
    bold: true,
    fillColor: PDF_AZUL,
    color: '#ffffff',
    fontSize: 8
  }));
}

export function pdfCelda(
  valor: string | number | null | undefined,
  align: 'left' | 'right' | 'center' = 'left'
) {
  return {
    text: typeof valor === 'number' ? pdfNumero(valor) : pdfTexto(valor),
    alignment: align,
    fontSize: 8
  };
}

export const PDF_ESTILOS = {
  h1: { fontSize: 16, bold: true, color: PDF_AZUL },
  sub: { fontSize: 10, color: PDF_MUTED, margin: [0, 2, 0, 0] },
  h2: { fontSize: 11, bold: true, color: PDF_AZUL },
  label: { fontSize: 7.5, bold: true, color: PDF_MUTED },
  valor: { fontSize: 9.5, margin: [0, 1, 0, 0] }
};

export function pdfDocBase(titulo: string, extra?: any): any {
  return {
    pageSize: 'LETTER',
    pageMargins: [36, 48, 36, 40],
    defaultStyle: {
      fontSize: 9,
      color: PDF_TEXTO
    },
    styles: PDF_ESTILOS,
    footer: (pagina: number, total: number) => ({
      text: `${titulo} · Página ${pagina} de ${total}`,
      alignment: 'center',
      fontSize: 8,
      color: PDF_MUTED,
      margin: [0, 0, 0, 16]
    }),
    ...extra
  };
}

export type PdfModo = 'download' | 'open';

export function emitirPdf(docDefinition: any, nombreArchivo: string, modo: PdfModo = 'download') {
  const pdf = obtenerPdfMake().createPdf(docDefinition);
  if (modo === 'open') {
    pdf.open();
    return;
  }
  pdf.download(nombreArchivo);
}

export function archivoSeguro(valor: string): string {
  return (valor || 'documento')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'documento';
}
