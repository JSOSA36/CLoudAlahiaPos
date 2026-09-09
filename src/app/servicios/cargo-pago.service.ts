import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export type CargoPagoTipo = 'PORCENTAJE' | 'MONTO_FIJO';
export type CargoPagoGrupo =
  | 'TARJETA'
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'CHEQUE'
  | 'TODOS'
  | 'PERSONALIZADO';

export interface CargoPagoRegla {
  idCargoPagoRegla: number;
  idEmpresa: number;
  nombre: string;
  tipo: CargoPagoTipo;
  valor: number;
  grupoMetodo: CargoPagoGrupo;
  /** Nombres exactos de MetodoPagoCuenta (API: lista o string pipe). */
  metodosVinculados?: string[] | string | null;
  activo: boolean;
  orden: number;
}

export interface CargoPagoAplicado {
  idCargoPagoRegla?: number | null;
  nombre: string;
  tipo: string;
  valor: number;
  baseCalculo: number;
  monto: number;
  metodoPago?: string | null;
}

export interface CargoPagoCalcularResult {
  baseCalculo: number;
  montoCargo: number;
  totalConCargo: number;
  cargos: CargoPagoAplicado[];
}

@Injectable({ providedIn: 'root' })
export class CargoPagoService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = `${this.config.apiUrl}/CargoPago`;
  }

  listar(idEmpresa: number): Observable<CargoPagoRegla[]> {
    return this.http.get<CargoPagoRegla[]>(`${this.baseUrl}/${idEmpresa}`);
  }

  guardar(regla: Partial<CargoPagoRegla>): Observable<CargoPagoRegla> {
    const id = Number(regla.idCargoPagoRegla) || 0;
    if (id > 0) {
      return this.http.put<CargoPagoRegla>(`${this.baseUrl}/${id}`, regla);
    }
    return this.http.post<CargoPagoRegla>(this.baseUrl, regla);
  }

  eliminar(idEmpresa: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${idEmpresa}/${id}`);
  }

  calcularLocal(
    reglas: CargoPagoRegla[] | null | undefined,
    metodos: Array<string | null | undefined>,
    baseCalculo: number
  ): CargoPagoCalcularResult {
    const base = Math.round(Math.max(0, Number(baseCalculo) || 0) * 100) / 100;
    const result: CargoPagoCalcularResult = {
      baseCalculo: base,
      montoCargo: 0,
      totalConCargo: base,
      cargos: []
    };

    const medios = [...new Set(
      (metodos || [])
        .map(m => (m || '').trim())
        .filter(m => m.length > 0 && m.toUpperCase() !== 'NOTACREDITO')
    )];

    if (base <= 0 || medios.length === 0) {
      return result;
    }

    const activas = (reglas || [])
      .filter(r => r.activo)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0) || a.idCargoPagoRegla - b.idCargoPagoRegla);

    for (const regla of activas) {
      const disparador = medios.find(m =>
        coincideRegla(regla.grupoMetodo, regla.metodosVinculados, m)
      );
      if (!disparador) continue;

      const monto = regla.tipo === 'MONTO_FIJO'
        ? Math.round((Number(regla.valor) || 0) * 100) / 100
        : Math.round(base * ((Number(regla.valor) || 0) / 100) * 100) / 100;

      if (monto <= 0) continue;

      result.cargos.push({
        idCargoPagoRegla: regla.idCargoPagoRegla,
        nombre: regla.nombre,
        tipo: regla.tipo,
        valor: regla.valor,
        baseCalculo: base,
        monto,
        metodoPago: disparador
      });
    }

    result.montoCargo = Math.round(result.cargos.reduce((s, c) => s + c.monto, 0) * 100) / 100;
    result.totalConCargo = Math.round((base + result.montoCargo) * 100) / 100;
    return result;
  }
}

/** Igual que CargoPagoMetodoMatcher.CoincideRegla en API. */
export function coincideRegla(
  grupoMetodo: string,
  metodosVinculados: string[] | string | null | undefined,
  metodoPago: string
): boolean {
  if (coincideVinculado(metodosVinculados, metodoPago)) return true;
  const grupo = (grupoMetodo || '').trim().toUpperCase();
  if (grupo === 'PERSONALIZADO') return false;
  return coincideGrupoMetodo(grupoMetodo, metodoPago);
}

export function coincideGrupoMetodo(grupoMetodo: string, metodoPago: string): boolean {
  const grupo = (grupoMetodo || '').trim().toUpperCase();
  const metodo = (metodoPago || '').trim().toUpperCase();
  if (!grupo || grupo === 'PERSONALIZADO') return false;
  if (grupo === 'TODOS') return metodo.length > 0 && metodo !== 'NOTACREDITO';
  if (!metodo) return false;

  switch (grupo) {
    case 'TARJETA':
      return esTarjeta(metodo);
    case 'EFECTIVO':
      return metodo.includes('EFECTIVO') || metodo.includes('CASH');
    case 'TRANSFERENCIA':
      return esTransferencia(metodo);
    case 'CHEQUE':
      return metodo.includes('CHEQUE') || metodo.includes('CHECK');
    default:
      return grupo === metodo;
  }
}

function splitVinculados(raw: string[] | string | null | undefined): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map(s => (s || '').trim()).filter(s => s.length > 0);
  }
  return String(raw)
    .split(/[|\n;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function coincideVinculado(
  metodosVinculados: string[] | string | null | undefined,
  metodoPago: string
): boolean {
  const metodo = (metodoPago || '').trim().toUpperCase();
  if (!metodo) return false;
  return splitVinculados(metodosVinculados).some(
    v => v.trim().toUpperCase() === metodo
  );
}

function esTarjeta(metodo: string): boolean {
  if (esTransferencia(metodo)) return false;
  return metodo.includes('TARJETA')
    || metodo.includes('VISA')
    || metodo.includes('MASTER')
    || metodo.includes('CARD')
    || metodo.includes('BILLET')
    || metodo.includes('AZUL')
    || metodo.includes('CARDNET')
    || metodo.includes('TDC');
}

function esTransferencia(metodo: string): boolean {
  return metodo.includes('TRANSFER')
    || metodo.includes('ACH')
    || metodo.includes('DEPOSITO')
    || metodo.includes('DEPÓSITO');
}
