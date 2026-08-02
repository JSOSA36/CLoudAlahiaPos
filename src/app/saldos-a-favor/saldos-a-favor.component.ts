import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  ClienteSaldoAFavorListado,
  NotasCreditoService
} from 'src/app/servicios/notas-credito.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-saldos-a-favor',
  templateUrl: './saldos-a-favor.component.html',
  styleUrls: ['./saldos-a-favor.component.scss'],
})
export class SaldosAFavorComponent implements OnInit {
  saldos: ClienteSaldoAFavorListado[] = [];
  saldosFiltrados: ClienteSaldoAFavorListado[] = [];
  busqueda = '';
  cargando = false;

  constructor(
    private notasCreditoService: NotasCreditoService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar() {
    this.cargando = true;
    try {
      const lista = await firstValueFrom(
        this.notasCreditoService.listarSaldosAFavor(
          this.parametros.GetIdEmpresa()
        )
      );
      this.saldos = lista || [];
      this.filtrar();
    } catch {
      this.saldos = [];
      this.saldosFiltrados = [];
      await this.toast('Error cargando saldos a favor', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  filtrar() {
    const value = this.busqueda.toLowerCase().trim();
    if (!value) {
      this.saldosFiltrados = [...this.saldos];
      return;
    }

    this.saldosFiltrados = this.saldos.filter(s =>
      (s.nombreCliente || '').toLowerCase().includes(value)
      || (s.ncfNotaCredito || '').toLowerCase().includes(value)
      || String(s.idNotaCredito).includes(value)
      || (s.estado || '').toLowerCase().includes(value)
    );
  }

  private async toast(message: string, color: string) {
    (
      await this.toastCtrl.create({
        message,
        duration: 2500,
        color,
        position: 'top'
      })
    ).present();
  }
}
