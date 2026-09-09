export interface SucursalSesion {
  idSucursal: number;
  codigo: string;
  nombre: string;
  esPrincipal: boolean;
  esDefault: boolean;
  activa: boolean;
  direccion?: string | null;
  telefono?: string | null;
  municipio?: string | null;
  provincia?: string | null;
  apiPrint?: string | null;
  idAlmacenPrincipal?: number | null;
}

export function normalizarSucursalSesion(raw: any): SucursalSesion | null {
  const id = Number(raw?.idSucursal ?? raw?.IdSucursal ?? 0);
  if (id <= 0) return null;
  return {
    idSucursal: id,
    codigo: String(raw?.codigo ?? raw?.Codigo ?? ''),
    nombre: String(raw?.nombre ?? raw?.Nombre ?? `Sucursal ${id}`),
    esPrincipal: !!(raw?.esPrincipal ?? raw?.EsPrincipal),
    esDefault: !!(raw?.esDefault ?? raw?.EsDefault),
    activa: raw?.activa !== false && raw?.Activa !== false,
    direccion: raw?.direccion ?? raw?.Direccion ?? null,
    telefono: raw?.telefono ?? raw?.Telefono ?? null,
    municipio: raw?.municipio ?? raw?.Municipio ?? null,
    provincia: raw?.provincia ?? raw?.Provincia ?? null,
    apiPrint: raw?.apiPrint ?? raw?.ApiPrint ?? null,
    idAlmacenPrincipal: raw?.idAlmacenPrincipal ?? raw?.IdAlmacenPrincipal ?? null
  };
}

export function direccionSucursalTexto(
  sucursal?: SucursalSesion | null,
  fallback = ''
): string {
  if (!sucursal) return fallback;
  const localidad = [sucursal.municipio, sucursal.provincia]
    .map(x => (x || '').trim())
    .filter(Boolean)
    .join(', ');
  const partes = [(sucursal.direccion || '').trim(), localidad].filter(Boolean);
  return partes.join(', ') || fallback;
}

export function normalizarSucursalesSesion(raw: any[] | null | undefined): SucursalSesion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizarSucursalSesion).filter((s): s is SucursalSesion => !!s);
}
