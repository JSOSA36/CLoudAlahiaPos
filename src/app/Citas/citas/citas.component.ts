import { Component, OnInit, Input } from '@angular/core';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { CitasService } from 'src/app/servicios/citas.service';
import { Cita, EstadoCita } from 'src/app/models/cita';
import { CitaAddComponent } from '../citasadd/citasadd.component';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { EmpresaDto } from 'src/app/models/empresadto.models';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { finalize } from 'rxjs/operators';
@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.scss'],
})
export class CitasComponent implements OnInit {

  @Input() empresa!: EmpresaDto;

  cargando = false;
  citas: Cita[] = [];
  mostrarFiltroRango: boolean = false;
  citasFull: any[] = [];
  citasEntrantes: Cita[] = [];
  citasVista: Cita[] = [];
sonidoActivo:boolean = false;
private verificando = false;
citasFiltradas: Cita[] = [];
// 🔔 TOGGLE CITAS ENTRANTES
soloEntrantes: boolean = true;


  // 🔥 NUEVO → Listado de Estilistas filtrados
  ListadoEstilistas: any[] = [];
  filtroEstilistaId: number = 0;
semanaInicio!: Date;
semanaFin!: Date;
  empleados: any[] = [];
  fechaDesde: string = this.hoyISO();
  fechaHasta: string = this.hoyISO();
// 🔔 POLLING DE CITAS
private pollingTimer: any;
private ultimoIdCita = 0;
audioHabilitado = false;
reciboActivo: Cita | null = null;

diasSemana: {
  nombre: string;
  numero: number;
  fecha: string;
}[] = [];

diaSeleccionado: string = '';

verRecibo(cita: Cita) {
  this.reciboActivo = cita;
}

onToggleFiltroRango(ev:any){

  this.mostrarFiltroRango = ev.detail.checked;

  // 🔥 Si activa rango → quitar selección semanal
  if(this.mostrarFiltroRango){
    this.diaSeleccionado = '';
  }
  else{
    this.generarSemanaActual();
  }

  this.aplicarFiltros();
}
cerrarRecibo() {
  this.reciboActivo = null;
}

obtenerDiaLocal(fechaStr: string): number {

  if (!fechaStr) return -1;

  const [year, month, day] = fechaStr.substring(0,10).split('-').map(Number);

  // 👇 crea fecha LOCAL, NO UTC
  const fechaLocal = new Date(year, month - 1, day);

  return fechaLocal.getDay();
}
private preparandoAudio = false;
public filtroDiaSemana: number | '' = '';
private audioNuevaCita = new Audio('/assets/nuevacita.mp3');
cantidadConfirmadasHoy: number = 0;

 estados: Array<NonNullable<Cita['estado']>> = [
  
  'Confirmada',
  'En curso',
  'Completada',
  'Cancelada'
];

  estadoFiltro: 'Todas' | NonNullable<Cita['estado']> = 'Todas';

  constructor(
    private citasSrv: CitasService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toast: ToastController,
    private parametro: ParametrosService,
    private empleadosSrv: EmpleadosService,
    private facturaHeaderSrv: FacturaHeaderService
  ) {}


 esCitaSeguimiento(c:any){

  return (
    (!c.banco || c.banco.trim() === '')
    &&
    (
      c.abono === null ||
      c.abono === undefined ||
      c.abono === 0 ||
      c.abono === '0'
    )
  );

}

generarSemanaActual() {

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const dia = hoy.getDay(); // 0=Domingo

  // 🔥 Obtener lunes de esta semana
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((dia + 6) % 7));

  this.diasSemana = [];

