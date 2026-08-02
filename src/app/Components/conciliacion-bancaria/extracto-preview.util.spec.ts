import {
  calcularTotalesPreview,
  diferenciaSaldoPreview,
  erroresLineaPreview,
  erroresPreview,
  esLineaPreviewValida,
  nuevaLineaPreview
} from './extracto-preview.util';
import { ExtractoPreviewLinea } from 'src/app/models/Tesoreria.models';

describe('extracto-preview.util', () => {
  const base: ExtractoPreviewLinea = {
    fechaMovimiento: '2026-07-01',
    descripcion: 'Pago',
    debito: 100,
    credito: 0
  };

  it('calcula totales y monto neto', () => {
    const lineas: ExtractoPreviewLinea[] = [
      { ...base, debito: 100.5, credito: 0 },
      { ...base, debito: 0, credito: 250.25 }
    ];
    const t = calcularTotalesPreview(lineas);
    expect(t.cantidadLineas).toBe(2);
    expect(t.totalDebitos).toBe(100.5);
    expect(t.totalCreditos).toBe(250.25);
    expect(t.montoNeto).toBe(149.75);
  });

  it('valida línea correcta', () => {
    expect(esLineaPreviewValida(base)).toBeTrue();
    expect(erroresLineaPreview(base)).toEqual([]);
  });

  it('rechaza fecha inválida', () => {
    expect(erroresLineaPreview({ ...base, fechaMovimiento: '' })).toContain('Fecha inválida');
    expect(erroresLineaPreview({ ...base, fechaMovimiento: 'no-fecha' })).toContain('Fecha inválida');
  });

  it('rechaza montos negativos', () => {
    expect(erroresLineaPreview({ ...base, debito: -1 })).toContain('Débito inválido');
    expect(erroresLineaPreview({ ...base, debito: 0, credito: -5 })).toContain('Crédito inválido');
  });

  it('rechaza línea sin monto o con ambos montos', () => {
    expect(erroresLineaPreview({ ...base, debito: 0, credito: 0 }))
      .toContain('Indique débito o crédito');
    expect(erroresLineaPreview({ ...base, debito: 10, credito: 10 }))
      .toContain('Use débito o crédito, no ambos');
  });

  it('erroresPreview exige al menos una línea y numera las inválidas', () => {
    expect(erroresPreview([])).toEqual(['El extracto debe tener al menos una línea.']);
    const errores = erroresPreview([base, { ...base, debito: 0, credito: 0 }]);
    expect(errores.length).toBe(1);
    expect(errores[0]).toContain('Línea 2');
  });

  it('calcula diferencia de saldo declarado vs calculado', () => {
    const lineas: ExtractoPreviewLinea[] = [
      { ...base, debito: 100, credito: 0 },
      { ...base, debito: 0, credito: 300 }
    ];
    // 1000 + (300 - 100) = 1200 → declarado 1250 → diferencia 50
    expect(diferenciaSaldoPreview({ saldoInicial: 1000, saldoFinal: 1250 }, lineas)).toBe(50);
    expect(diferenciaSaldoPreview({ saldoInicial: 1000, saldoFinal: 1200 }, lineas)).toBe(0);
    expect(diferenciaSaldoPreview({ saldoInicial: null, saldoFinal: 1200 }, lineas)).toBeNull();
  });

  it('nuevaLineaPreview arranca vacía y válida como base editable', () => {
    const l = nuevaLineaPreview('2026-07-15');
    expect(l.fechaMovimiento).toBe('2026-07-15');
    expect(l.debito).toBe(0);
    expect(l.credito).toBe(0);
  });
});
