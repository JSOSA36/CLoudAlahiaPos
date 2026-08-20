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

  //api de QA (caído: 503 Service Unavailable)
  //public readonly apiUrl: string = 'https://alahiaposapidemo.alahiapos.com/api';
   
}
