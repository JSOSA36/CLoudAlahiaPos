// src/app/servicios/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { usuarios } from '../models/usuarios';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.apiUrl}/Login`;
  }

  // ============================
  // LOGIN
  // ============================
  login(userName: string, password: string, deviceId: string): Observable<usuarios> {
    return this.http.post<usuarios>(`${this.baseUrl}/login`, {
      userName,
      password,
      deviceId
    });
  }
logout(idUsuario: number) {
  return this.http.post(
    `${this.baseUrl}/logout`,
    {
      idUsuario
    
    }
  );
}
  // ============================
  // FORGOT PASSWORD
  // ============================
  forgotPassword(correo: string) {
    return this.http.post(`${this.baseUrl}/forgot-password`, { correo });
  }

  // ============================
  // RESET PASSWORD
  // ============================
  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.baseUrl}/reset-password`, {
      token,
      newPassword
    });
  }
}
