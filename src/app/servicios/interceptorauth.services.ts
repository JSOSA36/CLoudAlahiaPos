import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler) {
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
