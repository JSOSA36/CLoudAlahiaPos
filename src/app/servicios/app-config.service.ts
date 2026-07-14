import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  // 👇 aquí defines la URL base de tu API
  //api de produccion
//public readonly apiUrl: string = 'https://alahiabeautyapiprod.alahiapos.com/api';

//public readonly apiUrl: string = 'http://localhost:5000/api';

  //api de desarrollo
    public readonly apiUrl: string = 'http://localhost:5139/api';

    //api de QA
    //public readonly apiUrl: string = 'https://alahiaposapidemo.alahiapos.com/api';
   
}
