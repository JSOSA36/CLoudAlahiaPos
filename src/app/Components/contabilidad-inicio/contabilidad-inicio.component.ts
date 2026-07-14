import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contabilidad-inicio',
  templateUrl: './contabilidad-inicio.component.html',
  styleUrls: ['./contabilidad-inicio.component.scss'],
})
export class ContabilidadInicioComponent {
  opciones = [
    {
      titulo: 'Catálogo de Cuentas',
      descripcion: 'Plan de cuentas contables',
      icono: 'sitemap',
      ruta: '/contabilidadcuentas'
    },
    {
      titulo: 'Asientos Contables',
      descripcion: 'Registro de asientos manuales',
      icono: 'book',
      ruta: '/contabilidadasientos'
    },
    {
      titulo: 'Libro Diario',
      descripcion: 'Consulta de movimientos por fecha',
      icono: 'book-open',
      ruta: '/contabilidadlibrodiario'
    },
    {
      titulo: 'Mayor General',
      descripcion: 'Movimientos por cuenta contable',
      icono: 'balance-scale',
      ruta: '/contabilidadmayorgeneral'
    },
    {
      titulo: 'Balance de Comprobación',
      descripcion: 'Saldos y movimientos por cuenta',
      icono: 'table',
      ruta: '/contabilidadbalancecomprobacion'
    },
    {
      titulo: 'Estado de Resultados',
      descripcion: 'Ingresos, costos y gastos',
      icono: 'chart-pie',
      ruta: '/contabilidadestadoresultados'
    },
    {
      titulo: 'Balance General',
      descripcion: 'Activos, pasivos y capital',
      icono: 'landmark',
      ruta: '/contabilidadbalancegeneral'
    },
    {
      titulo: 'Consulta de Asientos',
      descripcion: 'Búsqueda avanzada de asientos',
      icono: 'search',
      ruta: '/contabilidadconsultaasientos'
    },
    {
      titulo: 'Cierre Contable',
      descripcion: 'Cierre de períodos contables',
      icono: 'calendar-check',
      ruta: '/contabilidadcierre'
    }
  ];

  constructor(private router: Router) {}

  ir(ruta: string): void {
    this.router.navigateByUrl(ruta);
  }
}
