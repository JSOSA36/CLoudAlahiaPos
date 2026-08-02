import {
  contarLineasBanco,
  esBloqueoBrechaAcumulada,
  esPendienteBanco,
  esResueltaBanco,
  etiquetaExtractoCubierto,
  etiquetaPeriodoConciliacion,
  extractoCubrePeriodoCompleto,
  filtrarLineasBanco,
  mensajeCierreExitoso,
  metricasConciliacionUx,
  puedeCerrarPorContrato,
  puedeEditarSesion
} from './conciliacion-workbench.util';
import { ConciliacionLineaBanco, ConciliacionWorkspace } from 'src/app/models/Tesoreria.models';

describe('conciliacion-workbench.util', () => {
  const base: ConciliacionLineaBanco = {
    idTesoreriaExtractoLinea: 1,
    fechaMovimiento: '2026-07-01',
    debito: 10,
    credito: 0,
    montoNeto: -10,
    estadoMatch: 'PENDIENTE'
  };

  it('filtra pendientes con el set canónico (incluye DUPLICADO/DIFERENCIA)', () => {
    const lineas: ConciliacionLineaBanco[] = [
      { ...base, estadoMatch: 'PENDIENTE' },
      { ...base, idTesoreriaExtractoLinea: 2, estadoMatch: 'AUTO_CONCILIADO' },
      { ...base, idTesoreriaExtractoLinea: 3, estadoMatch: 'AMBIGUO' },
      { ...base, idTesoreriaExtractoLinea: 4, estadoMatch: 'DUPLICADO' },
      { ...base, idTesoreriaExtractoLinea: 5, estadoMatch: 'DIFERENCIA' },
      { ...base, idTesoreriaExtractoLinea: 6, estadoMatch: 'IGNORADO' }
    ];
    expect(filtrarLineasBanco(lineas, 'PENDIENTES').map(x => x.idTesoreriaExtractoLinea))
      .toEqual([1, 3, 4, 5]);
    expect(filtrarLineasBanco(lineas, 'RESUELTAS').map(x => x.idTesoreriaExtractoLinea))
      .toEqual([2, 6]);
  });

  it('cuenta KPIs desde las mismas líneas que los filtros', () => {
    const lineas: ConciliacionLineaBanco[] = [
      { ...base, estadoMatch: 'PENDIENTE' },
      { ...base, idTesoreriaExtractoLinea: 2, estadoMatch: 'SUGERIDO' },
      { ...base, idTesoreriaExtractoLinea: 3, estadoMatch: 'CONFIRMADO' },
      { ...base, idTesoreriaExtractoLinea: 4, estadoMatch: 'IGNORADO' },
      { ...base, idTesoreriaExtractoLinea: 5, estadoMatch: 'DUPLICADO' }
    ];
    const conteo = contarLineasBanco(lineas);
    expect(conteo.total).toBe(5);
    expect(conteo.pendientes).toBe(3);
    expect(conteo.conciliadas).toBe(1);
    expect(conteo.excluidas).toBe(1);
    expect(conteo.resueltas).toBe(2);
    expect(conteo.pendientes).toBe(filtrarLineasBanco(lineas, 'PENDIENTES').length);
    expect(conteo.resueltas).toBe(filtrarLineasBanco(lineas, 'RESUELTAS').length);
    expect(esPendienteBanco('DIFERENCIA')).toBeTrue();
    expect(esResueltaBanco('DESCARTADO')).toBeTrue();
  });

  it('bloquea edición si cerrada', () => {
    const ws = {
      conciliacion: { estado: 'CERRADA' }
    } as ConciliacionWorkspace;
    expect(puedeEditarSesion(ws)).toBeFalse();
    expect(puedeEditarSesion(null)).toBeFalse();
  });

  it('etiqueta período y extracto de forma descriptiva', () => {
    expect(etiquetaPeriodoConciliacion('2026-07-22', '2026-07-22')).toBe('22/07/2026 – 22/07/2026');
    expect(etiquetaExtractoCubierto({
      idTesoreriaExtractoImport: 16,
      periodoDesde: '2026-07-22',
      periodoHasta: '2026-07-22'
    })).toBe('#16 (22/07/2026)');
    expect(etiquetaExtractoCubierto({
      idTesoreriaExtractoImport: 16,
      periodoDesde: '2026-07-01',
      periodoHasta: '2026-07-31'
    })).toBe('Julio 2026 (#16)');
  });

  it('detecta cuando el extracto no cubre el período completo', () => {
    expect(extractoCubrePeriodoCompleto(
      '2026-07-01', '2026-07-31',
      '2026-07-22', '2026-07-22'
    )).toBeFalse();
    expect(extractoCubrePeriodoCompleto(
      '2026-07-22', '2026-07-22',
      '2026-07-22', '2026-07-22'
    )).toBeTrue();
    expect(extractoCubrePeriodoCompleto(
      '2026-07-01', '2026-07-31',
      null, null,
      [{ fechaMovimiento: '2026-07-22' }]
    )).toBeFalse();
  });

  it('separa diferencia de período de variación histórica (caso tipo #18)', () => {
    const m = metricasConciliacionUx(
      {
        saldoLibrosInicial: 1000,
        saldoLibrosFinal: 28621.75,
        saldoBancoFinal: 27385.75,
        montoConciliadoBanco: 100,
        montoPendienteBanco: 0,
        montoPendienteLibro: 0,
        diferencia: -1236,
        brechaBalanceCuenta: -1236,
        variacionHistorica: 1236,
        diferenciaPeriodo: 0,
        toleranciaDiferencia: 0.01,
        extractoCompletamenteResuelto: true
      },
      0,
      0
    );
    expect(m.estadoSesion).toBe('LISTA');
    expect(m.etiquetaEstadoSesion).toBe('Lista');
    expect(m.diferenciaPeriodo).toBe(0);
    expect(m.variacionHistorica).toBe(1236);
    expect(m.brechaBalanceCuenta).toBe(-1236);
    expect(m.hayVariacionHistorica).toBeTrue();
    expect(mensajeCierreExitoso(m)).toContain('historia previa');
  });

  it('marca con pendientes cuando hay líneas de banco sin resolver', () => {
    const m = metricasConciliacionUx(
      {
        saldoLibrosInicial: 0,
        saldoLibrosFinal: 100,
        saldoBancoFinal: 100,
        montoConciliadoBanco: 0,
        montoPendienteBanco: 50,
        montoPendienteLibro: 0,
        diferencia: 0,
        diferenciaPeriodo: 0,
        toleranciaDiferencia: 0.01,
        extractoCompletamenteResuelto: false
      },
      2,
      0
    );
    expect(m.estadoSesion).toBe('CON_PENDIENTES');
  });

  it('ignora bloqueo legacy de brecha acumulada y permite cerrar', () => {
    const m = metricasConciliacionUx(
      {
        saldoLibrosInicial: 1000,
        saldoLibrosFinal: 28621.75,
        saldoBancoFinal: 27385.75,
        montoConciliadoBanco: 100,
        montoPendienteBanco: 0,
        montoPendienteLibro: 0,
        diferencia: -1236,
        brechaBalanceCuenta: -1236,
        variacionHistorica: 1236,
        diferenciaPeriodo: 0,
        toleranciaDiferencia: 0.01,
        extractoCompletamenteResuelto: true
      },
      0,
      0
    );
    expect(esBloqueoBrechaAcumulada('La diferencia -1,236.00 excede la tolerancia 0.01.')).toBeTrue();
    expect(esBloqueoBrechaAcumulada(
      'La diferencia de conciliación del período 50.00 excede la tolerancia 0.01.'
    )).toBeFalse();

    const ev = puedeCerrarPorContrato(
      m,
      ['La diferencia -1,236.00 excede la tolerancia 0.01.'],
      { tieneExtractoOLineas: true }
    );
    expect(ev.puedeCerrar).toBeTrue();
    expect(ev.bloqueos.length).toBe(0);
  });
});
