import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  // 👇 aquí defines la URL base de tu API
  //api de produccion
//public readonly apiUrl: string = 'https://alahiabeautyapiprod.alahiapos.com/api';

//public readonly apiUrl: string = 'http://localhost:5000/api';

  //api de desarrollo (Alahia AI y features nuevas locales)
  public readonly apiUrl: string = 'http://localhost:5039/api';
  // public readonly apiUrl: string = 'https://alahiaposapidemo.alahiapos.com/api';

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
