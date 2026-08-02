import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fe-estado-dgii',
  template: '',
})
export class FeEstadoDgiiComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Health del gateway vive en Configuración FE (por empresa / proveedor).
    this.router.navigateByUrl('/fe-configuracion');
  }
}
