import {
  PDF_AZUL,
  PDF_MUTED,
  PdfModo,
  emitirPdf,
  pdfCelda,
  pdfDocBase,
  pdfEncabezado,
  pdfTexto
} from './pdfmake-core';

export interface ColumnaReporte {
  header: string;
  width: number | '*';
  align?: 'left' | 'right' | 'center';
}

export interface KpiReporte {
  label: string;
  value: string;
}

export interface SeccionTablaPdf {
  titulo?: string;
  columnas: ColumnaReporte[];
  filas: (string | number | null | undefined)[][];
  filaTotales?: (string | number | null | undefined)[];
}

export interface ReporteTablaPdf {
  titulo: string;
  empresa?: string;
  subtitulo?: string;
  kpis?: KpiReporte[];
  secciones: SeccionTablaPdf[];
  landscape?: boolean;
  nombreArchivo: string;
  modo?: PdfModo;
}

function tablaSeccion(seccion: SeccionTablaPdf) {
  const aligns = seccion.columnas.map(c => c.align || 'left');
  const body: any[] = [
    pdfEncabezado(seccion.columnas.map(c => c.header))
  ];

  if (seccion.filas.length) {
    for (const fila of seccion.filas) {
      body.push(fila.map((v, i) => pdfCelda(v, aligns[i])));
    }
  } else {
    body.push([
      {
        text: 'Sin registros.',
        colSpan: seccion.columnas.length,
        alignment: 'center',
        color: PDF_MUTED,
        fontSize: 8
      },
      ...seccion.columnas.slice(1).map(() => ({}))
    ]);
  }

  if (seccion.filaTotales?.length) {
    body.push(
      seccion.filaTotales.map((v, i) => ({
        ...pdfCelda(v, aligns[i]),
        bold: true
      }))
    );
  }

  return {
    table: {
      headerRows: 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      widths: seccion.columnas.map(c => c.width),
      body
    },
    layout: {
      fillColor: (rowIndex: number, node: any) => {
        if (rowIndex === 0) {
          return PDF_AZUL;
        }
        if (seccion.filaTotales && rowIndex === node.table.body.length - 1) {
          return '#eaf0f6';
        }
        return rowIndex % 2 === 0 ? '#f4f8fb' : null;
      },
      hLineColor: '#d7e3ee',
      vLineColor: '#d7e3ee'
    },
    margin: [0, 0, 0, 10]
  };
}

export function emitirReporteTabla(datos: ReporteTablaPdf) {
  const content: any[] = [
    { text: pdfTexto(datos.empresa) === '—' ? 'Alahia ERP' : datos.empresa, style: 'h1' },
    { text: datos.titulo, style: 'sub', margin: [0, 0, 0, 4] }
  ];

  if (datos.subtitulo) {
    content.push({ text: datos.subtitulo, fontSize: 9, color: PDF_MUTED, margin: [0, 0, 0, 8] });
  }

  if (datos.kpis?.length) {
    content.push({
      columns: datos.kpis.map(k => ({
        stack: [
          { text: k.label, fontSize: 7.5, color: PDF_MUTED, bold: true },
          { text: k.value, fontSize: 10, bold: true, margin: [0, 2, 0, 0] }
        ]
      })),
      columnGap: 8,
      margin: [0, 4, 0, 12]
    });
  }

  for (const seccion of datos.secciones) {
    if (seccion.titulo) {
      content.push({ text: seccion.titulo, style: 'h2', margin: [0, 8, 0, 6] });
    }
    content.push(tablaSeccion(seccion));
  }

  const def = pdfDocBase(datos.titulo, {
    pageOrientation: datos.landscape ? 'landscape' : 'portrait',
    header: (pagina: number) =>
      pagina === 1
        ? null
        : {
            text: `${datos.empresa || ''} · ${datos.titulo}`,
            fontSize: 8,
            color: PDF_MUTED,
            margin: [36, 18, 36, 0]
          },
    content
  });

  emitirPdf(def, datos.nombreArchivo, datos.modo || 'download');
}
