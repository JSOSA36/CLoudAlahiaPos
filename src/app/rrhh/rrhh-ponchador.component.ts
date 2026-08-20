import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { EmpleadosService } from '../servicios/empleados.service';
import { ParametrosService } from '../servicios/parametros.service';
import {
  RrhhDispositivo,
  RrhhDispositivoIngesta,
  RrhhDispositivoPersona,
  RrhhService
} from '../servicios/rrhh.service';
import { Empleado } from '../models/empleado.models';

@Component({
  selector: 'app-rrhh-ponchador',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './rrhh-ponchador.component.html',
  styleUrls: ['./rrhh-shared.scss']
})
export class RrhhPonchadorComponent implements OnInit {
  dispositivos: RrhhDispositivo[] = [];
  personas: RrhhDispositivoPersona[] = [];
  ingestas: RrhhDispositivoIngesta[] = [];
  empleados: Empleado[] = [];
  guardando = false;
  reloj: RrhhDispositivo = this.emptyReloj();
  mapa = { idEmpleados: 0, codigoDispositivo: '' };
  pruebaMsg = '';

  constructor(
    private rrhh: RrhhService,
    private empleadosSvc: EmpleadosService,
    public parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.empleadosSvc.getByEmpresa(this.parametros.IdEmpresa).subscribe({
      next: (l) => (this.empleados = (l || []).filter((e) => e.estado !== false))
    });
    this.cargar();
  }

  cargar(): void {
    const id = this.parametros.IdEmpresa;
    this.rrhh.dispositivos(id).subscribe({ next: (r) => (this.dispositivos = r || []) });
    this.rrhh.dispositivoPersonas(id).subscribe({ next: (r) => (this.personas = r || []) });
    this.rrhh.dispositivoIngestas(id).subscribe({ next: (r) => (this.ingestas = r || []) });
  }

  onProveedor(): void {
    if (this.reloj.proveedor === 'ZKTECO' && !this.reloj.puerto) this.reloj.puerto = 4370;
    if (this.reloj.proveedor === 'HIKVISION' && !this.reloj.puerto) this.reloj.puerto = 80;
  }

  probarConexion(): void {
    this.guardando = true;
    this.pruebaMsg = 'Probando…';
    this.rrhh.probarDispositivo({
      idEmpresa: this.parametros.IdEmpresa,
      direccionIp: this.reloj.direccionIp,
      puerto: this.reloj.puerto || 4370
    }).subscribe({
      next: (r) => {
        this.guardando = false;
        this.pruebaMsg = r.mensaje;
        this.toast(r.mensaje);
      },
      error: (e) => {
        this.guardando = false;
        this.pruebaMsg = e?.error?.message || 'No se pudo probar';
        this.toast(this.pruebaMsg);
      }
    });
  }

  probarGuardado(d: RrhhDispositivo): void {
    this.guardando = true;
    this.rrhh.probarDispositivo({
      idEmpresa: this.parametros.IdEmpresa,
      idDispositivo: d.idDispositivo
    }).subscribe({
      next: (r) => {
        this.guardando = false;
        this.toast(r.mensaje);
      },
      error: (e) => {
        this.guardando = false;
        this.toast(e?.error?.message || 'No se pudo probar');
      }
    });
  }

  guardarReloj(): void {
    this.guardando = true;
    this.rrhh.saveDispositivo({
      ...this.reloj,
      idEmpresa: this.parametros.IdEmpresa,
      activo: true
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.reloj = this.emptyReloj();
        this.toast('Reloj guardado');
        this.cargar();
      },
      error: (e) => {
        this.guardando = false;
        this.toast(e?.error?.message || 'No se pudo guardar el reloj');
      }
    });
  }

  guardarMapa(): void {
    if (!this.mapa.idEmpleados || !this.mapa.codigoDispositivo.trim()) {
      this.toast('Indique colaborador y código del reloj.');
      return;
    }
    this.guardando = true;
    this.rrhh.saveDispositivoPersona({
      idEmpresa: this.parametros.IdEmpresa,
      idEmpleados: this.mapa.idEmpleados,
      codigoDispositivo: this.mapa.codigoDispositivo.trim(),
      activo: true
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.mapa = { idEmpleados: 0, codigoDispositivo: '' };
        this.toast('Colaborador vinculado al reloj');
        this.cargar();
      },
      error: (e) => {
        this.guardando = false;
        this.toast(e?.error?.message || 'No se pudo vincular');
      }
    });
  }

  etiquetaEstado(estado: string): string {
    if (estado === 'OK') return 'Integrada';
    if (estado === 'SIN_MAPA') return 'Sin colaborador';
    if (estado === 'SERIAL_DESCONOCIDO') return 'Serial no registrado';
    return estado;
  }

  private emptyReloj(): RrhhDispositivo {
    return {
      idDispositivo: 0,
      idEmpresa: this.parametros.IdEmpresa,
      serial: '',
      nombre: '',
      proveedor: 'ZKTECO',
      direccionIp: '',
      puerto: 4370,
      claveComunicacion: '',
      token: '',
      activo: true
    };
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2400 });
    await t.present();
  }
}
