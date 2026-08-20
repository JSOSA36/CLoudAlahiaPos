import {
  PDF_AZUL,
  PDF_MUTED,
  PDF_TEXTO,
  archivoSeguro,
  emitirPdf,
  pdfDocBase,
  pdfEncabezado,
  pdfFecha,
  pdfMoneda,
  pdfTexto
} from 'src/app/shared/pdf/pdfmake-core';

export interface NominaReciboEmpresa {
  nombre: string;
  rnc?: string;
  direccion?: string;
  telefono?: string;
}

export interface NominaReciboEmpleado {
  nombreEmpleado?: string;
  salarioBase?: number;
  horasExtra?: number;
  comisiones?: number;
  bonificaciones?: number;
  otrosIngresos?: number;
  descuentosAsistencia?: number;
  prestamos?: number;
  anticipos?: number;
  otrosDescuentos?: number;
  deduccionesLegales?: number;
  bruto?: number;
  neto?: number;
  diasAusenteSinGoce?: number;
  lineasJson?: string | any[] | null;
}

export interface NominaLineaDesglose {
  codigo: string;
  label: string;
  monto: number;
}

export interface NominaDesglose {
  ingresos: NominaLineaDesglose[];
  legales: NominaLineaDesglose[];
  otrosDescuentos: NominaLineaDesglose[];
  aportesPatronales: NominaLineaDesglose[];
  totalIngresos: number;
  totalLegales: number;
  totalOtrosDescuentos: number;
  totalDescuentos: number;
  bruto: number;
  neto: number;
}

const LEGALES: { codigo: string; label: string }[] = [
  { codigo: 'AFP_EMPLEADO', label: 'AFP — Administradora de Fondos de Pensiones' },
  { codigo: 'SFS_EMPLEADO', label: 'SFS — Seguro Familiar de Salud' },
  { codigo: 'ISR_EMPLEADO', label: 'ISR — Impuesto Sobre la Renta' }
];

const PATRONALES: { codigo: string; label: string }[] = [
  { codigo: 'AFP_PATRONAL', label: 'AFP patronal' },
  { codigo: 'SFS_PATRONAL', label: 'SFS patronal' },
  { codigo: 'INFOTEP_PATRONAL', label: 'INFOTEP patronal' }
];

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function parseLineas(raw: string | any[] | null | undefined): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function codigoLinea(l: any): string {
  return String(l?.conceptCode ?? l?.ConceptCode ?? '').toUpperCase();
}

function montoLinea(l: any): number {
  return n(l?.amount ?? l?.Amount);
}

function montoConcepto(lineas: any[], codigo: string): number {
  return lineas
    .filter((l) => codigoLinea(l) === codigo)
    .reduce((s, l) => s + montoLinea(l), 0);
}

