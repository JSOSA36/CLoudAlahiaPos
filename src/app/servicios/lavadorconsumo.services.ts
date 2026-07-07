import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { AppConfigService } from './app-config.service'
import { LavadorDashboard } from '../models/lavador-dashboard.models'

@Injectable({ providedIn: 'root' })
export class LavadorConsumoService {

  private baseUrl: string

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/LavadorConsumo`
  }

  registrarConsumo(data:any):Observable<any>{
    return this.http.post(`${this.baseUrl}/Registrar`, data)
  }

  GetHistorial(idEmpleado:number,idEmpresa:number,desde:string,hasta:string)
  :Observable<LavadorDashboard>{
    return this.http.get<LavadorDashboard>(
      `${this.baseUrl}/Historial?idEmpleado=${idEmpleado}&idEmpresa=${idEmpresa}&desde=${desde}&hasta=${hasta}`
    )
  }
deleteConsumo(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/${id}`);
}
  getPendientes(idEmpleado:number,idEmpresa:number){
    return this.http.get(
      `${this.baseUrl}/Pendientes?idEmpleado=${idEmpleado}&idEmpresa=${idEmpresa}`
    )
  }
getDashboardLavador(
  idEmpleado: number,
  idEmpresa: number,
  desde: string,
  hasta: string
): Observable<LavadorDashboard> {

  return this.http.get<LavadorDashboard>(
    `${this.baseUrl}/DashboardLavador` +
    `?idEmpleado=${idEmpleado}` +
    `&idEmpresa=${idEmpresa}` +
    `&desde=${desde}` +
    `&hasta=${hasta}`
  );

}
  saldar(idConsumo:number){
    return this.http.post(`${this.baseUrl}/Saldar?idConsumo=${idConsumo}`,{})
  }

}