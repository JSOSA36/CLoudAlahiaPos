import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { HorariosEstilistaService } from 'src/app/servicios/horarioestulista.services';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { HorarioEstilista } from 'src/app/models/horarioestilista.models';
import { HorarioestilistaAddComponent } from '../horarioestilista-add/horarioestilista-add.component';

@Component({
  selector: 'app-horarioestilista',
  templateUrl: './horarioestilista.component.html',
  styleUrls: ['./horarioestilista.component.scss'],
})
export class HorarioestilistaComponent implements OnInit {
  cargando = false;
  horarios: HorarioEstilista[] = [];
  horariosAgrupados: Array<{ estilista: string, idEmpleado: number, horarios: HorarioEstilista[] }> = [];
  empleados: any[] = [];

  constructor(
    private horariosSrv: HorariosEstilistaService,
    private empleadosSrv: EmpleadosService,
    private parametro: ParametrosService,
    private modalCtrl: ModalController,
    private toast: ToastController
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    const idEmpresa = this.parametro.GetIdEmpresa();

    this.empleadosSrv.getByEmpresa(idEmpresa).subscribe(emps => {
      this.empleados = emps || [];

      this.horariosSrv.GetHorariosByEmpresa(idEmpresa).subscribe({
        next: (data) => {
          this.horarios = (data || []).map(h => {
            const emp = this.empleados.find(e => e.idEmpleados === h.idEmpleado);
            return {
              ...h,
              estilista: emp ? (emp.userName || emp.nombre) : 'No asignado'
            };
          });

          // Agrupar por estilista
          const mapa = new Map<string, { idEmpleado: number, horarios: HorarioEstilista[] }>();
          this.horarios.forEach(h => {
            const clave = h.estilista ?? 'No asignado';
            if (!mapa.has(clave)) {
              mapa.set(clave, { idEmpleado: h.idEmpleado, horarios: [] });
            }
            mapa.get(clave)!.horarios.push(h);
          });

          this.horariosAgrupados = Array.from(mapa, ([estilista, { idEmpleado, horarios }]) => ({
            estilista,
            idEmpleado,
            horarios: horarios.sort((a, b) => a.diaSemana - b.diaSemana)
          }));

          this.cargando = false;
        },
        error: async () => {
          this.cargando = false;
          (await this.toast.create({
            message: 'Error cargando horarios',
            duration: 1500,
            color: 'danger'
          })).present();
        }
      });
    });
  }

  // ✅ Abre modal tanto para crear como para editar
  async abrirModal(grupo?: any) {
    const modal = await this.modalCtrl.create({
      component: HorarioestilistaAddComponent,
       cssClass: 'modal-producto-grande',
      componentProps: { 
        idEmpleado: grupo?.idEmpleado || 0,
        horarios: grupo?.horarios || []
      }
    });
    await modal.present();
    const { role } = await modal.onDidDismiss();
    if (role === 'ok') this.cargar();
  }

  // ✅ Ajustada: BD = 1 (Lunes) ... 7 (Domingo)
  diaLabel(value: number): string {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias[(value - 1 + 7) % 7] || 'N/A';
  }

  trackById = (_: number, h: HorarioEstilista) => h?.idHorario ?? _;
}
