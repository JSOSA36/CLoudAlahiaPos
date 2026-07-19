import { Component, OnInit } from '@angular/core';
import { FacturacionElectronicaService } from 'src/app/servicios/facturacion-electronica.service';

@Component({
  selector: 'app-fe-estado-dgii',
  templateUrl: './fe-estado-dgii.component.html',
  styleUrls: ['./fe-estado-dgii.component.scss'],
})
export class FeEstadoDgiiComponent implements OnInit {

  gatewayStatus: 'checking' | 'online' | 'offline' = 'checking';
  lastCheck: Date | null = null;

  constructor(private feService: FacturacionElectronicaService) {}

  ngOnInit() {
    this.check();
  }

  check() {
    this.gatewayStatus = 'checking';
    this.feService.healthCheck().subscribe({
      next: (res: any) => {
        this.gatewayStatus = res?.conectado ? 'online' : 'offline';
        this.lastCheck = new Date();
      },
      error: () => {
        this.gatewayStatus = 'offline';
        this.lastCheck = new Date();
      }
    });
  }
}
