import {
  PDF_AZUL,
  PDF_MUTED,
  archivoSeguro,
  emitirPdf,
  pdfDocBase,
  pdfEncabezado,
  pdfFecha,
  pdfMoneda,
  pdfNumero,
  pdfTexto
} from 'src/app/shared/pdf/pdfmake-core';

export function descargarCotizacionPdf(c: {
  empresa: string;
  direccion?: string;
  telefono?: string;
  rnc?: string;
  correo?: string;
  notaEmpresa?: string;
  numero: string;
  fecha?: string;
  hora?: string;
  validez: Date | string;
  cliente: string;
  clienteTelefono?: string;
  clienteRnc?: string;
  clienteDireccion?: string;
  clienteCorreo?: string;
  nota?: string;
  lineas: { descripcion: string; cantidad: number; precio: number; itbis: number; total: number }[];
  subtotal: number;
  itbis: number;
  descuento: number;
  mostrarDescuento: boolean;
  total: number;
  modo?: 'download' | 'open';
}) {
  const filas = c.lineas.length
    ? c.lineas.map((l, i) => [
        { text: String(i + 1), alignment: 'center' },
        pdfTexto(l.descripcion),
        { text: pdfNumero(l.cantidad), alignment: 'right' },
        { text: pdfNumero(l.precio), alignment: 'right' },
        { text: pdfNumero(l.itbis), alignment: 'right' },
        { text: pdfNumero(l.total), alignment: 'right' }
      ])
    : [[{ text: 'Sin productos', colSpan: 6, alignment: 'center', color: PDF_MUTED }, {}, {}, {}, {}, {}]];

  const totales: any[] = [
    { columns: [{ text: 'Subtotal', alignment: 'right' }, { text: pdfMoneda(c.subtotal), alignment: 'right', width: 110 }] }
  ];
  if (c.itbis > 0) {
    totales.push({
      columns: [{ text: 'ITBIS', alignment: 'right' }, { text: pdfMoneda(c.itbis), alignment: 'right', width: 110 }]
    });
  }
  if (c.mostrarDescuento) {
    totales.push({
      columns: [
        { text: 'Descuento', alignment: 'right' },
        { text: `- ${pdfMoneda(c.descuento)}`, alignment: 'right', width: 110 }
      ]
    });
  }
  totales.push({
    columns: [
      { text: 'TOTAL', alignment: 'right', bold: true, fontSize: 11 },
      { text: pdfMoneda(c.total), alignment: 'right', bold: true, fontSize: 11, width: 110 }
    ],
    margin: [0, 4, 0, 0]
  });

  const def = pdfDocBase(`Cotización ${c.numero}`, {
    content: [
      {
        columns: [
          {
            stack: [
              { text: c.empresa, style: 'h1' },
              c.direccion ? { text: c.direccion, color: PDF_MUTED } : null,
              c.telefono ? { text: `Tel: ${c.telefono}`, color: PDF_MUTED } : null,
              c.rnc ? { text: `RNC: ${c.rnc}`, color: PDF_MUTED } : null,
              c.correo ? { text: c.correo, color: PDF_MUTED } : null
            ].filter(Boolean)
          },
          {
            width: 180,
            stack: [
              { text: 'COTIZACIÓN', style: 'h2', alignment: 'right' },
              { text: `No.: ${c.numero}`, alignment: 'right', margin: [0, 4, 0, 0] },
              { text: `Fecha: ${pdfFecha(c.fecha)}${c.hora ? ' ' + c.hora : ''}`, alignment: 'right' },
              { text: `Válida hasta: ${pdfFecha(c.validez)}`, alignment: 'right' }
            ]
          }
        ]
      },
      { text: 'Cliente', style: 'h2', margin: [0, 14, 0, 6] },
      { text: `Nombre: ${pdfTexto(c.cliente)}` },
      c.clienteTelefono ? { text: `Teléfono: ${c.clienteTelefono}` } : null,
      c.clienteRnc ? { text: `RNC / Cédula: ${c.clienteRnc}` } : null,
      c.clienteDireccion ? { text: `Dirección: ${c.clienteDireccion}` } : null,
      c.clienteCorreo ? { text: `Correo: ${c.clienteCorreo}` } : null,
      c.nota ? { text: `Nota: ${c.nota}` } : null,
      {
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          dontBreakRows: true,
          widths: [22, '*', 45, 60, 55, 65],
          body: [
            pdfEncabezado(['#', 'Descripción', 'Cant.', 'Precio', 'ITBIS', 'Total']),
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
      { stack: totales, margin: [120, 0, 0, 16] },
      {
        text: 'Esta cotización es informativa y no constituye una factura fiscal.',
        fontSize: 8,
        color: PDF_MUTED
      },
      {
        text: 'Los precios pueden variar según disponibilidad. Válida por 15 días.',
        fontSize: 8,
        color: PDF_MUTED
      },
      c.notaEmpresa ? { text: c.notaEmpresa, fontSize: 8, color: PDF_MUTED } : null
    ].filter(Boolean)
  });

  emitirPdf(def, `Cotizacion-${archivoSeguro(c.numero)}.pdf`, c.modo);
}
