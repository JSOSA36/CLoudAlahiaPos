import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // El agente local (ApiPrint) es otro origen (http://localhost:5045).
    // Si se mandan Bearer + cookies, Chrome bloquea CORS (AllowAnyOrigin + credentials)
    // y el ERP cree que el servicio no está instalado.
    if (esAgenteImpresion(req.url)) {
      return next.handle(req.clone({
        withCredentials: false,
        headers: req.headers
          .delete('Authorization')
          .delete('X-IdUsuario')
      }));
    }

    const token =
      localStorage.getItem('token_sesion') ||
      localStorage.getItem('token') ||
      '';
    const idUsuario = localStorage.getItem('IdUsuario') || '';

    const headers: Record<string, string> = {};
    if (token && token !== 'ok') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (idUsuario) {
      headers['X-IdUsuario'] = idUsuario;
    }

    const clone = req.clone({
      withCredentials: true,
      setHeaders: headers
    });

    return next.handle(clone);
  }
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
