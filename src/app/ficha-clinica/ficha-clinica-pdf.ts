import {
  FichaClinica,
  FichaClinicaCuentaLinea,
  FichaClinicaDiente,
  FichaClinicaVista
} from 'src/app/servicios/ficha-clinica.service';
import {
  PDF_AZUL as AZUL,
  PDF_MUTED as MUTED,
  PDF_TEXTO as TEXTO,
  emitirPdf,
  pdfEncabezado as encabezadoTabla,
  pdfFecha as fechaCorta,
  pdfMoneda as moneda,
  pdfTexto as texto
} from 'src/app/shared/pdf/pdfmake-core';

export interface FichaPdfDatos {
  empresa: string;
  ficha: FichaClinica;
  vista: FichaClinicaVista | null;
  edad: string;
  sexo: string;
  anamnesisActiva: string[];
  contagioActivo: string[];
  arcos: {
    superior: string[];
    inferior: string[];
  };
  dientes: FichaClinicaDiente[];
  cuenta: FichaClinicaCuentaLinea[];
}

function titulo(label: string) {
  return {
    text: label,
    style: 'h2',
    margin: [0, 12, 0, 6]
  };
}

function campo(label: string, valor?: string | number | null) {
  return {
    stack: [
      { text: label, style: 'label' },
      { text: texto(valor), style: 'valor' }
    ]
  };
}

function celdaDiente(numero: string, dientes: FichaClinicaDiente[]) {
  const hallazgo = dientes.find(d => d.numero === numero && (d.marcado || (d.nota || '').trim()));
  return {
    text: numero,
    alignment: 'center',
    fontSize: 8,
    bold: !!hallazgo,
    color: hallazgo ? '#922b21' : TEXTO,
    fillColor: hallazgo ? '#fdecea' : '#ffffff',
    margin: [0, 3, 0, 3]
  };
}

