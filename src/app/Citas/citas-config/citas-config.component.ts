import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { EmpresaService } from 'src/app/servicios/empresa.services';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-citas-config',
  templateUrl: './citas-config.component.html',
  styleUrls: ['./citas-config.component.scss'],
})
export class CitasConfigComponent implements OnInit {
  cargando = false;
  guardando = false;
  pedirVoucherCitas = false;
  montoReservaCitas: number | null = null;
  infoAgendar = '';
  notificarCitasWhatsApp = true;

  constructor(
    private empresaSrv: EmpresaService,
    private parametro: ParametrosService,
    private toast: ToastController
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const id = this.parametro.GetIdEmpresa();
    if (!id) return;
    this.cargando = true;
    this.empresaSrv.getCitasConfig(id).subscribe({
      next: (cfg) => {
        this.pedirVoucherCitas = !!cfg?.pedirVoucherCitas;
        this.montoReservaCitas = cfg?.montoReservaCitas ?? 0;
        this.infoAgendar = cfg?.infoAgendar || '';
        this.notificarCitasWhatsApp = cfg?.notificarCitasWhatsApp !== false;
        this.cargando = false;
      },
      error: async () => {
        this.cargando = false;
        const t = await this.toast.create({
          message: 'No se pudo cargar la configuración de citas.',
          duration: 2200,
          color: 'danger'
        });
        t.present();
      }
    });
  }

  async guardar(): Promise<void> {
    const id = this.parametro.GetIdEmpresa();
    if (!id || this.guardando) return;

    const monto = Number(this.montoReservaCitas || 0);
    if (this.pedirVoucherCitas && (!monto || monto <= 0)) {
      const t = await this.toast.create({
        message: 'Indique el monto de reserva que el cliente debe depositar.',
        duration: 2500,
        color: 'warning'
      });
      t.present();
      return;
    }

    this.guardando = true;
    this.empresaSrv.updateCitasConfig(id, {
      pedirVoucherCitas: this.pedirVoucherCitas,
      montoReservaCitas: this.pedirVoucherCitas ? monto : 0,
      infoAgendar: this.infoAgendar,
      notificarCitasWhatsApp: this.notificarCitasWhatsApp
    }).subscribe({
      next: async () => {
        this.guardando = false;
        const t = await this.toast.create({
          message: 'Configuración de citas guardada.',
          duration: 2000,
          color: 'success'
        });
        t.present();
      },
      error: async (err) => {
        this.guardando = false;
        const t = await this.toast.create({
          message: err?.error?.message || 'No se pudo guardar.',
          duration: 2500,
          color: 'danger'
        });
        t.present();
      }
    });
  }
}
