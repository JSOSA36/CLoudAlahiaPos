import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FacturaHeaderService, FacturaPublicaVista } from '../servicios/factura-header.service';

@Component({
  selector: 'app-factura-publica',
  templateUrl: './factura-publica.component.html',
  styleUrls: ['../cotizacion-cliente/cotizacion-cliente-publica.component.scss']
})
export class FacturaPublicaComponent implements OnInit {
  token = '';
  vista: FacturaPublicaVista | null = null;
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private facturas: FacturaHeaderService
  ) {}

  ngOnInit(): void {
    this.token = decodeURIComponent(this.route.snapshot.paramMap.get('token') || '').trim();
    if (!this.token) {
      this.cargando = false;
      this.error = 'Enlace inválido.';
      return;
    }
    this.facturas.obtenerFacturaPublica(this.token).subscribe({
      next: (v) => {
        this.vista = v;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.message || 'No se encontró esta factura.';
      }
    });
  }
}
