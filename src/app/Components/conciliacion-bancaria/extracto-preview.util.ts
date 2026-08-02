import { ExtractoPreview, ExtractoPreviewLinea } from 'src/app/models/Tesoreria.models';

/** Helpers puros del wizard de vista previa de extracto (testeables sin Ionic). */

export interface PreviewTotales {
  cantidadLineas: number;
  totalDebitos: number;
  totalCreditos: number;
  montoNeto: number;
}

export function calcularTotalesPreview(lineas: ExtractoPreviewLinea[]): PreviewTotales {
  const totalDebitos = redondear(lineas.reduce((acc, l) => acc + (Number(l.debito) || 0), 0));
  const totalCreditos = redondear(lineas.reduce((acc, l) => acc + (Number(l.credito) || 0), 0));
  return {
    cantidadLineas: lineas.length,
    totalDebitos,
    totalCreditos,
    montoNeto: redondear(totalCreditos - totalDebitos)
  };
}

export function erroresLineaPreview(linea: ExtractoPreviewLinea): string[] {
  const errores: string[] = [];
  if (!linea.fechaMovimiento || isNaN(new Date(linea.fechaMovimiento).getTime())) {
    errores.push('Fecha inválida');
  }
  const debito = Number(linea.debito);
  const credito = Number(linea.credito);
  if (isNaN(debito) || debito < 0) {
    errores.push('Débito inválido');
  }
  if (isNaN(credito) || credito < 0) {
    errores.push('Crédito inválido');
  }
  if (!errores.length) {
    if (debito === 0 && credito === 0) {
      errores.push('Indique débito o crédito');
    } else if (debito > 0 && credito > 0) {
      errores.push('Use débito o crédito, no ambos');
    }
  }
  return errores;
}

export function esLineaPreviewValida(linea: ExtractoPreviewLinea): boolean {
  return erroresLineaPreview(linea).length === 0;
}

/** Errores bloqueantes de todo el preview (líneas + reglas globales). */
export function erroresPreview(lineas: ExtractoPreviewLinea[]): string[] {
  const errores: string[] = [];
  if (!lineas.length) {
    errores.push('El extracto debe tener al menos una línea.');
    return errores;
  }
  lineas.forEach((l, i) => {
    const errsLinea = erroresLineaPreview(l);
    if (errsLinea.length) {
      errores.push(`Línea ${i + 1}: ${errsLinea.join(', ')}.`);
    }
  });
  return errores;
}

/**
 * Diferencia entre el saldo final declarado y el calculado
 * (saldo inicial + créditos - débitos). Null si faltan saldos declarados.
 */
export function diferenciaSaldoPreview(
  preview: Pick<ExtractoPreview, 'saldoInicial' | 'saldoFinal'>,
  lineas: ExtractoPreviewLinea[]
): number | null {
  if (preview.saldoInicial == null || preview.saldoFinal == null) return null;
  const totales = calcularTotalesPreview(lineas);
  const calculado = Number(preview.saldoInicial) + totales.montoNeto;
  return redondear(Number(preview.saldoFinal) - calculado);
}

export function nuevaLineaPreview(fechaBase?: string): ExtractoPreviewLinea {
  return {
    fechaMovimiento: fechaBase || new Date().toISOString().split('T')[0],
    descripcion: '',
    referencia: '',
    debito: 0,
    credito: 0,
    balance: null
  };
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
