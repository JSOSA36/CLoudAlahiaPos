import { Component, OnInit } from '@angular/core';
import { ContabilidadLibrosService } from 'src/app/servicios/contabilidad-libros.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { LibroDiarioLinea } from 'src/app/models/AsientoContable.models';

@Component({
  selector: 'app-contabilidad-libro-diario',
  templateUrl: './contabilidad-libro-diario.component.html',
  styleUrls: ['./contabilidad-libro-diario.component.scss'],
})
export class ContabilidadLibroDiarioComponent implements OnInit {
  cargando = false;
  lineas: LibroDiarioLinea[] = [];
  fechaInicio = '';
  fechaFin = '';

  constructor(
    private librosService: ContabilidadLibrosService,
    private parametros: ParametrosService
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = inicioMes.toISOString();
    this.fechaFin = hoy.toISOString();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.librosService.getLibroDiario(
      this.parametros.GetIdEmpresa(),
      this.fechaInicio,
      this.fechaFin
    ).subscribe({
      next: (resp) => {
        this.lineas = resp;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  get totalDebito(): number {
    return this.lineas.reduce((s, l) => s + l.debito, 0);
  }

  get totalCredito(): number {
    return this.lineas.reduce((s, l) => s + l.credito, 0);
  }
}