export function desgloseNominaEmpleado(e: NominaReciboEmpleado): NominaDesglose {
  const lineas = parseLineas(e.lineasJson);
  const ingresos: NominaLineaDesglose[] = [
    { codigo: 'SUELDO_BASE', label: 'Sueldo del período', monto: n(e.salarioBase) },
    { codigo: 'HORAS_EXTRA', label: 'Horas extra', monto: n(e.horasExtra) },
    { codigo: 'COMISION', label: 'Comisiones', monto: n(e.comisiones) },
    { codigo: 'BONIFICACION', label: 'Bonificaciones', monto: n(e.bonificaciones) },
    { codigo: 'BENEFICIOS', label: 'Beneficios del cargo', monto: n(e.otrosIngresos) }
  ].filter((x) => x.monto !== 0 || x.codigo === 'SUELDO_BASE');

  const legales = LEGALES.map((item) => ({
    ...item,
    monto: montoConcepto(lineas, item.codigo)
  }));
  const totalLegalesMotor = legales.reduce((s, x) => s + x.monto, 0);
  if (totalLegalesMotor === 0 && n(e.deduccionesLegales) !== 0) {
    legales.push({
      codigo: 'LEGALES',
      label: 'Deducciones de ley (detalle no desglosado)',
      monto: n(e.deduccionesLegales)
    });
  }

  const otrosDescuentos: NominaLineaDesglose[] = [
    {
      codigo: 'ASISTENCIA',
      label: 'Descuento por asistencia / días sin goce',
      monto: n(e.descuentosAsistencia)
    },
    { codigo: 'PRESTAMO', label: 'Préstamos', monto: n(e.prestamos) },
    { codigo: 'ANTICIPO', label: 'Anticipos', monto: n(e.anticipos) },
    { codigo: 'OTROS', label: 'Otros descuentos', monto: n(e.otrosDescuentos) }
  ].filter((x) => x.monto !== 0);

  const aportesPatronales = PATRONALES.map((item) => ({
    ...item,
    monto: montoConcepto(lineas, item.codigo)
  })).filter((x) => x.monto !== 0);

  const totalIngresos = ingresos.reduce((s, x) => s + x.monto, 0);
  const totalLegales = legales.reduce((s, x) => s + x.monto, 0);
  const totalOtrosDescuentos = otrosDescuentos.reduce((s, x) => s + x.monto, 0);

  return {
    ingresos,
    legales,
    otrosDescuentos,
    aportesPatronales,
    totalIngresos,
    totalLegales,
    totalOtrosDescuentos,
    totalDescuentos: totalLegales + totalOtrosDescuentos,
    bruto: n(e.bruto) || totalIngresos,
    neto: n(e.neto)
  };
}

export function montoLegal(e: NominaReciboEmpleado, codigo: string): number {
  return desgloseNominaEmpleado(e).legales.find((x) => x.codigo === codigo)?.monto || 0;
}

function fila(concepto: string, monto: number, opts?: { bold?: boolean; fill?: string; color?: string }) {
  const base: any = {
    bold: !!opts?.bold,
    color: opts?.color || PDF_TEXTO,
    fontSize: 8.5
  };
  if (opts?.fill) base.fillColor = opts.fill;
  return [
    { ...base, text: concepto },
    { ...base, text: pdfMoneda(monto), alignment: 'right' }
  ];
}

function tablaConceptos(titulo: string, filas: any[][], anchos: (string | number)[] = ['*', 110]) {
  return [
    { text: titulo, style: 'h2', margin: [0, 12, 0, 6] },
    {
      table: {
        headerRows: 1,
        widths: anchos,
        body: [pdfEncabezado(['Concepto', 'Monto']), ...filas]
      },
      layout: {
        fillColor: (i: number) => (i === 0 ? PDF_AZUL : i % 2 === 0 ? '#f4f8fb' : null),
        hLineColor: '#d7e3ee',
        vLineColor: '#d7e3ee'
      }
    }
  ];
}

