import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  CotizacionPublicaVista,
  FacturaHeaderService,
} from '../servicios/factura-header.service';

@Component({
  selector: 'app-cotizacion-cliente-publica',
  templateUrl: './cotizacion-cliente-publica.component.html',
  styleUrls: ['./cotizacion-cliente-publica.component.scss'],
})
export class CotizacionClientePublicaComponent implements OnInit {
  token = '';
  vista: CotizacionPublicaVista | null = null;
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private facturaHeader: FacturaHeaderService
  ) {}

  ngOnInit(): void {
    this.token = decodeURIComponent(
      this.route.snapshot.paramMap.get('token') || ''
    ).trim();

    if (!this.token) {
      this.cargando = false;
      this.error = 'Enlace inválido.';
      return;
    }

    this.facturaHeader.obtenerCotizacionPublica(this.token).subscribe({
      next: (v) => {
        this.vista = v;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error =
          err?.error?.message || 'No se encontró esta cotización.';
      },
    });
  }
}
