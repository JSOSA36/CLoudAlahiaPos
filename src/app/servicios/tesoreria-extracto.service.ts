import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  ActualizarExtractoPreviewPayload,
  ConfirmarExtractoMatchPayload,
  CrearMovimientoDesdeExtractoPayload,
  ExtractoLineaMatch,
  ExtractoPreview,
  ExtractoResumen,
  ImportarExtractoPayload,
  ResolverExtractoLineaPayload,
  ResolverExtractoLineaResultado,
  TesoreriaExtractoImport
} from '../models/Tesoreria.models';

@Injectable({ providedIn: 'root' })
export class TesoreriaExtractoService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/TesoreriaExtracto`;
  }

  importar(payload: ImportarExtractoPayload): Observable<TesoreriaExtractoImport> {
    return this.http.post<TesoreriaExtractoImport>(`${this.baseUrl}/Importar`, payload);
  }

  importarArchivo(
    idEmpresa: number,
    idCuentaFinanciera: number,
    idUsuario: number,
    archivo: File
  ): Observable<TesoreriaExtractoImport> {
    const form = new FormData();
    form.append('idEmpresa', String(idEmpresa));
    form.append('idCuentaFinanciera', String(idCuentaFinanciera));
    form.append('idUsuario', String(idUsuario));
    form.append('archivo', archivo, archivo.name);
    return this.http.post<TesoreriaExtractoImport>(`${this.baseUrl}/ImportarArchivo`, form);
  }

  // ---------------------------------------------------------------------------
  // Flujo de vista previa (wizard de importación).
  // Contrato asumido; si el backend final difiere, ajustar solo estos 4 métodos
  // y las interfaces ExtractoPreview* en Tesoreria.models.ts.
  // ---------------------------------------------------------------------------

  /** Analiza el archivo sin importar definitivamente: POST /TesoreriaExtracto/PreviewArchivo (multipart). */
  previewArchivo(
    idEmpresa: number,
    idCuentaFinanciera: number,
    idUsuario: number,
    archivo: File
  ): Observable<ExtractoPreview> {
    const form = new FormData();
    form.append('idEmpresa', String(idEmpresa));
    form.append('idCuentaFinanciera', String(idCuentaFinanciera));
    form.append('idUsuario', String(idUsuario));
    form.append('archivo', archivo, archivo.name);
    return this.http.post<ExtractoPreview>(`${this.baseUrl}/PreviewArchivo`, form);
  }

  /** Guarda correcciones del preview: PUT /TesoreriaExtracto/{empresa}/{import}/Preview/Lineas. */
  actualizarPreview(
    idImport: number,
    payload: ActualizarExtractoPreviewPayload
  ): Observable<ExtractoPreview> {
    return this.http.put<ExtractoPreview>(
      `${this.baseUrl}/${payload.idEmpresa}/${idImport}/Preview/Lineas`,
      payload
    );
  }

  /** Convierte la vista previa en import definitivo: POST /TesoreriaExtracto/{empresa}/{import}/Confirmar. */
  confirmarPreview(
    idEmpresa: number,
    idImport: number,
    idUsuario: number
  ): Observable<TesoreriaExtractoImport> {
    return this.http.post<TesoreriaExtractoImport>(
      `${this.baseUrl}/${idEmpresa}/${idImport}/Confirmar?idUsuario=${idUsuario}`,
      {}
    );
  }

  /** Descarta una vista previa no confirmada: POST /TesoreriaExtracto/{empresa}/{import}/DescartarPreview. */
  descartarPreview(idEmpresa: number, idImport: number, idUsuario: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${idEmpresa}/${idImport}/DescartarPreview?idUsuario=${idUsuario}`,
      {}
    );
  }

  getById(idEmpresa: number, idImport: number): Observable<TesoreriaExtractoImport> {
    return this.http.get<TesoreriaExtractoImport>(
      `${this.baseUrl}/${idEmpresa}/${idImport}`
    );
  }

  sugerencias(idEmpresa: number, idImport: number): Observable<ExtractoLineaMatch[]> {
    return this.http.get<ExtractoLineaMatch[]>(
      `${this.baseUrl}/${idEmpresa}/${idImport}/Sugerencias`
    );
  }

  resumen(idEmpresa: number, idImport: number): Observable<ExtractoResumen> {
    return this.http.get<ExtractoResumen>(
      `${this.baseUrl}/${idEmpresa}/${idImport}/Resumen`
    );
  }

  cerrar(idEmpresa: number, idImport: number, idUsuario: number): Observable<ExtractoResumen> {
    return this.http.post<ExtractoResumen>(
      `${this.baseUrl}/${idEmpresa}/${idImport}/Cerrar?idUsuario=${idUsuario}`,
      {}
    );
  }

  resolverLinea(payload: ResolverExtractoLineaPayload): Observable<ResolverExtractoLineaResultado> {
    return this.http.post<ResolverExtractoLineaResultado>(
      `${this.baseUrl}/ResolverLinea`,
      payload
    );
  }

  confirmarMatch(payload: ConfirmarExtractoMatchPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/ConfirmarMatch`, payload);
  }

  descartar(idEmpresa: number, idLinea: number, idUsuario: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${idEmpresa}/${idLinea}/Descartar?idUsuario=${idUsuario}`,
      {}
    );
  }

  crearMovimiento(payload: CrearMovimientoDesdeExtractoPayload): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/CrearMovimiento`, payload);
  }
}
