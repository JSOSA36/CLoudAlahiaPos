import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class RrhhService {
  private readonly baseUrl: string;

  constructor(private http: HttpClient, config: AppConfigService) {
    this.baseUrl = `${config.apiUrl}/rrhh`;
  }

  departamentos(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/departamentos/${idEmpresa}`);
  }
  saveDepartamento(body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/departamentos`, body);
  }
  cargos(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cargos/${idEmpresa}`);
  }
  saveCargo(body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/cargos`, body);
  }
  beneficios(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/beneficios/${idEmpresa}`);
  }
  saveBeneficio(body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/beneficios`, body);
  }
  consumoColaborador(idEmpresa: number): Observable<Array<{
    idEmpleados: number;
    nombre: string;
    porcentaje: number;
    descontarNomina: boolean;
  }>> {
    return this.http.get<Array<{
      idEmpleados: number;
      nombre: string;
      porcentaje: number;
      descontarNomina: boolean;
    }>>(`${this.baseUrl}/consumo-colaborador/${idEmpresa}`);
  }
  jornadas(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/jornadas/${idEmpresa}`);
  }
  saveJornada(body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/jornadas`, body);
  }
  turnos(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/turnos/${idEmpresa}`);
  }
  saveTurno(body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/turnos`, body);
  }
  horarios(idEmpresa: number, idEmpleados?: number): Observable<any[]> {
    let params = new HttpParams();
    if (idEmpleados) params = params.set('idEmpleados', idEmpleados);
    return this.http.get<any[]>(`${this.baseUrl}/horarios/${idEmpresa}`, { params });
  }
  saveHorario(body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/horarios`, body);
  }
  tiposAusencia(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tipos-ausencia/${idEmpresa}`);
  }

  miEmpleado(idEmpresa: number): Observable<{ idEmpleados: number }> {
    return this.http.get<{ idEmpleados: number }>(`${this.baseUrl}/mi-empleado/${idEmpresa}`);
  }
  ponchar(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ponchar`, body);
  }
  ponchadas(idEmpresa: number, idEmpleados: number, desde: string, hasta: string): Observable<any> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get(`${this.baseUrl}/ponchadas/${idEmpresa}/${idEmpleados}`, { params });
  }
  solicitarCorreccion(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/correcciones`, body);
  }
  correcciones(idEmpresa: number, estado?: string): Observable<any[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<any[]>(`${this.baseUrl}/correcciones/${idEmpresa}`, { params });
  }
  decidirCorreccion(id: number, aprobar: boolean, comentario?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/correcciones/${id}/decidir?aprobar=${aprobar}`, { comentario });
  }

  solicitarAusencia(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ausencias`, body);
  }
  ausencias(idEmpresa: number, opts?: { idEmpleados?: number; desde?: string; hasta?: string; estado?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (opts?.idEmpleados) params = params.set('idEmpleados', opts.idEmpleados);
    if (opts?.desde) params = params.set('desde', opts.desde);
    if (opts?.hasta) params = params.set('hasta', opts.hasta);
    if (opts?.estado) params = params.set('estado', opts.estado);
    return this.http.get<any[]>(`${this.baseUrl}/ausencias/${idEmpresa}`, { params });
  }
  decidirAusencia(id: number, aprobar: boolean, comentario?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/ausencias/${id}/decidir?aprobar=${aprobar}`, { comentario });
  }
  prestamos(idEmpresa: number, idEmpleados?: number): Observable<any[]> {
    let params = new HttpParams();
    if (idEmpleados) params = params.set('idEmpleados', idEmpleados);
    return this.http.get<any[]>(`${this.baseUrl}/prestamos/${idEmpresa}`, { params });
  }
  crearPrestamo(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/prestamos`, body);
  }
  anticipos(idEmpresa: number, idEmpleados?: number): Observable<any[]> {
    let params = new HttpParams();
    if (idEmpleados) params = params.set('idEmpleados', idEmpleados);
    return this.http.get<any[]>(`${this.baseUrl}/anticipos/${idEmpresa}`, { params });
  }
  crearAnticipo(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/anticipos`, body);
  }

  calcularAsistencia(body: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/asistencia/calcular`, body);
  }
  asistencia(idEmpresa: number, desde: string, hasta: string, idEmpleados?: number): Observable<any[]> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (idEmpleados) params = params.set('idEmpleados', idEmpleados);
    return this.http.get<any[]>(`${this.baseUrl}/asistencia/${idEmpresa}`, { params });
  }

  nominas(idEmpresa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/nomina/${idEmpresa}`);
  }
  nomina(idEmpresa: number, id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/nomina/${idEmpresa}/${id}`);
  }
  crearNomina(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/nomina`, body);
  }
  generarNomina(idEmpresa: number, id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/nomina/${idEmpresa}/${id}/generar`, {});
  }
  estadoNomina(idEmpresa: number, id: number, estado: string, comentario?: string, idCuentaFinanciera?: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/nomina/${idEmpresa}/${id}/estado?estado=${encodeURIComponent(estado)}`, {
      comentario,
      idCuentaFinanciera: idCuentaFinanciera || null
    });
  }
  enviarRecibosNomina(idEmpresa: number, id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/nomina/${idEmpresa}/${id}/enviar-recibos`, {});
  }

  kioscoRostros(idEmpresa: number): Observable<RrhhEmpleadoRostroEstado[]> {
    return this.http.get<RrhhEmpleadoRostroEstado[]>(`${this.baseUrl}/kiosco/rostros/${idEmpresa}`);
  }
  kioscoEnrolar(body: {
    idEmpresa: number;
    idEmpleados: number;
    embeddings: number[][];
    consentimiento: boolean;
    permitirPinExcepcion: boolean;
    pin?: string;
  }): Observable<RrhhEmpleadoRostroEstado> {
    return this.http.post<RrhhEmpleadoRostroEstado>(`${this.baseUrl}/kiosco/enrolar`, body);
  }
  kioscoEstadoRostro(body: { idEmpresa: number; idEmpleados: number; activo: boolean }): Observable<RrhhEmpleadoRostroEstado> {
    return this.http.post<RrhhEmpleadoRostroEstado>(`${this.baseUrl}/kiosco/rostro/estado`, body);
  }
  kioscoPoncharFacial(body: {
    idEmpresa: number;
    embedding: number[];
    livenessOk: boolean;
    dispositivo?: string;
  }): Observable<RrhhKioscoPoncharResult> {
    return this.http.post<RrhhKioscoPoncharResult>(`${this.baseUrl}/kiosco/ponchar-facial`, body);
  }
  kioscoPoncharPin(body: {
    idEmpresa: number;
    idEmpleados: number;
    pin: string;
    motivo: string;
    dispositivo?: string;
  }): Observable<RrhhKioscoPoncharResult> {
    return this.http.post<RrhhKioscoPoncharResult>(`${this.baseUrl}/kiosco/ponchar-pin`, body);
  }
  kioscoRecientes(idEmpresa: number): Observable<RrhhPonchadaReciente[]> {
    return this.http.get<RrhhPonchadaReciente[]>(`${this.baseUrl}/kiosco/recientes/${idEmpresa}`);
  }

  dispositivos(idEmpresa: number): Observable<RrhhDispositivo[]> {
    return this.http.get<RrhhDispositivo[]>(`${this.baseUrl}/dispositivos/${idEmpresa}`);
  }
  saveDispositivo(body: Partial<RrhhDispositivo>): Observable<RrhhDispositivo> {
    return this.http.put<RrhhDispositivo>(`${this.baseUrl}/dispositivos`, body);
  }
  dispositivoPersonas(idEmpresa: number): Observable<RrhhDispositivoPersona[]> {
    return this.http.get<RrhhDispositivoPersona[]>(`${this.baseUrl}/dispositivos/${idEmpresa}/personas`);
  }
  saveDispositivoPersona(body: Partial<RrhhDispositivoPersona>): Observable<RrhhDispositivoPersona> {
    return this.http.put<RrhhDispositivoPersona>(`${this.baseUrl}/dispositivos/personas`, body);
  }
  dispositivoIngestas(idEmpresa: number): Observable<RrhhDispositivoIngesta[]> {
    return this.http.get<RrhhDispositivoIngesta[]>(`${this.baseUrl}/dispositivos/${idEmpresa}/ingestas`);
  }
  probarDispositivo(body: {
    idEmpresa: number;
    idDispositivo?: number;
    direccionIp?: string;
    puerto?: number;
  }): Observable<{ ok: boolean; mensaje: string; direccionIp?: string; puerto: number; tiempoMs: number }> {
    return this.http.post<{ ok: boolean; mensaje: string; direccionIp?: string; puerto: number; tiempoMs: number }>(
      `${this.baseUrl}/dispositivos/probar`,
      body
    );
  }
}

