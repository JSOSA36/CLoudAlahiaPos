import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transferencias-financieras',
  templateUrl: './transferencias-financieras.component.html',
  styleUrls: ['./transferencias-financieras.component.scss'],
})
export class TransferenciasFinancierasComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.navigate(['/movimientosfinancieros'], {
      queryParams: { tipo: 'TRANSFERENCIA' }
    });
  }
}