export function descargarFichaClinicaPdf(datos: FichaPdfDatos, nombreArchivo: string) {
  const f = datos.ficha;
  const paciente = `${texto(f.nombres)} ${texto(f.apellidos)}`.replace('— —', 'Paciente').trim();
  const hallazgos = (datos.dientes || []).filter(d => d.marcado || (d.nota || '').trim());
  const filasCuenta = (datos.cuenta || []).map(r => [
    fechaCorta(r.fecha),
    texto(r.numeroFactura),
    texto(r.diente),
    texto(r.trabajo),
    { text: moneda(r.costo), alignment: 'right' },
    { text: moneda(r.pagos), alignment: 'right' },
    { text: moneda(r.balance), alignment: 'right' }
  ]);

  const cuerpoCuenta: any[] = [
    encabezadoTabla(['Fecha', 'Factura', 'Diente', 'Trabajo', 'Costo', 'Pagos', 'Balance'])
  ];
  if (filasCuenta.length) {
    cuerpoCuenta.push(...filasCuenta);
  } else {
    cuerpoCuenta.push([
      { text: 'Sin facturas de este paciente.', colSpan: 7, alignment: 'center', color: MUTED },
      {}, {}, {}, {}, {}, {}
    ]);
  }
  cuerpoCuenta.push([
    { text: 'Totales', colSpan: 4, bold: true },
    {},
    {},
    {},
    { text: moneda(datos.vista?.totalCosto), alignment: 'right', bold: true },
    { text: moneda(datos.vista?.totalPagos), alignment: 'right', bold: true },
    { text: moneda(datos.vista?.totalBalance), alignment: 'right', bold: true }
  ]);

  const docDefinition: any = {
    pageSize: 'LETTER',
    pageMargins: [36, 48, 36, 40],
    defaultStyle: {
      fontSize: 9,
      color: TEXTO
    },
    styles: {
      h1: { fontSize: 16, bold: true, color: AZUL },
      sub: { fontSize: 10, color: MUTED, margin: [0, 2, 0, 0] },
      h2: { fontSize: 11, bold: true, color: AZUL },
      label: { fontSize: 7.5, bold: true, color: MUTED },
      valor: { fontSize: 9.5, margin: [0, 1, 0, 0] }
    },
    header: (pagina: number) =>
      pagina === 1
        ? null
        : {
            text: `${datos.empresa || 'Clínica'} · ${paciente} · Ficha clínica`,
            fontSize: 8,
            color: MUTED,
            margin: [36, 18, 36, 0]
          },
    footer: (pagina: number, total: number) => ({
      text: `Ficha clínica · Página ${pagina} de ${total}`,
      alignment: 'center',
      fontSize: 8,
      color: MUTED,
      margin: [0, 0, 0, 16]
    }),
    content: [
      { text: datos.empresa || 'Clínica dental', style: 'h1' },
      { text: 'Ficha clínica del paciente', style: 'sub', margin: [0, 0, 0, 10] },

      titulo('Datos personales'),
      {
        columns: [
          campo('Nombres', f.nombres),
          campo('Apellidos', f.apellidos),
          campo('Cédula / RNC', f.cedulaRnc)
        ],
        columnGap: 10
      },
      {
        columns: [
          campo('Edad', datos.edad),
          campo('Sexo', datos.sexo),
          campo('Estado civil', f.estadoCivil)
        ],
        columnGap: 10,
        margin: [0, 4, 0, 0]
      },
      {
        columns: [
          campo('Nacionalidad', f.nacionalidad),
          campo('Teléfono', f.telefono),
          campo('Celular', f.celular)
        ],
        columnGap: 10,
        margin: [0, 4, 0, 0]
      },
      {
        columns: [
          campo('Correo', f.email),
          campo('Contacto de emergencia', f.contactoEmergenciaNombre),
          campo('Tel. emergencia', f.contactoEmergenciaTelefono)
        ],
        columnGap: 10,
        margin: [0, 4, 0, 0]
      },
      { ...campo('Dirección', f.direccion), margin: [0, 4, 0, 0] },

      titulo('Anamnesis'),
      {
        text: datos.anamnesisActiva.length
          ? datos.anamnesisActiva.join(' · ')
          : 'Sin condiciones marcadas',
        margin: [0, 0, 0, 4]
      },
      { text: 'Enfermedades de contagio', style: 'label', margin: [0, 4, 0, 2] },
      {
        text: [
          datos.contagioActivo.length ? datos.contagioActivo.join(' · ') : 'Ninguna',
          f.anamnesis?.otraContagio ? ` · Otra: ${f.anamnesis.otraContagio}` : ''
        ].join(''),
        margin: [0, 0, 0, 4]
      },
      campo('Medicamentos', f.medicamentos),

      titulo('Odontograma'),
      {
        table: {
          widths: datos.arcos.superior.map(() => '*'),
          body: [
            datos.arcos.superior.map(n => celdaDiente(n, datos.dientes)),
            datos.arcos.inferior.map(n => celdaDiente(n, datos.dientes))
          ]
        },
        layout: {
          hLineColor: '#c5d0dc',
          vLineColor: '#c5d0dc'
        },
        margin: [0, 0, 0, 8]
      },
      hallazgos.length
        ? {
            table: {
              headerRows: 1,
              keepWithHeaderRows: 1,
              widths: [40, '*'],
              body: [
                encabezadoTabla(['Diente', 'Hallazgo']),
                ...hallazgos.map(d => [
                  d.numero,
                  texto(d.nota) === '—' ? 'Marcado' : texto(d.nota)
                ])
              ]
            },
            layout: 'lightHorizontalLines'
          }
        : { text: 'Sin hallazgos marcados.', color: MUTED },

      titulo('Observaciones y prótesis'),
      campo('Observaciones', f.observaciones),
      {
        columns: [
          campo('Color', f.color),
          campo('Tipo de prótesis', f.tipoProtesis),
          campo('Laboratorio', f.laboratorio)
        ],
        columnGap: 10,
        margin: [0, 4, 0, 0]
      },

      titulo('Cuenta del paciente'),
      {
        table: {
          widths: ['*', '*', '*'],
          body: [[
            {
              stack: [
                { text: 'COSTO', fontSize: 8, color: '#ffffff', alignment: 'center' },
                { text: moneda(datos.vista?.totalCosto), fontSize: 12, bold: true, color: '#ffffff', alignment: 'center' }
              ],
              fillColor: '#1b4f72',
              margin: [4, 8, 4, 8]
            },
            {
              stack: [
                { text: 'PAGOS', fontSize: 8, color: '#ffffff', alignment: 'center' },
                { text: moneda(datos.vista?.totalPagos), fontSize: 12, bold: true, color: '#ffffff', alignment: 'center' }
              ],
              fillColor: '#117a65',
              margin: [4, 8, 4, 8]
            },
            {
              stack: [
                { text: 'BALANCE', fontSize: 8, color: '#ffffff', alignment: 'center' },
                { text: moneda(datos.vista?.totalBalance), fontSize: 12, bold: true, color: '#ffffff', alignment: 'center' }
              ],
              fillColor: '#b9770e',
              margin: [4, 8, 4, 8]
            }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          dontBreakRows: true,
          widths: [62, 58, 36, '*', 68, 68, 68],
          body: cuerpoCuenta
        },
        layout: {
          fillColor: (rowIndex: number, node: any) => {
            if (rowIndex === 0) {
              return AZUL;
            }
            if (rowIndex === node.table.body.length - 1) {
              return '#eaf0f6';
            }
            return rowIndex % 2 === 0 ? '#f4f8fb' : null;
          },
          hLineColor: '#d7e3ee',
          vLineColor: '#d7e3ee'
        }
      }
    ]
  };

  emitirPdf(docDefinition, nombreArchivo);
}
