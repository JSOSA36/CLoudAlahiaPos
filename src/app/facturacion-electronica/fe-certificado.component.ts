import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fe-certificado',
  template: '',
})
export class FeCertificadoComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.navigateByUrl('/fe-configuracion');
  }
}