export interface RrhhEmpleadoRostroEstado {
  idEmpleados: number;
  nombre: string;
  enrolado: boolean;
  activo: boolean;
  permitirPinExcepcion: boolean;
  tienePin: boolean;
  fechaEnrolamiento?: string;
  muestras: number;
}

export interface RrhhKioscoPoncharResult {
  ok: boolean;
  mensaje: string;
  idEmpleados: number;
  nombre: string;
  tipo: string;
  fechaHora: string;
  distancia: number;
  duplicada: boolean;
  origen: string;
}

export interface RrhhPonchadaReciente {
  idPonchada: number;
  idEmpleados: number;
  nombre: string;
  fechaHora: string;
  tipo: string;
  origen: string;
}

export interface RrhhDispositivo {
  idDispositivo: number;
  idEmpresa: number;
  serial: string;
  nombre: string;
  proveedor: string;
  token?: string;
  direccionIp?: string;
  puerto?: number;
  claveComunicacion?: string;
  activo: boolean;
  ultimaComunicacion?: string;
}

export interface RrhhDispositivoPersona {
  idPersonaDispositivo: number;
  idEmpresa: number;
  idEmpleados: number;
  nombreEmpleado: string;
  codigoDispositivo: string;
  activo: boolean;
}

export interface RrhhDispositivoIngesta {
  idIngesta: number;
  serial: string;
  codigoDispositivo?: string;
  idEmpleados?: number;
  nombreEmpleado?: string;
  fechaHoraReloj?: string;
  estado: string;
  detalle?: string;
  fecha: string;
}
