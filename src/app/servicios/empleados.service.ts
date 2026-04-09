import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { Empleado } from '../models/empleado.models';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    // 👉 coincide con EmpleadoController
    this.baseUrl = `${this.config.apiUrl}/empleado`;
  }
  // =====================================================
  // 👤 OBTENER EMPLEADO POR ID
  // GET /api/empleado/{idEmpleado}
  // =====================================================
  getById(idEmpleado: number): Observable<Empleado> {
    return this.http.get<Empleado>(
      `${this.baseUrl}/${idEmpleado}`
    );
  }

  // =====================================================
  // 📋 LISTAR EMPLEADOS POR EMPRESA
  // GET /api/empleado/empresa/{idEmpresa}
  // =====================================================
  getByEmpresa(idEmpresa: number): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(
      `${this.baseUrl}/empresa/${idEmpresa}`
    );
  }

  // =====================================================
  // ➕ CREAR EMPLEADO
  // POST /api/empleado
  // =====================================================
  create(dto: Empleado): Observable<any> {
    return this.http.post(this.baseUrl, dto);
  }

  // =====================================================
  // ✏️ ACTUALIZAR EMPLEADO
  // PUT /api/empleado
  // =====================================================
  update(dto: Empleado): Observable<any> {
  return this.http.put(
    `${this.baseUrl}/${dto.idEmpleados}`,dto);
}


  // =====================================================
  // ❌ ELIMINAR EMPLEADO (LÓGICO)
  // DELETE /api/empleado/{id}
  // =====================================================
  delete(idEmpleado: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${idEmpleado}`
    );
  }

  // =====================================================
  // 🔁 ACTIVAR / DESACTIVAR EMPLEADO
  // PUT /api/empleado/estado/{id}?activo=true|false
  // =====================================================
  cambiarEstado(
    idEmpleado: number,
    activo: boolean
  ): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/estado/${idEmpleado}`,
      null,
      { params: { activo } }
    );
  }
  
}
