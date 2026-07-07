// src/app/servicios/RncCLienteDGII.services.ts

import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  AppConfigService
} from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class RncCLienteDGIIService {

  private readonly baseUrl: string;

  constructor(

    private http: HttpClient,

    private config: AppConfigService

  ) {

    this.baseUrl =

      `${this.config.apiUrl}/RncCLienteDGII`;
  }

  // =====================================================
  // 🔥 CONSULTAR RNC / CÉDULA
  // =====================================================

  consultarRnc(
    rnc: string
  ): Observable<any> {

    return this.http.get<any>(

      `${this.baseUrl}/${rnc}`
    );
  }
}