import {
  PDF_AZUL,
  PDF_MUTED,
  archivoSeguro,
  emitirPdf,
  pdfDocBase,
  pdfEncabezado,
  pdfFechaHora,
  pdfMoneda,
  pdfNumero,
  pdfTexto
} from 'src/app/shared/pdf/pdfmake-core';

export function descargarMovimientoInventarioPdf(m: {
  empresa: string;
  direccion?: string;
  telefono?: string;
  rnc?: string;
  notaEmpresa?: string;
  titulo: string;
  numero: string;
  fecha?: string;
  almacen?: string;
  almacenDestino?: string;
  esTransferencia: boolean;
  motivo?: string;
  referencia?: string;
  usuario?: string;
  observacion?: string;
  lineas: {
    producto: string;
    cantidad: number;
    stockAnterior: number;
    stockNuevo: number;
    precio: number;
    subtotal: number;
  }[];
  total: number;
  modo?: 'download' | 'open';
}) {
  const filas = m.lineas.length
    ? m.lineas.map((l, i) => [
        { text: String(i + 1), alignment: 'center' },
        pdfTexto(l.producto),
        { text: pdfNumero(l.cantidad), alignment: 'right' },
        { text: pdfNumero(l.stockAnterior), alignment: 'right' },
        { text: pdfNumero(l.stockNuevo), alignment: 'right' },
        { text: pdfNumero(l.precio), alignment: 'right' },
        { text: pdfNumero(l.subtotal), alignment: 'right' }
      ])
    : [[{ text: 'Sin productos', colSpan: 7, alignment: 'center', color: PDF_MUTED }, {}, {}, {}, {}, {}, {}]];

  const def = pdfDocBase(m.titulo, {
    content: [
      {
        columns: [
          {
            stack: [
              { text: m.empresa, style: 'h1' },
              m.direccion ? { text: m.direccion, color: PDF_MUTED } : null,
              m.telefono ? { text: `Tel: ${m.telefono}`, color: PDF_MUTED } : null,
              m.rnc ? { text: `RNC: ${m.rnc}`, color: PDF_MUTED } : null
            ].filter(Boolean)
          },
          {
            width: 220,
            stack: [
              { text: m.titulo, style: 'h2', alignment: 'right' },
              { text: `No.: ${m.numero}`, alignment: 'right', margin: [0, 4, 0, 0] },
              { text: `Fecha: ${pdfFechaHora(m.fecha)}`, alignment: 'right' }
            ]
          }
        ]
      },
      { text: 'Datos', style: 'h2', margin: [0, 14, 0, 6] },
      m.esTransferencia
        ? { columns: [{ text: `Origen: ${pdfTexto(m.almacen)}` }, { text: `Destino: ${pdfTexto(m.almacenDestino)}` }] }
        : { text: `Almacén: ${pdfTexto(m.almacen)}` },
      { text: `Motivo: ${pdfTexto(m.motivo)}` },
      { text: `Referencia: ${pdfTexto(m.referencia)}` },
      { text: `Registrado por: ${pdfTexto(m.usuario)}` },
      m.observacion ? { text: `Observación: ${m.observacion}` } : null,
      {
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          dontBreakRows: true,
          widths: [22, '*', 45, 55, 55, 55, 60],
          body: [
            pdfEncabezado(['#', 'Producto', 'Cant.', 'Stock ant.', 'Stock nuevo', 'Precio', 'Subtotal']),
            ...filas
          ]
        },
        layout: {
          fillColor: (i: number) => (i === 0 ? PDF_AZUL : i % 2 === 0 ? '#f4f8fb' : null),
          hLineColor: '#d7e3ee',
          vLineColor: '#d7e3ee'
        },
        margin: [0, 12, 0, 10]
      },
      m.total > 0
        ? {
            columns: [
              { text: 'TOTAL', alignment: 'right', bold: true, fontSize: 11 },
              { text: pdfMoneda(m.total), alignment: 'right', bold: true, fontSize: 11, width: 110 }
            ],
            margin: [0, 0, 0, 16]
          }
        : null,
      {
        columns: [
          {
            stack: [
              { text: '______________________________', alignment: 'center', margin: [0, 28, 0, 4] },
              { text: 'Entrega', alignment: 'center', bold: true },
              { text: 'Nombre y firma de quien entrega', alignment: 'center', fontSize: 8, color: PDF_MUTED }
            ]
          },
          {
            stack: [
              { text: '______________________________', alignment: 'center', margin: [0, 28, 0, 4] },
              { text: 'Recibe', alignment: 'center', bold: true },
              { text: 'Nombre y firma de quien recibe', alignment: 'center', fontSize: 8, color: PDF_MUTED }
            ]
          }
        ]
      },
      { text: 'Documento de control interno de inventario.', fontSize: 8, color: PDF_MUTED, margin: [0, 16, 0, 0] },
      m.notaEmpresa ? { text: m.notaEmpresa, fontSize: 8, color: PDF_MUTED } : null
    ].filter(Boolean)
  });

  emitirPdf(
    def,
    `Movimiento-${archivoSeguro(m.titulo)}-${archivoSeguro(m.numero)}.pdf`,
    m.modo
  );
}