function contenidoRecibo(
  empresa: NominaReciboEmpresa,
  periodo: { inicio: string | Date; fin: string | Date; frecuencia: string; estado: string; periodKey: string },
  empleado: NominaReciboEmpleado,
  pageBreak: boolean
) {
  const d = desgloseNominaEmpleado(empleado);
  const nombre = pdfTexto(empleado.nombreEmpleado);
  const stack: any[] = [
    {
      columns: [
        {
          stack: [
            { text: pdfTexto(empresa.nombre), style: 'h1' },
            empresa.rnc ? { text: `RNC: ${empresa.rnc}`, color: PDF_MUTED } : null,
            empresa.direccion ? { text: empresa.direccion, color: PDF_MUTED } : null,
            empresa.telefono ? { text: `Tel: ${empresa.telefono}`, color: PDF_MUTED } : null
          ].filter(Boolean)
        },
        {
          width: 210,
          stack: [
            { text: 'RECIBO DE PAGO', style: 'h2', alignment: 'right' },
            { text: 'Volante de nómina', alignment: 'right', color: PDF_MUTED },
            { text: `Período: ${pdfFecha(periodo.inicio)} — ${pdfFecha(periodo.fin)}`, alignment: 'right', margin: [0, 6, 0, 0] },
            { text: `${pdfTexto(periodo.frecuencia)} · ${pdfTexto(periodo.estado)}`, alignment: 'right' },
            { text: periodo.periodKey, alignment: 'right', color: PDF_MUTED, fontSize: 8 }
          ]
        }
      ]
    },
    { text: 'Colaborador', style: 'h2', margin: [0, 14, 0, 4] },
    { text: nombre, fontSize: 12, bold: true },
    ...(empleado.diasAusenteSinGoce
      ? [{ text: `Días ausente sin goce en el período: ${empleado.diasAusenteSinGoce}`, color: PDF_MUTED, margin: [0, 2, 0, 0] }]
      : []),
    ...tablaConceptos(
      'Ingresos',
      [
        ...d.ingresos.map((x) => fila(x.label, x.monto)),
        fila('Total ingresos / bruto', d.bruto, { bold: true, fill: '#eaf0f6' })
      ]
    ),
    ...tablaConceptos('Deducciones de ley (TSS / DGII)', [
      ...d.legales.map((x) => fila(x.label, x.monto)),
      fila('Total deducciones de ley', d.totalLegales, { bold: true, fill: '#eaf0f6' })
    ]),
    ...(d.otrosDescuentos.length
      ? tablaConceptos('Otros descuentos', [
          ...d.otrosDescuentos.map((x) => fila(x.label, x.monto)),
          fila('Total otros descuentos', d.totalOtrosDescuentos, { bold: true, fill: '#eaf0f6' })
        ])
      : []),
    {
      table: {
        widths: ['*', 110],
        body: [
          fila('Total descuentos', d.totalDescuentos, { bold: true }),
          fila('NETO A PAGAR', d.neto, { bold: true, fill: PDF_AZUL, color: '#ffffff' })
        ]
      },
      layout: 'noBorders',
      margin: [0, 14, 0, 8]
    },
    {
      text: 'El neto a pagar ya descuenta AFP, SFS, ISR y los demás descuentos listados arriba.',
      fontSize: 8,
      color: PDF_MUTED
    }
  ];

  if (d.aportesPatronales.length) {
    stack.push(
      ...tablaConceptos(
        'Aportes del empleador (no se descuentan del colaborador)',
        d.aportesPatronales.map((x) => fila(x.label, x.monto))
      )
    );
  }

  stack.push({
    columns: [
      {
        stack: [
          { text: '______________________________', margin: [0, 36, 0, 2] },
          { text: 'Firma del colaborador', color: PDF_MUTED, fontSize: 8 }
        ]
      },
      {
        stack: [
          { text: '______________________________', margin: [0, 36, 0, 2], alignment: 'right' },
          { text: 'Firma / sello de la empresa', color: PDF_MUTED, fontSize: 8, alignment: 'right' }
        ]
      }
    ]
  });

  return {
    stack,
    ...(pageBreak ? { pageBreak: 'before' } : {})
  };
}

export function descargarRecibosNominaPdf(opts: {
  empresa: NominaReciboEmpresa;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  frecuencia: string;
  estado: string;
  periodKey: string;
  empleados: NominaReciboEmpleado[];
  modo?: 'download' | 'open';
}) {
  if (!opts.empleados?.length) {
    throw new Error('No hay colaboradores para generar recibos.');
  }

  const periodo = {
    inicio: opts.fechaInicio,
    fin: opts.fechaFin,
    frecuencia: opts.frecuencia,
    estado: opts.estado,
    periodKey: opts.periodKey
  };

  const content = opts.empleados.map((emp, i) =>
    contenidoRecibo(opts.empresa, periodo, emp, i > 0)
  );

  const uno = opts.empleados.length === 1;
  const nombreArchivo = uno
    ? `Recibo-nomina-${archivoSeguro(opts.empleados[0].nombreEmpleado || 'colaborador')}-${archivoSeguro(opts.periodKey)}.pdf`
    : `Recibos-nomina-${archivoSeguro(opts.periodKey)}.pdf`;

  const titulo = uno
    ? `Recibo de pago · ${opts.empleados[0].nombreEmpleado || 'Colaborador'}`
    : `Recibos de nómina · ${opts.periodKey}`;

  const def = pdfDocBase(titulo, { content });
  emitirPdf(def, nombreArchivo, opts.modo || 'download');
}
