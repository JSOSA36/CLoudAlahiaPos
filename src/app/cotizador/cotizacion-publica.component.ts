import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CotizadorService, CotizadorVistaPublica } from './cotizador.service';

@Component({
  selector: 'app-cotizacion-publica',
  templateUrl: './cotizacion-publica.component.html',
  styleUrls: ['./cotizacion-publica.component.scss'],
})
export class CotizacionPublicaComponent implements OnInit {
  folio = '';
  vista: CotizadorVistaPublica | null = null;
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private cotizador: CotizadorService
  ) {}

  ngOnInit(): void {
    this.folio = decodeURIComponent(this.route.snapshot.paramMap.get('folio') || '').trim();
    if (!this.folio) {
      this.cargando = false;
      this.error = 'Enlace inválido.';
      return;
    }

    this.cotizador.vistaPublica(this.folio).subscribe({
      next: (v) => {
        this.vista = v;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.message || 'No se encontró esta cotización.';
      },
    });
  }
}
