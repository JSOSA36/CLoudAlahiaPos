import { Component, OnInit } from '@angular/core';
import { PoliticasAceptacionDto } from '../models/politicas-servicio.models';
import { PoliticasServicioService } from '../servicios/politicas-servicio.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-politicas-aceptaciones',
  templateUrl: './politicas-aceptaciones.component.html',
  styleUrls: ['./politicas-aceptaciones.component.scss']
})
export class PoliticasAceptacionesComponent implements OnInit {
  items: PoliticasAceptacionDto[] = [];
  loading = false;
  filtroVersion: number | null = null;
  filtroTexto = '';

  constructor(
    private politicasService: PoliticasServicioService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargar();
  }

  get filtrados(): PoliticasAceptacionDto[] {
    const q = (this.filtroTexto || '').trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(a => {
      const empresa = (a.nombreEmpresa || '').toLowerCase();
      const usuario = (a.nombreUsuario || '').toLowerCase();
      const ver = `v${a.numeroVersion}`.toLowerCase();
      return empresa.includes(q) || usuario.includes(q) || ver.includes(q) || String(a.idEmpresa).includes(q);
    });
  }

  get totalEnviados(): number {
    return this.items.filter(a => a.correoEnviado).length;
  }

  get totalEmpresas(): number {
    return new Set(this.items.map(a => a.idEmpresa)).size;
  }

  get ultimaFecha(): string {
    if (!this.items.length) return '—';
    const sorted = [...this.items].sort((a, b) =>
      new Date(b.fechaAceptacion).getTime() - new Date(a.fechaAceptacion).getTime()
    );
    const d = new Date(sorted[0].fechaAceptacion);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${mi}`;
  }

  inicial(nombre?: string | null): string {
    const n = (nombre || '?').trim();
    return (n.charAt(0) || '?').toUpperCase();
  }

  cargar() {
    this.loading = true;
    this.politicasService.listarAceptaciones(
      this.filtroVersion ?? undefined
    ).subscribe({
      next: (data) => {
        this.items = data || [];
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toastCtrl.create({
          message: 'No se pudieron cargar las aceptaciones',
          duration: 2800,
          color: 'danger',
          position: 'top'
        });
        await t.present();
      }
    });
  }
}
