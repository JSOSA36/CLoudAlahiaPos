import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  // 👇 aquí defines la URL base de tu API
  //api de produccion
//public readonly apiUrl: string = 'https://alahiabeautyapiprod.alahiapos.com/api';

//public readonly apiUrl: string = 'http://localhost:5000/api';

  // Local :4200 y la LAN usan su API. El ERP vivo no tiene API en el mismo sitio:
  // si se usa location.origin, IIS devuelve el 404 en HTML y el login lo pinta en el modal.
  get apiUrl(): string {
    if (typeof location === 'undefined') return 'https://192.168.100.169/api';
    const host = (location.hostname || '').toLowerCase();
    if (location.port === '4200') return `http://${host}:5039/api`;
    if (host === '192.168.100.169') return 'https://192.168.100.169/api';
    if (host === 'erp.alahiapos.com') return 'https://alahiaposapidemo.alahiapos.com/api';
    return `${location.origin}/api`;
  }

  /**
   * Token de sesión + claim de PC (cupo POS).
   * false en erp vivo / localhost. true solo en erpdemo.
   */
  public readonly authSesionHabilitada: boolean = false;

  /** Modo local POS (IndexedDB). false en erp vivo. true solo en prueba aislada. */
  public readonly posOfflineHabilitado: boolean = false;

  /** PWA cliente. En el ERP vivo sale del mismo sitio: /pedir/{guid}. */
  get pedirPublicUrl(): string {
    return this.urlPublica('http://localhost:4210', '/pedir');
  }

  /** PWA repartidor. En el ERP vivo: /reparto/{guid}. */
  get repartoPublicUrl(): string {
    return this.urlPublica('http://localhost:4211', '/reparto');
  }

  private urlPublica(local: string, ruta: string): string {
    const host = typeof location !== 'undefined' ? location.hostname : 'localhost';
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return local;
    return `${location.origin}${ruta}`;
  }
  /** PWA citas para el cliente. Prod: https://alahiapos.com/citas/{guid} */
  public readonly citasPublicUrl: string = 'http://localhost:4212';

  //api de QA
  //public readonly apiUrl: string = 'https://alahiaposapidemo.alahiapos.com/api';
   
}