  for (let i = 0; i < 7; i++) {

    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    fecha.setHours(0,0,0,0);

    const yyyy = fecha.getFullYear();
    const mm = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dd = fecha.getDate().toString().padStart(2, '0');

    const fechaLocal = `${yyyy}-${mm}-${dd}`;

    this.diasSemana.push({
      nombre: fecha.toLocaleDateString('es-DO', { weekday: 'short' }),
      numero: fecha.getDate(),
      fecha: fechaLocal
    });

    // 🔥 Marcar hoy correctamente
    if (fecha.getTime() === hoy.getTime()) {
      this.diaSeleccionado = fechaLocal;
    }
  }
}
  ngOnInit() {
    this.generarSemanaActual();
    this.filtroDiaSemana = new Date().getDay();

  if (this.empresa) this.aplicarColores(this.empresa);

  // 🔔 Sonido por default
  
const unlocked = localStorage.getItem('audioUnlocked');

  if (unlocked === 'true') {
    this.prepararAudio();
  }
  // 🔄 Ahora sí carga con el filtro correcto
  this.cargarEmpleadosYcitas();



  
}
recordarCitasDelDia() {

  if (!this.diaSeleccionado) return;

  const fechaISO = `${this.diaSeleccionado}T00:00:00`;

  this.citasSrv.enviarRecordatorioDia(fechaISO,this.parametro.IdEmpresa)
    .subscribe({

      next: async () => {

        const t = await this.toast.create({
          message: 'Recordatorios enviados correctamente 📩',
          duration: 2000,
          color: 'success'
        });

        t.present();
      },

      error: async () => {

        const t = await this.toast.create({
          message: 'Error enviando recordatorios ❌',
          duration: 2000,
          color: 'danger'
        });

        t.present();
      }

    });

}
// 🔊 necesario para que el navegador permita sonido
public prepararAudio() {
  if (this.audioHabilitado || this.preparandoAudio) return;

  this.preparandoAudio = true;

  this.audioNuevaCita.muted = true;
  this.audioNuevaCita.currentTime = 0;
  this.audioNuevaCita.load();

  this.audioNuevaCita.play()
    .then(() => {
      this.audioNuevaCita.pause();
      this.audioNuevaCita.muted = false;
      this.audioNuevaCita.currentTime = 0;
      this.audioHabilitado = true;
      this.preparandoAudio = false;
    })
    .catch(() => {
      // Si cae aquí, es porque NO hubo interacción válida
      this.preparandoAudio = false;
    });
}

get hayConfirmadasHoy(): boolean {

  if (!this.citasVista || this.citasVista.length === 0) {
    return false;
  }

  return this.citasVista.some(c => c.estado === 'Confirmada');
}
private reproducirSonidoNuevaCita() {
  if (!this.audioHabilitado) return;

  this.audioNuevaCita.currentTime = 0;
  this.audioNuevaCita.play().catch(() => {});
}




// ⏱ inicia el polling
private iniciarPolling(idEmpresa: number) {
  this.pollingTimer = setInterval(() => {
    this.verificarCitasNuevas(idEmpresa);
  }, 5000); // 15 segundos
}

// 🔍 compara citas
public verificarCitasNuevas(idEmpresa: number) {

  if (this.verificando) return;
  this.verificando = true;

  this.citasSrv.GetListadoCitas(idEmpresa).subscribe(data => {

    if (!data || data.length === 0) {
      this.verificando = false;
      return;
    }

    const maxId = Math.max(...data.map(c => c.idCita));

    if (maxId > this.ultimoIdCita) {

      // 🔥 OBTENER LA NUEVA CITA
      const nueva = data.find(c => c.idCita === maxId);

      this.ultimoIdCita = maxId;

      // 🔔 SONIDO
      this.reproducirSonidoNuevaCita();

      // 📡 AVISAR GLOBALMENTE
      if (nueva) {
        this.citasSrv.notificarNuevaCita(nueva);
      }

      // 🔄 REFRESCAR LISTA
     this.citasFull = this.mapearCitas(data);
     console.log('Citas actualizadas por polling:', this.citasFull);
      this.aplicarFiltros();
    }
    this.verificando = false;
  });
}


  // 🎨 Aplica colores corporativos
  private aplicarColores(empresa: EmpresaDto) {
    if (empresa.primaryColor)
      document.documentElement.style.setProperty('--ion-color-primary', empresa.primaryColor);

    if (empresa.secondaryColor)
      document.documentElement.style.setProperty('--ion-color-secondary', empresa.secondaryColor);

    if (empresa.tertiaryColor)
      document.documentElement.style.setProperty('--ion-color-tertiary', empresa.tertiaryColor);

    if (empresa.titleColor)
      document.documentElement.style.setProperty('--ion-title-color', empresa.titleColor);
  }

  hoyISO(): string {
    return new Date().toISOString().substring(0, 10);
  }
 private mapearCitas(data: any[]) {

  return (data || []).map(c => {

    const fecha = c.fecha ? c.fecha.substring(0, 10) : '';

    let hora12 = '';
    if (c.hora) {
      const [h, m] = c.hora.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m);
      hora12 = d.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return {
      ...c,
      fecha,
      hora: hora12,

      // 🔥🔥🔥 ESTE ES EL CLAVE
      idEmpleado: Number(c.idEmpleados || c.idEmpleado || 0),

      estilista: c.nombreEstilista || 'No asignado',
      servicio: c.nombreServicio || '—'
    };
  });
}


