import {
  HttpErrorResponse,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ParametrosService } from './parametros.service';
import { PosDeviceService } from './pos-device.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private redirigiendo401 = false;

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (esAgenteImpresion(req.url)) {
      return next.handle(req.clone({
        withCredentials: false,
        headers: req.headers
          .delete('Authorization')
          .delete('X-IdUsuario')
          .delete('X-IdSucursal')
          .delete('X-Pos-Device-Id')
      }));
    }

    const token =
      localStorage.getItem('token_sesion') ||
      localStorage.getItem('token') ||
      '';
    const idUsuario = localStorage.getItem('IdUsuario') || '';
    const authEstricto = this.authSesionHabilitada();

    const headers: Record<string, string> = {};
    if (token && token !== 'ok') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (idUsuario) {
      headers['X-IdUsuario'] = idUsuario;
    }
    const idSucursal = localStorage.getItem('IdSucursal') || '';
    if (idSucursal && Number(idSucursal) > 0) {
      headers['X-IdSucursal'] = idSucursal;
    }
    if (authEstricto) {
      let deviceId = '';
      try {
        deviceId = this.injector.get(PosDeviceService).deviceIdSincrono();
      } catch {
        deviceId = localStorage.getItem('pos_device_id') || localStorage.getItem('device_id') || '';
      }
      if (deviceId) {
        headers['X-Pos-Device-Id'] = deviceId;
      }
    }

    const clone = req.clone({
      withCredentials: true,
      setHeaders: headers
    });

    if (!authEstricto) {
      return next.handle(clone);
    }

    return next.handle(clone).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !esRutaAuthPublica(req.url) && !esAgenteImpresion(req.url)) {
          this.forzarLogout401();
        }
        return throwError(() => err);
      })
    );
  }

  private authSesionHabilitada(): boolean {
    try {
      return this.injector.get(AppConfigService).authSesionHabilitada === true;
    } catch {
      return false;
    }
  }

  private forzarLogout401(): void {
    if (this.redirigiendo401) return;
    this.redirigiendo401 = true;
    try {
      const parametros = this.injector.get(ParametrosService);
      const router = this.injector.get(Router);
      parametros.logout();
      localStorage.clear();
      void router.navigateByUrl('/login', { replaceUrl: true });
    } finally {
      setTimeout(() => { this.redirigiendo401 = false; }, 1500);
    }
  }
}

function esRutaAuthPublica(url: string): boolean {
  const lower = (url || '').toLowerCase();
  return lower.includes('/login/login')
    || lower.includes('/login/forgot-password')
    || lower.includes('/login/reset-password')
    || lower.includes('/login/validate-reset-token');
}

function esAgenteImpresion(url: string): boolean {
  const raw = (url || '').trim();
  if (!raw) return false;

  const lower = raw.toLowerCase();
  if (lower.includes('/api/printer')) return true;

  try {
    const parsed = new URL(raw, typeof location !== 'undefined' ? location.href : 'http://localhost');
    if (parsed.port === '5045') return true;
    const host = parsed.hostname.toLowerCase();
    if ((host === 'localhost' || host === '127.0.0.1' || host === '[::1]')
      && lower.includes('/api/printer')) {
      return true;
    }
  } catch {
    return lower.includes('/api/printer');
  }

  return false;
}
