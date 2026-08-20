import {
  PDF_AZUL,
  PDF_MUTED,
  archivoSeguro,
  emitirPdf,
  pdfDocBase,
  pdfEncabezado,
  pdfFechaHora,
  pdfNumero,
  pdfTexto
} from 'src/app/shared/pdf/pdfmake-core';

export function descargarConducePdf(c: {
  empresa: string;
  direccion?: string;
  telefono?: string;
  rnc?: string;
  numero: string;
  fecha?: string;
  factura?: string;
  ncf?: string;
  cliente?: string;
  almacen?: string;
  quienEntrega?: string;
  quienRecibe?: string;
  observacion?: string;
  lineas: { producto: string; entregada: number; facturada: number; pendiente: number }[];
  totalEntregado: number;
  estado?: {
    facturado: number;
    entregado: number;
    pendiente: number;
    lineas: { producto: string; facturada: number; devuelta: number; entregada: number; pendiente: number }[];
  } | null;
  modo?: 'download' | 'open';
}) {
  const filas = c.lineas.length
    ? c.lineas.map((l, i) => [
        { text: String(i + 1), alignment: 'center' },
        pdfTexto(l.producto),
        { text: pdfNumero(l.entregada, 4), alignment: 'right' },
        { text: pdfNumero(l.facturada, 4), alignment: 'right' },
        { text: pdfNumero(l.pendiente, 4), alignment: 'right' }
      ])
    : [[{ text: 'Sin ítems', colSpan: 5, alignment: 'center', color: PDF_MUTED }, {}, {}, {}, {}]];

  const content: any[] = [
    {
      columns: [
        {
          stack: [
            { text: c.empresa, style: 'h1' },
            c.direccion ? { text: c.direccion, color: PDF_MUTED } : null,
            c.telefono ? { text: `Tel: ${c.telefono}`, color: PDF_MUTED } : null,
            c.rnc ? { text: `RNC: ${c.rnc}`, color: PDF_MUTED } : null
          ].filter(Boolean)
        },
        {
          width: 200,
          stack: [
            { text: 'CONDUCE / ENTREGA', style: 'h2', alignment: 'right' },
            { text: `No.: ${c.numero}`, alignment: 'right', margin: [0, 4, 0, 0] },
            { text: `Fecha: ${pdfFechaHora(c.fecha)}`, alignment: 'right' }
          ]
        }
      ]
    },
    { text: 'Datos', style: 'h2', margin: [0, 14, 0, 6] },
    {
      columns: [
        { text: `Factura: ${pdfTexto(c.factura)}` },
        c.ncf ? { text: `NCF: ${c.ncf}` } : { text: '' }
      ]
    },
    { text: `Cliente: ${pdfTexto(c.cliente)}` },
    c.almacen ? { text: `Almacén: ${c.almacen}` } : null,
    c.quienEntrega ? { text: `Entrega: ${c.quienEntrega}` } : null,
    c.quienRecibe ? { text: `Recibe: ${c.quienRecibe}` } : null,
    c.observacion ? { text: `Observación: ${c.observacion}` } : null,
    { text: 'Ítems de este conduce', style: 'h2', margin: [0, 12, 0, 6] },
    {
      table: {
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
        widths: [22, '*', 70, 70, 70],
        body: [
          pdfEncabezado(['#', 'Producto', 'Entregado', 'Facturado', 'Pendiente']),
          ...filas,
          [
            { text: 'Total entregado', colSpan: 2, bold: true },
            {},
            { text: pdfNumero(c.totalEntregado, 4), alignment: 'right', bold: true },
            {},
            {}
          ]
        ]
      },
      layout: {
        fillColor: (i: number) => (i === 0 ? PDF_AZUL : i % 2 === 0 ? '#f4f8fb' : null),
        hLineColor: '#d7e3ee',
        vLineColor: '#d7e3ee'
      }
    }
  ];

  if (c.estado) {
    content.push({ text: 'Estado de entrega de la factura', style: 'h2', margin: [0, 14, 0, 6] });
    content.push({
      columns: [
        { text: [{ text: 'Facturado neto\n', fontSize: 8, color: PDF_MUTED }, { text: pdfNumero(c.estado.facturado, 4), bold: true }] },
        { text: [{ text: 'Entregado\n', fontSize: 8, color: PDF_MUTED }, { text: pdfNumero(c.estado.entregado, 4), bold: true }] },
        { text: [{ text: 'Pendiente\n', fontSize: 8, color: PDF_MUTED }, { text: pdfNumero(c.estado.pendiente, 4), bold: true }] }
      ]
    });
    content.push({
      table: {
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
        widths: [22, '*', 60, 55, 60, 60],
        body: [
          pdfEncabezado(['#', 'Producto', 'Facturado', 'Devuelto', 'Entregado', 'Pendiente']),
          ...c.estado.lineas.map((l, i) => [
            { text: String(i + 1), alignment: 'center' },
            pdfTexto(l.producto),
            { text: pdfNumero(l.facturada, 4), alignment: 'right' },
            { text: pdfNumero(l.devuelta, 4), alignment: 'right' },
            { text: pdfNumero(l.entregada, 4), alignment: 'right' },
            { text: pdfNumero(l.pendiente, 4), alignment: 'right' }
          ])
        ]
      },
      layout: {
        fillColor: (i: number) => (i === 0 ? PDF_AZUL : i % 2 === 0 ? '#f4f8fb' : null),
        hLineColor: '#d7e3ee',
        vLineColor: '#d7e3ee'
      },
      margin: [0, 8, 0, 0]
    });
  }

  content.push({
    columns: [
      {
        stack: [
          { text: '______________________________', alignment: 'center', margin: [0, 36, 0, 4] },
          { text: 'Quien entrega', alignment: 'center', bold: true },
          { text: c.quienEntrega || 'Nombre y firma', alignment: 'center', fontSize: 8, color: PDF_MUTED }
        ]
      },
      {
        stack: [
          { text: '______________________________', alignment: 'center', margin: [0, 36, 0, 4] },
          { text: 'Quien recibe', alignment: 'center', bold: true },
          { text: c.quienRecibe || 'Nombre y firma', alignment: 'center', fontSize: 8, color: PDF_MUTED }
        ]
      }
    ]
  });

  emitirPdf(
    pdfDocBase(`Conduce ${c.numero}`, { content: content.filter(Boolean) }),
    `${archivoSeguro(c.numero)}.pdf`,
    c.modo
  );
}