private convertirHoraAMinutos(horaStr: string): number {

  if (!horaStr) return 0;

  const [horaMin, periodo] = horaStr.split(' ');
  let [hora, minuto] = horaMin.split(':').map(Number);

  if (periodo.includes('p') && hora !== 12) {
    hora += 12;
  }

  if (periodo.includes('a') && hora === 12) {
    hora = 0;
  }

  return hora * 60 + minuto;
}
private ordenarCitas(lista: any[]) {

  return [...lista].sort((a, b) => {

    const fechaA = new Date(a.fecha).getTime();
    const fechaB = new Date(b.fecha).getTime();

    if (fechaA !== fechaB) {
      return fechaA - fechaB;
    }

    const horaA = this.convertirHoraAMinutos(a.hora);
    const horaB = this.convertirHoraAMinutos(b.hora);

    return horaA - horaB;
  });

}



  // =====================================
  // 🔥 CARGA EMPLEADOS + CITAS
  // =====================================
  private cargarEmpleadosYcitas() {
    this.cargando = true; // 🔥 OBLIGATORIO AQUI
    const idEmpresa = this.empresa?.idEmpresa || this.parametro.IdEmpresa;

    this.empleadosSrv.getByEmpresa(idEmpresa).subscribe({
      next: (res) => {

        const rolesSistema = ["administrador", "cajero", "recepcionista"];

        // 🔥 FILTRAR SOLO ESTILISTAS
        this.ListadoEstilistas = (res || []).filter(e =>
          e.ocupacion &&
          !rolesSistema.includes(e.ocupacion.toLowerCase())
        );

        this.cargar(idEmpresa);
         console.log(this.citasFull);
      },
      error: () => {
        this.ListadoEstilistas = [];
        this.cargar(idEmpresa);
      }
    });
  }

  // =====================================
  // 🔥 FILTROS
  // =====================================
aplicarFiltros() {

  const data = this.citasFull || [];

  this.citasEntrantes = this.ordenarCitas(
    data.filter(c => c.estado === 'Programada')
  );

  // ✅ SI ESTOY EN ENTRANTES, ESO ES LO QUE SE VE
  if (this.soloEntrantes) {
    this.citasVista = [...this.citasEntrantes];
    this.cantidadConfirmadasHoy = 0;
    return;
  }

  const estado = this.estadoFiltro;

  let filtradas = data
    .filter(c => c.estado !== 'Programada')
    .filter(c => estado === 'Todas' || c.estado === estado)
    .filter(c => !this.filtroEstilistaId || Number(c.idEmpleado) === Number(this.filtroEstilistaId))
    .filter(c => {

  // 🔥 SI ESTÁ USANDO RANGO
  if(this.mostrarFiltroRango){

    if(!this.fechaDesde || !this.fechaHasta) return true;

    return c.fecha >= this.fechaDesde &&
           c.fecha <= this.fechaHasta;
  }

  // 🔥 SI ESTÁ USANDO SEMANA
  if(!this.diaSeleccionado) return true;

  return c.fecha === this.diaSeleccionado;

})
  this.citasVista = this.ordenarCitas(filtradas);

  this.cantidadConfirmadasHoy = this.citasVista
    .filter(c => c.estado === 'Confirmada')
    .length;
}

