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

  /** PWA cliente (proyecto AlahiaPedidos). */
  public readonly pedirPublicUrl: string = 'http://localhost:4210';
  /** PWA repartidor (proyecto AlahiaPedidos). */
  public readonly repartoPublicUrl: string = 'http://localhost:4211';
  /** PWA citas para el cliente. Prod: https://alahiapos.com/citas/{guid} */
  public readonly citasPublicUrl: string = 'http://localhost:4212';

  //api de QA
  //public readonly apiUrl: string = 'https://alahiaposapidemo.alahiapos.com/api';
   
}
