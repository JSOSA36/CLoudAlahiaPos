import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ParametrosService } from '../servicios/parametros.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private parametros: ParametrosService
  ) {}

  canActivate(): boolean {
    this.parametros.ensureSessionFromStorage();

    if (this.parametros.IdUsuario && this.parametros.IdEmpresa) {
      return true;
    }

    // 🚫 Sin sesión → limpiar y redirigir
    this.parametros.logout();
    localStorage.clear();

    this.router.navigateByUrl('/login', { replaceUrl: true });
    return false;
  }
}