onToggleEntrantes(ev: any) {
  
  
  this.soloEntrantes = ev.detail.checked; // ✅ valor real del toggle
  this.aplicarFiltros(); // ✅ recalcula listas
}
onFiltroEstilistaChange(ev: any) {

  console.log('ionChange value:', ev?.detail?.value, typeof ev?.detail?.value);

  this.filtroEstilistaId = Number(ev.detail.value || 0);

  this.aplicarFiltros();
}

generarOrdenDesdeCita(citaId: number) {
  const idEmpresa = this.empresa?.idEmpresa ?? this.parametro.IdEmpresa;

  this.facturaHeaderSrv.GenerarOrdenDesdeCita(citaId)
    .subscribe({
      next: async () => {

        // 🔄 RECARGAR LISTADO COMPLETO
        this.cargar(idEmpresa);

        const t = await this.toast.create({
          message: 'Orden generada y cita en proceso ✅',
          duration: 1500,
          color: 'success'
        });
        t.present();
      },
      error: async () => {
        const t = await this.toast.create({
          message: 'Error al generar la orden ❌',
          duration: 2000,
          color: 'danger'
        });
        t.present();
      }
    });
}
seleccionarDia(fecha: string) {
  this.diaSeleccionado = fecha;
  this.aplicarFiltros();
}

  // ==========================
  // 🔥 CARGAR CITAS
  // ==========================
