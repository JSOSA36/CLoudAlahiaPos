import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import {
  DeliveryRepartidor,
  PedidoDeliveryListado,
  PedidoOnlineCanalEmpresa,
  PedidoOnlineCheckout,
  PedidoOnlineConfirmacion,
  PedidoOnlineHistorialItem,
  PedidoOnlineMenu,
  PedidoOnlinePerfil,
  PedidoOnlineSeguimiento
} from '../models/pedidos-online.models';

@Injectable({ providedIn: 'root' })
export class PedidosOnlineService {
  private readonly publicUrl: string;
  private readonly deliveryUrl: string;

  constructor(private http: HttpClient, config: AppConfigService) {
    this.publicUrl = `${config.apiUrl}/pedidos-online`;
    this.deliveryUrl = `${config.apiUrl}/pedidos-delivery`;
  }

  menu(slug: string): Observable<PedidoOnlineMenu> {
    return this.http.get<PedidoOnlineMenu>(`${this.publicUrl}/${encodeURIComponent(slug)}/menu`);
  }

  crearPedido(slug: string, body: PedidoOnlineCheckout): Observable<PedidoOnlineConfirmacion> {
    return this.http.post<PedidoOnlineConfirmacion>(
      `${this.publicUrl}/${encodeURIComponent(slug)}`,
      body
    );
  }

  seguimiento(slug: string, idPedidoOnline: number, telefono: string): Observable<PedidoOnlineSeguimiento> {
    return this.http.get<PedidoOnlineSeguimiento>(
      `${this.publicUrl}/${encodeURIComponent(slug)}/seguimiento`,
      {
        params: new HttpParams()
          .set('idPedidoOnline', String(idPedidoOnline))
          .set('telefono', telefono)
      }
    );
  }

  perfil(slug: string, telefono: string): Observable<PedidoOnlinePerfil> {
    return this.http.get<PedidoOnlinePerfil>(
      `${this.publicUrl}/${encodeURIComponent(slug)}/perfil`,
      { params: new HttpParams().set('telefono', telefono) }
    );
  }

  guardarPerfil(slug: string, body: {
    telefono: string;
    nombre?: string;
    direccion?: string;
    referencia?: string;
    latitud?: number;
    longitud?: number;
  }): Observable<PedidoOnlinePerfil> {
    return this.http.post<PedidoOnlinePerfil>(
      `${this.publicUrl}/${encodeURIComponent(slug)}/perfil`,
      body
    );
  }

  misPedidos(slug: string, telefono: string): Observable<PedidoOnlineHistorialItem[]> {
    return this.http.get<PedidoOnlineHistorialItem[]>(
      `${this.publicUrl}/${encodeURIComponent(slug)}/mis-pedidos`,
      { params: new HttpParams().set('telefono', telefono) }
    );
  }

  canal(idEmpresa: number): Observable<PedidoOnlineCanalEmpresa> {
    return this.http.get<PedidoOnlineCanalEmpresa>(`${this.deliveryUrl}/canal`, {
      params: this.empresa(idEmpresa)
    });
  }

  cola(idEmpresa: number): Observable<PedidoDeliveryListado[]> {
    return this.http.get<PedidoDeliveryListado[]>(`${this.deliveryUrl}/cola`, {
      params: this.empresa(idEmpresa)
    });
  }

  listar(idEmpresa: number): Observable<PedidoDeliveryListado[]> {
    return this.http.get<PedidoDeliveryListado[]>(this.deliveryUrl, {
      params: this.empresa(idEmpresa)
    });
  }

  mios(idEmpresa: number, idUsuario: number): Observable<PedidoDeliveryListado[]> {
    return this.http.get<PedidoDeliveryListado[]>(`${this.deliveryUrl}/mios`, {
      params: this.empresa(idEmpresa).set('idUsuario', String(idUsuario))
    });
  }

  obtener(idEmpresa: number, idPedidoOnline: number): Observable<PedidoDeliveryListado> {
    return this.http.get<PedidoDeliveryListado>(`${this.deliveryUrl}/${idPedidoOnline}`, {
      params: this.empresa(idEmpresa)
    });
  }

  repartidores(idEmpresa: number): Observable<DeliveryRepartidor[]> {
    return this.http.get<DeliveryRepartidor[]>(`${this.deliveryUrl}/repartidores`, {
      params: this.empresa(idEmpresa)
    });
  }

  upsertRepartidor(
    idEmpresa: number,
    body: { idUsuario: number; disponible: boolean; activo: boolean }
  ): Observable<DeliveryRepartidor> {
    return this.http.post<DeliveryRepartidor>(`${this.deliveryUrl}/repartidores`, body, {
      params: this.empresa(idEmpresa)
    });
  }

  asignar(
    idEmpresa: number,
    body: { idPedidoOnline: number; idUsuarioRepartidor: number; idUsuarioAsigna: number }
  ): Observable<PedidoDeliveryListado> {
    return this.http.post<PedidoDeliveryListado>(`${this.deliveryUrl}/asignar`, body, {
      params: this.empresa(idEmpresa)
    });
  }

  transicionar(
    idEmpresa: number,
    idPedidoOnline: number,
    body: { idUsuario: number; estado: string }
  ): Observable<PedidoDeliveryListado> {
    return this.http.post<PedidoDeliveryListado>(
      `${this.deliveryUrl}/${idPedidoOnline}/estado`,
      body,
      { params: this.empresa(idEmpresa) }
    );
  }

  private empresa(idEmpresa: number): HttpParams {
    return new HttpParams().set('idEmpresa', String(idEmpresa));
  }
}
