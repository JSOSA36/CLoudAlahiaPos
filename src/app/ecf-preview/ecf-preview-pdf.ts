import {
  archivoSeguro,
  emitirPdf,
  pdfDocBase,
  pdfTexto
} from 'src/app/shared/pdf/pdfmake-core';
import * as QRCode from 'qrcode';

export async function descargarEcfPdf(datos: {
  empresa?: string;
  razonSocial?: string;
  nombreComercial?: string;
  rncEmisor?: string;
  direccion?: string;
  telefono?: string;
  tipoDocumento?: string;
  encf?: string;
  numeroDocumento?: string;
  fecha?: string | Date;
  fechaVencimiento?: string | Date | null;
  fechaFirma?: string | null;
  cliente?: string;
  rnc?: string;
  trackId?: string;
  notaTrackId?: string;
  securityCode?: string;
  urlQR?: string;
  estado?: string;
  items?: { nombre?: string; cantidad?: number; precio?: number; itbis?: number; subTotal?: number }[];
  subTotal?: number;
  totalItbis?: number;
  total?: number;
}) {
  let qr: string | null = null;
  if (datos.urlQR) {
    const lib: any = (QRCode as any).toDataURL ? QRCode : (QRCode as any).default;
    qr = await lib.toDataURL(datos.urlQR, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
  }

  const razon = texto(datos.razonSocial || datos.empresa);
  const comercial = texto(datos.nombreComercial || datos.empresa || razon);
  const codigo = texto(datos.securityCode) || qrParam(datos.urlQR, 'CodigoSeguridad');
  const firma = texto(datos.fechaFirma) || qrParam(datos.urlQR, 'FechaFirma');
  const items = datos.items || [];
  const filas = items.length
    ? items.map(item => {
        const cant = Number(item.cantidad || 0);
        const precio = Number(item.precio || 0);
        const monto = cant * precio;
        return [
          { text: pdfTexto(item.nombre), alignment: 'left' },
          { text: cantidad(cant), alignment: 'right' },
          { text: montoPlano(precio), alignment: 'right' },
          { text: montoPlano(monto), alignment: 'right' }
        ];
      })
    : [[{ text: '', colSpan: 4 }, {}, {}, {}]];

  const contenido: any[] = [
    { text: pdfTexto(datos.tipoDocumento || 'Comprobante Electrónico'), style: 'titulo', alignment: 'center' },
    { text: `e-NCF: ${pdfTexto(datos.encf)}`, alignment: 'center', bold: true, margin: [0, 6, 0, 0] },
    { text: `Fecha Vencimiento: ${fechaCorta(datos.fechaVencimiento)}`, alignment: 'center', margin: [0, 2, 0, 14] },
    fila('Razón Social', razon),
    fila('Nombre Comercial', comercial),
    fila('RNC', texto(datos.rncEmisor)),
    fila('Dirección', texto(datos.direccion)),
    fila('Fecha de emisión', fechaCorta(datos.fecha)),
    fila('Razón Social comprador', texto(datos.cliente)),
    fila('RNC comprador', texto(datos.rnc)),
    {
      margin: [0, 14, 0, 0],
      table: {
        headerRows: 1,
        widths: ['*', 55, 80, 90],
        body: [
          ['Item', 'Cant.', 'Precio', 'Monto'].map(h => ({
            text: h, bold: true, alignment: 'center', fillColor: '#f3f3f3', fontSize: 10
          })),
          ...filas
        ]
      },
      layout: {
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
        hLineColor: () => '#222',
        vLineColor: () => '#222'
      }
    },
    {
      margin: [0, 10, 0, 0],
      columns: [
        { width: '*', text: '' },
        {
          width: 220,
          stack: [
            totalDerecha('ITBIS:', datos.totalItbis),
            totalDerecha('Monto total:', datos.total, true)
          ]
        }
      ]
    },
    { text: 'ConsultaTimbre', alignment: 'center', bold: true, fontSize: 13, margin: [0, 22, 0, 8] }
  ];

  if (qr) {
    contenido.push({ image: qr, width: 130, alignment: 'center', margin: [0, 0, 0, 8] });
  }
  if (codigo) {
    contenido.push({ text: `Código de Seguridad: ${codigo}`, alignment: 'center', margin: [0, 2, 0, 0] });
  }
  if (firma) {
    contenido.push({ text: `Fecha Firma: ${firma}`, alignment: 'center', margin: [0, 2, 0, 0] });
  }

  const doc = pdfDocBase(datos.encf || 'e-CF', {
    content: contenido,
    styles: {
      titulo: { fontSize: 16, bold: true, color: '#111' }
    },
    defaultStyle: { fontSize: 11, color: '#111' },
    footer: () => ({ text: '' })
  });
  emitirPdf(doc, `${archivoSeguro(datos.encf || 'ecf')}.pdf`);
}

function fila(etiqueta: string, valor: string) {
  return {
    columns: [
      { width: 170, text: etiqueta, fontSize: 11 },
      { width: '*', text: valor, bold: true, fontSize: 11 }
    ],
    margin: [40, 1, 0, 1]
  };
}

function totalDerecha(etiqueta: string, valor?: number | null, fuerte = false) {
  return {
    columns: [
      { width: '*', text: etiqueta, bold: fuerte, alignment: 'right' },
      { width: 90, text: montoPlano(valor), bold: true, alignment: 'right' }
    ],
    margin: [0, 1, 0, 1]
  };
}

function texto(valor?: string | number | null): string {
  if (valor == null) return '';
  return String(valor).trim();
}

function montoPlano(valor?: number | null): string {
  return Number(valor || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cantidad(valor: number): string {
  if (Number.isInteger(valor)) return String(valor);
  return montoPlano(valor);
}

function fechaCorta(valor?: string | Date | null): string {
  if (!valor) return '';
  if (typeof valor === 'string') {
    const lista = valor.trim().match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (lista) return `${lista[1]}-${lista[2]}-${lista[3]}`;
    const iso = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  }
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime()) || d.getFullYear() > 2100) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function qrParam(url: string | undefined, key: string): string {
  if (!url) return '';
  try {
    return decodeURIComponent(new URL(url).searchParams.get(key) || '').replace(/\+/g, ' ');
  } catch {
    const m = url.match(new RegExp(`[?&]${key}=([^&]+)`, 'i'));
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
}
