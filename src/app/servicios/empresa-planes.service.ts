// src/app/servicios/empresa-planes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { EmpresaPlan } from '../models/empresa-plan.model';

@Injectable({ providedIn: 'root' })
export class EmpresaPlanesService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // https://apikds.alahiapos.com/api/EmpresaPlanes
    this.baseUrl = `${this.config.apiUrl}/EmpresaPlanes`;
  }

  getPlanActivo(idEmpresa: number): Observable<EmpresaPlan> {
    return this.http.get<EmpresaPlan>(
      `${this.baseUrl}/GetPlanActivo/${idEmpresa}`
    );
  }

  create(plan: EmpresaPlan): Observable<any> {
    return this.http.post(this.baseUrl, plan);
  }

  finalizar(idEmpresaPlan: number): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/Finalizar/${idEmpresaPlan}`, {}
    );
  }
}
