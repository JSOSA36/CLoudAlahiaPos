import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { HorariosEstilistaService } from 'src/app/servicios/horarioestulista.services';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EmpleadosService } from 'src/app/servicios/empleados.service';

@Component({
  selector: 'app-horarioestilista-add',
  templateUrl: './horarioestilista-add.component.html',
  styleUrls: ['./horarioestilista-add.component.scss'],
})
export class HorarioestilistaAddComponent implements OnInit {
  @Input() idEmpleado = 0;       // viene del padre
  @Input() horarios: any[] = []; // viene del padre

  idEmpresa = 0;
  empleados: any[] = [];
  guardando = false;

  dias = [
  { value: 0, label: 'Domingo', activo: false, horaInicio: '09:00', horaFin: '17:00', recesoInicio: '12:00', recesoFin: '13:00' },
  { value: 1, label: 'Lunes', activo: false, horaInicio: '09:00', horaFin: '17:00', recesoInicio: '12:00', recesoFin: '13:00' },
  { value: 2, label: 'Martes', activo: false, horaInicio: '09:00', horaFin: '17:00', recesoInicio: '12:00', recesoFin: '13:00' },
  { value: 3, label: 'Miércoles', activo: false, horaInicio: '09:00', horaFin: '17:00', recesoInicio: '12:00', recesoFin: '13:00' },
  { value: 4, label: 'Jueves', activo: false, horaInicio: '09:00', horaFin: '17:00', recesoInicio: '12:00', recesoFin: '13:00' },
  { value: 5, label: 'Viernes', activo: false, horaInicio: '09:00', horaFin: '17:00', recesoInicio: '12:00', recesoFin: '13:00' },
  { value: 6, label: 'Sábado', activo: false, horaInicio: '09:00', horaFin: '14:00', recesoInicio: '', recesoFin: '' }
];



  constructor(
    private modalCtrl: ModalController,
    private toast: ToastController,
    private horariosSrv: HorariosEstilistaService,
    private empleadosSrv: EmpleadosService,
    private parametro: ParametrosService
  ) {}

  ngOnInit() {
    this.idEmpresa = this.parametro.GetIdEmpresa();

    // cargar empleados
    this.empleadosSrv.getByEmpresa(this.idEmpresa)
      .subscribe(res => this.empleados = res || []);

    // 🔹 Si el modal recibe horarios, mapearlos sobre "dias"
    if (this.horarios && this.horarios.length > 0) {
      this.horarios.forEach(h => {
        const dia = this.dias.find(d => d.value === h.diaSemana);
        if (dia) {
          dia.activo = true;
         dia.recesoInicio = h.recesoInicio ? h.recesoInicio.substring(0,5) : '';
         dia.recesoFin    = h.recesoFin ? h.recesoFin.substring(0,5) : '';

        }
      });
    }
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async guardar() {
    if (!this.idEmpleado) {
      (await this.toast.create({
        message: 'Selecciona un estilista',
        duration: 1500,
        color: 'warning'
      })).present();
      return;
    }

    this.guardando = true;

    const horarios = this.dias
  .filter(d => d.activo)
  .map(d => ({
  idHorario: 0,
  idEmpleado: this.idEmpleado,
  idEmpresa: this.idEmpresa,
  diaSemana: d.value,
  horaInicio: d.horaInicio + ':00',
  horaFin: d.horaFin + ':00',
  recesoInicio: d.recesoInicio ? d.recesoInicio + ':00' : null,
  recesoFin: d.recesoFin ? d.recesoFin + ':00' : null
}));


   console.log('Horarios a guardar:', horarios);
    this.horariosSrv.GuardarLista({ horarios }).subscribe({
      next: async () => {
        (await this.toast.create({
          message: 'Horarios guardados ✅',
          duration: 1500,
          color: 'success'
        })).present();
        this.guardando = false;
        this.modalCtrl.dismiss(true, 'ok');
      },
      error: async (e) => {
        console.error(e);
        (await this.toast.create({
          message: 'Error al guardar horarios',
          duration: 1800,
          color: 'danger'
        })).present();
        this.guardando = false;
      }
    });
  }
}
