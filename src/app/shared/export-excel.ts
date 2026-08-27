/**
 * Exporta hojas a Excel 2003 XML (.xls). Abre en Excel, Google Sheets y LibreOffice
 * sin dependencias. Los números quedan como Number para poder sumar.
 */

export type ExcelCelda = string | number | boolean | Date | null | undefined;

export interface ExcelHoja {
  nombre: string;
  filas: ExcelCelda[][];
}

export function descargarExcel(nombreArchivo: string, hojas: ExcelHoja[]): void {
  const xml = construirLibroExcel(hojas);
  const blob = new Blob(['\ufeff' + xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = asegurarExtensionXls(nombreArchivo);
  a.click();
  URL.revokeObjectURL(url);
}

export function excelFecha(valor?: string | Date | null): string {
  if (!valor) {
    return '';
  }
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor.toISOString().substring(0, 10);
  }
  const s = String(valor);
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  return s;
}

function construirLibroExcel(hojas: ExcelHoja[]): string {
  const validas = (hojas || []).filter(h => h && h.filas && h.filas.length);
  const cuerpo = (validas.length ? validas : [{ nombre: 'Hoja1', filas: [['Sin datos']] }])
    .map((h, i) => hojaXml(h, i))
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?mso-application progid="Excel.Sheet"?>',
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
    ' xmlns:o="urn:schemas-microsoft-com:office:office"',
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"',
    ' xmlns:html="http://www.w3.org/TR/REC-html40">',
    '<Styles>',
    '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/></Style>',
    '<Style ss:ID="Encabezado"><Font ss:Bold="1"/><Interior ss:Color="#E3F2FD" ss:Pattern="Solid"/></Style>',
    '<Style ss:ID="Numero"><NumberFormat ss:Format="#,##0.00"/></Style>',
    '</Styles>',
    cuerpo,
    '</Workbook>'
  ].join('');
}

function hojaXml(hoja: ExcelHoja, indice: number): string {
  const nombre = sanitizarNombreHoja(hoja.nombre || `Hoja${indice + 1}`, indice);
  const filas = hoja.filas.map((fila, i) => filaXml(fila || [], i === 0)).join('');
  return `<Worksheet ss:Name="${escXml(nombre)}"><Table>${filas}</Table></Worksheet>`;
}

function filaXml(celdas: ExcelCelda[], esEncabezado: boolean): string {
  const cells = celdas.map(c => celdaXml(c, esEncabezado)).join('');
  return `<Row>${cells}</Row>`;
}

function celdaXml(valor: ExcelCelda, esEncabezado: boolean): string {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    valor = excelFecha(valor);
  }
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const estilo = esEncabezado ? 'Encabezado' : 'Numero';
    return `<Cell ss:StyleID="${estilo}"><Data ss:Type="Number">${valor}</Data></Cell>`;
  }
  if (typeof valor === 'boolean') {
    return `<Cell${esEncabezado ? ' ss:StyleID="Encabezado"' : ''}><Data ss:Type="Boolean">${valor ? 1 : 0}</Data></Cell>`;
  }
  const texto = valor == null ? '' : String(valor);
  const estilo = esEncabezado ? ' ss:StyleID="Encabezado"' : '';
  return `<Cell${estilo}><Data ss:Type="String">${escXml(texto)}</Data></Cell>`;
}

function sanitizarNombreHoja(nombre: string, indice: number): string {
  const limpio = (nombre || `Hoja${indice + 1}`)
    .replace(/[:\\/?*\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 31);
  return limpio || `Hoja${indice + 1}`;
}

function asegurarExtensionXls(nombre: string): string {
  const base = (nombre || 'reporte').replace(/\.(csv|txt|pdf|xlsx|xls)$/i, '');
  return `${base}.xls`;
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