cargar(idEmpresa: number) {
  this.cargando = true;

  this.citasSrv.GetListadoCitas(idEmpresa).subscribe({
    next: (data) => {

      this.citasFull = (data || []).map(c => {
        const fecha = c.fecha ? c.fecha.substring(0, 10) : '';

        let hora12 = '';
        if (c.hora) {
          const [h, m] = c.hora.split(':').map(Number);
          const d = new Date();
          d.setHours(h, m);
          hora12 = d.toLocaleTimeString('es-DO', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }

       return {
  ...c,

  fecha,
  hora: hora12,

  idEmpleado: Number(c.idEmpleado || c.idEmpleado || 0),

  estilista: c.nombreEstilista || 'No asignado',
  servicio: c.nombreServicio || '—',

  // 🔥🔥🔥 ESTO ES LO QUE TE FALTA
  rutaReciboPago: c.rutaReciboPago,
  banco: c.banco,
  abono: c.abono
};
      });

      // 🔥 ORDENAR POR FECHA Y HORA
      this.citasFull = this.ordenarCitas(this.citasFull);

      // 🔥 GUARDAR ÚLTIMO ID
      if (this.citasFull.length > 0) {
        this.ultimoIdCita = Math.max(...this.citasFull.map(c => c.idCita));
      }

      this.aplicarFiltros();
      this.cargando = false;

      if (!this.pollingTimer) {
        this.iniciarPolling(idEmpresa);
      }
    },
    error: async () => {
      this.cargando = false;
      (await this.toast.create({
        message: 'Error cargando citas',
        duration: 2000,
        color: 'danger'
      })).present();
    }
  });
  
}


habilitarAudioManual() {
  const a = new Audio('/assets/nuevacita.mp3');
  a.play()
    .then(() => {
      this.audioHabilitado = true;
      this.audioNuevaCita = a; // reutilizamos el mismo
    })
    .catch(() => {});
}

puedeEditar(c: any): boolean {
  return c.estado === 'Programada' || c.estado === 'Confirmada';
}

puedeEliminar(c: any): boolean {
  return c.estado === 'Programada' || c.estado === 'Confirmada';
}
getHeaderClass(estado: string) {
  const key = (estado || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ''); // "En Curso" => "encurso"

  switch (key) {
    case 'confirmada': return 'header-confirmada';
    case 'programada': return 'header-programada';
    case 'encurso':    return 'header-encurso';
    case 'completada': return 'header-completada';
    case 'cancelada':  return 'header-cancelada';
    default:           return 'header-default';
  }
}
  // ==========================
  // 🔥 ABRIR MODAL DE NUEVA CITA
  // ==========================
  async abrirModal(cita: Cita | null) {

  // 🔔 DESBLOQUEA EL AUDIO CON INTERACCIÓN REAL
 
  const modal = await this.modalCtrl.create({
    component: CitaAddComponent,
     cssClass: 'modal-encargo-grande',
    componentProps: { cita, empresa: this.empresa, fromInicio: false },
    backdropDismiss: false
  });

  await modal.present();

  const { role } = await modal.onDidDismiss();

  if (role === 'ok') {
    const idEmpresa = this.empresa?.idEmpresa ?? this.parametro.IdEmpresa;

    setTimeout(() => this.cargar(idEmpresa), 400);

    (await this.toast.create({
      message: 'Cita registrada correctamente ✅',
      duration: 1500,
      color: 'success'
    })).present();
  }
}


  // ==========================
  // 🔥 ELIMINAR CITA
  // ==========================
  async eliminar(cita: Cita) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar la cita de ${cita.nombreCliente ?? 'Cliente'} a las ${cita.hora}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (cita.idCita !== undefined) {
              this.citasSrv.DeleteItem(cita.idCita).subscribe(async () => {
                (await this.toast.create({
                  message: 'Cita eliminada ✅',
                  duration: 1500,
                  color: 'success'
                })).present();

                const id = this.empresa?.idEmpresa ?? this.parametro.IdEmpresa;
                this.cargar(id);
              });
            }
          }
        }
      ]
    });

    alert.present();
  }

  // ==========================
  // 🔥 COLOR ESTADO
  // ==========================
 statusColor(s?: Cita['estado']) {
  switch (s) {
    case 'Programada':
      return 'warning';    // 🟡 amarillo (fijo)

    case 'Confirmada':
      return 'primary';    // 🔵 azul (ok)

    case 'En curso':
      return 'medium';     // ⚪ gris (neutral)

    case 'Completada':
      return 'success';    // 🟢 verde (fijo)

    case 'Cancelada':
      return 'danger';     // 🔴 rojo (fijo)

    default:
      return 'medium';
  }
}
async cambiarEstado(cita: Cita) {
  const alert = await this.alertCtrl.create({
    header: 'Cambiar estado',
    inputs: [
      { type: 'radio', label: 'Programada', value: 'Programada', checked: cita.estado === 'Programada' },
      { type: 'radio', label: 'Confirmada', value: 'Confirmada', checked: cita.estado === 'Confirmada' },
      { type: 'radio', label: 'En curso', value: 'En curso', checked: cita.estado === 'En curso' },
      { type: 'radio', label: 'Completada', value: 'Completada', checked: cita.estado === 'Completada' },
      { type: 'radio', label: 'Cancelada', value: 'Cancelada', checked: cita.estado === 'Cancelada' },
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Aceptar',
        handler: (nuevoEstado) => {
          if (nuevoEstado && nuevoEstado !== cita.estado) {
            this.actualizarEstado(cita, nuevoEstado);
          }
        }
      }
    ]
  });

  await alert.present();
}


actualizarEstado(cita: Cita, estado: EstadoCita) {
  this.citasSrv.CambiarEstado(cita.idCita, estado)
    .subscribe({
      next: async () => {
        // 🔄 actualizar estado local
        cita.estado = estado;

        // 🔥 RECALCULAR LISTAS (sale de "entrantes" al confirmar)
        this.aplicarFiltros();

        const t = await this.toast.create({
          message: 'Estado actualizado',
          duration: 1500,
          color: 'success'
        });
        t.present();
      },
      error: async () => {
        const t = await this.toast.create({
          message: 'Error al actualizar el estado',
          duration: 2000,
          color: 'danger'
        });
        t.present();
      }
    });
}


  trackById = (_: number, c: Cita) => c?.idCita ?? _;


  
}
