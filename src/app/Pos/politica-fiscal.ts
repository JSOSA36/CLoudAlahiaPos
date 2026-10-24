/** Misma regla que PoliticaFiscalAutomatica en el API. */

export const CLAVE_POLITICA_FISCAL = 'AplicarPoliticaFiscalAutomatica';
export const CLAVE_PERMITIR_APAGAR_ITBIS_POS = 'PermitirApagarItbisPos';
export const TIPO_ECF_CONSUMO = 32;
export const TIPO_COMPROBANTE_CONSUMO = 'Consumidor Final';

export function politicaFiscalActiva(valor: string | null | undefined): boolean {
  const v = (valor ?? '').trim().toLowerCase();
  return v === 'true' || v === '1';
}

export function esBilleteraBhd(metodo: string | null | undefined): boolean {
  const n = (metodo ?? '').trim().toUpperCase();
  if (!n || n.includes('TRANSFER')) return false;
  return (n.includes('BILLET') && n.includes('BHD'))
    || (n.includes('BILLETERA') && n.includes('BHD'));
}

export function esTarjetaFiscal(metodo: string | null | undefined): boolean {
  if (esBilleteraBhd(metodo)) return false;
  const n = (metodo ?? '').trim().toUpperCase();
  if (!n || n.includes('TRANSFER') || n.includes('ACH') || n.includes('DEPOSITO') || n.includes('DEPÓSITO')) {
    return false;
  }
  return n.includes('TARJETA')
    || n.includes('VISA')
    || n.includes('MASTER')
    || n.includes('CARD')
    || n.includes('BILLET')
    || n.includes('AZUL')
    || n.includes('CARDNET')
    || n.includes('TDC');
}

function rncValido(rnc: string | null | undefined): boolean {
  const digits = (rnc ?? '').replace(/\D/g, '');
  if (digits.length !== 9 && digits.length !== 11) return false;
  return digits.split('').some(c => c !== '0');
}

function seleccionLegitima(
  tipoComprobante: string | null | undefined,
  tipoEcf: number | null | undefined,
  rnc: string | null | undefined
): boolean {
  const tipo = (tipoComprobante ?? '').trim().toLowerCase();
  if (tipoEcf === 45 || tipo === 'gubernamental') return true;
  const credito = tipoEcf === 31
    || tipo === 'crédito fiscal'
    || tipo === 'credito fiscal';
  return credito && rncValido(rnc);
}

export function debeForzarComprobanteConsumo(opts: {
  politicaActiva: boolean;
  facturacionElectronica: boolean;
  metodos: Array<string | null | undefined>;
  montos?: number[];
  tipoEcfDgii: number | null | undefined;
  tipoComprobante: string | null | undefined;
  rnc: string | null | undefined;
}): boolean {
  if (!opts.politicaActiva || !opts.facturacionElectronica) return false;
  if (seleccionLegitima(opts.tipoComprobante, opts.tipoEcfDgii, opts.rnc)) return false;

  const metodos = opts.metodos || [];
  const montos = opts.montos;
  const dispara = metodos.some((m, i) => {
    const monto = montos ? Number(montos[i]) : 1;
    if (!(monto > 0.009)) return false;
    return esBilleteraBhd(m) || esTarjetaFiscal(m);
  });
  return dispara;
}
