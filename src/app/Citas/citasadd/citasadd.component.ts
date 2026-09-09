import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController,AlertController } from '@ionic/angular';
import { Cita } from 'src/app/models/cita';
import { CitasService } from 'src/app/servicios/citas.service';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { EmpleadosService } from 'src/app/servicios/empleados.service';
import { HorariosEstilistaService } from 'src/app/servicios/horarioestulista.services';
import { EmpresaDto } from 'src/app/models/empresadto.models';
import { ProductosService } from 'src/app/servicios/productos.service';
import { ClienteService } from 'src/app/servicios/cliente.service';

@Component({
  selector: 'app-cita-add',
  templateUrl: './citasadd.component.html',
  styleUrls: ['./citasadd.component.scss'],
})
export class CitaAddComponent implements OnInit {



  soloEntrantes: boolean = false;



  @Input() cita!: Cita | null;
  @Input() empresa?: EmpresaDto | null;
  @Input() fromInicio: boolean = false;

  horasDisponibles: string[] = [];
  diasDisponibles: number[] = [];
 
ocrProcesando = false;
  IdCliente: number = 0;
  mostrarCalendario = false;
 imagenRecibo: File | null = null;
  previewRecibo: string | null = null;
 clienteExistente = false;
guardando = false;
  servicios: any[] = [];
  serviciosFiltrados: any[] = [];
  horasBloqueadas: string[] = [];

  form: any = {
    idCita: 0,
    nombreCliente: '',
    telefono: '',
    correo: '',
    idEmpleados: 0,
    idProducto: 0,
    fecha: '',
    hora: '',
    horaFin: '',
    idEmpresa: 0,
    estado: 'Programada',
    nota: '',
    duracionMinutos: 0,
    costo: 0,
    abono: 0,
    banco: '',
     esSeguimiento: false // 👈 🔥 ESTO ES CLAVE
  };

  empleados: any[] = [];
  empleadosFiltrados: any[] = [];
horaSeleccionadaEdit: string | null = null;
  textoBuscarEstilista = "";
  textoBuscarServicio = "";

  nombreInvalido = false;

  estados: string[] = ['Programada', 'En curso', 'Completada', 'Cancelada','Confirmada'];
  rutaReciboActual: string | undefined;

  constructor(
    private modalCtrl: ModalController,
    private toast: ToastController,
    private citasSrv: CitasService,
    private empleadosSrv: EmpleadosService,
    private parametro: ParametrosService,
    private _Horario: HorariosEstilistaService,
    private ProductosService: ProductosService,
    private clienteService: ClienteService,
    private alertCtrl: AlertController
    
  ) {}

  
async mostrarConfirmacionCliente() {
  const alert = await this.alertCtrl.create({
    header: 'Solicitud enviada',
   message: `Tu cita fue recibida por el salón.

Recibirás notificaciones sobre su confirmación vía correo electrónico.`,


    buttons: [
      {
        text: 'Entendido',
        role: 'confirm'
      }
    ]
  });

  await alert.present();
}

  
  normalizarNombre() {
  if (!this.form.nombreCliente) return;

  this.form.nombreCliente = this.form.nombreCliente
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))

    .join(' ');
}
onNombreChange() {
  const nombre = this.form.nombreCliente;

  if (!nombre) {
    this.nombreInvalido = false;
    return;
  }

  const limpio = nombre.trim().replace(/\s+/g, ' ');
  const partes = limpio.split(' ');

  // mínimo nombre + apellido
  if (partes.length < 2) {
    this.nombreInvalido = true;
    return;
  }

  // cada palabra mínimo 2 letras
  if (partes.some((p: string) => p.length < 2)) {

    this.nombreInvalido = true;
    return;
  }

  // mínimo 6 letras sin espacios
  const totalLetras = limpio.replace(/\s/g, '').length;
  if (totalLetras < 6) {
    this.nombreInvalido = true;
    return;
  }

  // solo letras y espacios (acentos permitidos)
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
  if (!regex.test(limpio)) {
    this.nombreInvalido = true;
    return;
  }

  this.nombreInvalido = false;
}

 ngOnInit() {

  console.log('ID EMPRESA:', this.empresa?.idEmpresa);

  const idEmpresa = this.empresa?.idEmpresa || this.parametro.IdEmpresa;

  this.form.idEmpresa = idEmpresa;
  this.empresa = this.empresa || this.parametro._Empresa;

  this.form.estado = this.fromInicio ? 'Programada' : this.form.estado;

  if (this.empresa) this.aplicarColores(this.empresa);

  // 🔥 SI ESTAMOS EDITANDO
  if (this.cita) {

    this.form.idCita = this.cita.idCita;
    this.form.nombreCliente = this.cita.nombreCliente;
    this.form.telefono = this.cita.telefono;
    this.form.correo = this.cita.correo;

    this.form.idProducto = this.cita.idProducto;
    this.form.idEmpleados = this.cita.idEmpleado;

    this.form.fecha = this.cita.fecha?.substring(0,10);
    this.form.hora = this.cita.hora;

    this.form.estado = this.cita.estado;
    this.form.nota = this.cita.nota;

    this.form.costo = this.cita.costo;
    this.form.duracionMinutos = this.cita.duracionMinutos;

    this.form.banco = this.cita.banco || '';
    this.form.abono = this.cita.abono || 0;

    // 🔁 detectar seguimiento automáticamente
    this.form.esSeguimiento =
      (!this.cita.banco && (!this.cita.abono || this.cita.abono === 0));

    // 📎 voucher
    this.rutaReciboActual = this.cita.rutaReciboPago;
  }

  // 🔥 SERVICIOS
 this.ProductosService.GetProductos(idEmpresa).subscribe(res => {
  this.servicios = (res || []).filter(s => s.disponibleEnCitas);
  this.serviciosFiltrados = [...this.servicios];

  // ✅ SI estoy editando, ahora sí ya existe la lista → setea el texto
  if (this.cita) {
    this.setServicioTextoSiAplica();
  }
});

  // 🔥 EMPLEADOS
  this.empleadosSrv.getByEmpresa(idEmpresa).subscribe({
    next: (res) => {

      this.empleados = res || [];
      this.empleadosFiltrados = [...this.empleados];

      if (this.cita) {

        this.cargarDatosCita(this.cita);

      } else {

        this.form.fecha = this.hoyISO();

        if (this.form.idEmpleados) {
          this.onEstilistaChange(() => this.onFechaChange());
        }
      }
    },
    error: () => {
      this.empleados = [];
      this.empleadosFiltrados = [];
    }
  });
}

  private aplicarColores(empresa: EmpresaDto) {
    document.documentElement.style.setProperty('--ion-color-primary', empresa.primaryColor || '#007bff');
    document.documentElement.style.setProperty('--ion-title-color', empresa.titleColor || '#ffffff');
  }
async onSeleccionarRecibo(event: any) {
  const file: File = event.target.files?.[0];
  if (!file) return;

  // 🔒 Validar que sea imagen
  if (!file.type.startsWith('image/')) {
    await this.mensaje('El archivo debe ser una imagen', 'warning');
    return;
  }

  // 🔒 Validar tamaño (máx 5MB)
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    await this.mensaje('La imagen es muy pesada (máx 5MB)', 'warning');
    return;
  }

  this.imagenRecibo = file;

  // 👁️ Preview
  const reader = new FileReader();
  reader.onload = () => {
    this.previewRecibo = reader.result as string;
  };
  reader.readAsDataURL(file);

  // 🧠 OCR automático
  
}

  // ==========================================================
  // 🔥 AUTOCOMPLETE ESTILISTA
  // ==========================================================
  filtrarEstilistas(event: any) {
    const txt = (event?.target?.value || "").toLowerCase();
    this.textoBuscarEstilista = txt;

    this.empleadosFiltrados = this.empleados.filter(e =>
      (e.userName || "").toLowerCase().includes(txt) ||
      (e.nombre || "").toLowerCase().includes(txt)
    );
  }

  seleccionarEstilista(emp: any) {
    this.form.idEmpleados = emp.idEmpleados;
    this.textoBuscarEstilista = emp.userName || emp.nombre;
    this.empleadosFiltrados = [];
    this.onEstilistaChange();
  }

  // ==========================================================
  // 🔥 AUTOCOMPLETE SERVICIOS (con cambio funcional)
  // ==========================================================
  filtrarServicios(event: any) {
    const txt = (event?.target?.value || "").toLowerCase();
    this.textoBuscarServicio = txt;

    if (txt.length > 0) {
      this.form.idProducto = 0;
    }

    this.serviciosFiltrados = this.servicios.filter(s =>
      s.nombre.toLowerCase().includes(txt)
    );
  }

  seleccionarServicio(serv: any) {
    this.form.idProducto = serv.idProducto;
    this.form.duracionMinutos = serv.duracionServicio;

    this.textoBuscarServicio = serv.nombre;

    // 🔥 cerrar lista al seleccionar
    this.serviciosFiltrados = [];

    this.onFechaChange();
  }

  // ==========================================================
  // 🔥 CARGAR CITA EDITAR
  // ==========================================================
private cargarDatosCita(cita: Cita) {



  this.horaSeleccionadaEdit = cita.hora || null;
  this.form = {
    ...this.form,
    idCita: cita.idCita,
    nombreCliente: cita.nombreCliente,
    telefono: cita.telefono,
    correo: cita.correo,
    idProducto: cita.idProducto,
    idEmpleados: cita.idEmpleado,
    fecha: cita.fecha?.substring(0, 10),
    hora: cita.hora,
    estado: cita.estado,
    nota: cita.nota,
    costo: cita.costo,
    duracionMinutos: cita.duracionMinutos,
    banco: cita.banco || '',
    abono: cita.abono || 0,
    esSeguimiento: (!cita.banco && (!cita.abono || cita.abono === 0))
  };

  this.rutaReciboActual = cita.rutaReciboPago;

  // ✅ Si servicios ya cargaron, lo setea aquí
  this.setServicioTextoSiAplica();

  if (this.form.idEmpleados)
    this.onEstilistaChange(() => this.onFechaChange());
}
  // ==========================================================
  // 🔥 FECHAS / HORAS
  // ==========================================================
  hoyISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  onEstilistaChange(callback?: () => void) {

  if (!this.form.idEmpleados) return;

  // 🔥 Resolver empresa correctamente
  const empresaId: number =
    this.empresa?.idEmpresa ?? this.parametro.IdEmpresa;

  if (!empresaId) {
    console.warn('EmpresaId no disponible');
    return;
  }

  this._Horario.GetHorariosByEmpleado(
    this.form.idEmpleados,
    empresaId
  ).subscribe({
    next: (res: any[]) => {

      this.diasDisponibles = (res || []).map(h => Number(h.diaSemana));
      this.mostrarCalendario = true;

      console.log('Empresa usada:', empresaId);
      console.log('Días disponibles para el estilista:', this.diasDisponibles);

      if (this.form.fecha) this.onFechaChange();
      if (callback) callback();
    },
    error: (err) => {
      console.error('Error horarios:', err);
    }
  });
}

private setServicioTextoSiAplica() {
  const id = Number(this.form?.idProducto || 0);
  if (!id) return;

  const serv = (this.servicios || []).find(s => Number(s.idProducto) === id);
  if (serv) {
    this.textoBuscarServicio = serv.nombre;     // ✅ lo que ves en el input
    this.serviciosFiltrados = [];               // opcional: cerrar lista
  }
}
  onFechaChange() {
    if (!this.form.idEmpleados || !this.form.fecha) return;

    const fechaISO = this.form.fecha.substring(0, 10);

    this._Horario.GetDisponibilidad(this.form.idEmpleados, this.form.idEmpresa, fechaISO)
      .subscribe(res => {

        let horas = res?.horasDisponibles || [];

        if (fechaISO === this.hoyISO()) {
          const now = new Date();
          const actualMin = now.getHours() * 60 + now.getMinutes();

          horas = horas.filter((h: string) => {
            const [hh, mm] = h.split(':').map(Number);
            return (hh * 60 + mm) >= actualMin;
          });
        }

        if (this.form.duracionMinutos > 0)
          horas = this.filtrarPorDuracion(horas);

        this.horasDisponibles = horas;
        this.horasBloqueadas = [];
      });
      
  }

  private filtrarPorDuracion(horas: string[]) {

  const duracion = this.form.duracionMinutos;

  return horas.filter((horaInicioStr) => {

    const inicio = this.toMinutos(horaInicioStr);
    const finNecesario = inicio + duracion;

    // 🚨 buscar todos los slots intermedios requeridos
    for (let t = inicio + 30; t < finNecesario; t += 30) {

      const hh = Math.floor(t / 60).toString().padStart(2, '0');
      const mm = (t % 60).toString().padStart(2, '0');

      const slot = `${hh}:${mm}`;

      // 🔒 Si falta continuidad, descartar
      if (!horas.includes(slot)) {
        return false;
      }
    }

    return true;
  });
}



 private toMinutos(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return (hh * 60) + mm;
}


 seleccionarHora(hora: string) {

  this.form.hora = hora;

  const inicio = this.toMinutos(hora);
  const fin = inicio + this.form.duracionMinutos;

  // 🔒 Bloquear horas dentro del rango
  this.horasBloqueadas = this.horasDisponibles.filter(h => {
    const t = this.toMinutos(h);
    return t > inicio && t < fin;
  });

  const fecha = new Date();
  const [hh, mm] = hora.split(':').map(Number);

  fecha.setHours(hh, mm, 0, 0);
  fecha.setMinutes(fecha.getMinutes() + this.form.duracionMinutos);

  this.form.horaFin =
    `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}


  // Calcular hora fin (para la leyenda y backend)
  


  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

async guardar() {

  // El salón agenda solo con los datos del cliente. Sin voucher ni abono.
  const esSeguimiento = this.fromInicio ? this.form.esSeguimiento === true : true;
  this.form.esSeguimiento = esSeguimiento;

  if (this.guardando) return;

  if (!this.form.telefono || this.form.telefono.length !== 10)
    return this.mensaje('Ingresa un teléfono válido (10 dígitos)', 'warning');

  if (this.nombreInvalido)
    return this.mensaje('Ingresa nombre y apellido válidos', 'warning');

  if (!this.form.idProducto)
    return this.mensaje('Selecciona servicio', 'warning');

  if (!this.form.idEmpleados)
    return this.mensaje('Selecciona estilista', 'warning');

  if (!this.form.fecha || !this.form.hora)
    return this.mensaje('Fecha y hora obligatorias', 'warning');

  if (!this.form.estado) {
    this.form.estado = 'Programada';
  }

  this.guardando = true;

  const fd = new FormData();

  Object.entries({
    IdCita: this.form.idCita,
    IdEmpresa: this.form.idEmpresa,
    NombreCliente: this.form.nombreCliente,
    Telefono: this.form.telefono,
    Correo: this.form.correo,
    IdEmpleado: this.form.idEmpleados,
    IdProducto: this.form.idProducto,
    Fecha: this.form.fecha,
    Hora: this.form.hora,
    DuracionMinutos: this.form.duracionMinutos ?? 0,
    HoraFin: this.form.horaFin,
    Estado: this.form.estado,
    esSeguimiento,
    Nota: this.form.nota,
    IdCliente: this.form.idCliente ?? 0,
    Costo: this.form.costo ?? 0,
    Abono: esSeguimiento ? 0 : this.form.abono ?? 0,
    Banco: esSeguimiento ? null : this.form.banco ?? null
  }).forEach(([k, v]) => fd.append(k, String(v ?? '')));

  // ✅ SOLO adjuntar ReciboPago si subió uno nuevo
  if (!esSeguimiento && this.imagenRecibo) {
    fd.append('ReciboPago', this.imagenRecibo, this.imagenRecibo.name);
  }

  const req$ = this.cita
    ? this.citasSrv.EditarCita(fd)
    : this.citasSrv.EnviarItem(fd);

  req$.subscribe({
    next: async () => {
      this.guardando = false;

      if (this.fromInicio) {
        await this.mostrarConfirmacionCliente();
      }

      this.modalCtrl.dismiss(true, 'ok');
    },
    error: async (err) => {
      console.error('ERROR:', err);
      await this.mensaje('Error al guardar', 'danger');
      this.guardando = false;
    }
  });
}

  private async mensaje(msg: string, color: string) {
    (await this.toast.create({ message: msg, duration: 1500, color })).present();
  }

isDateEnabled = (dateIsoString: string) => {

  const partes = dateIsoString.substring(0, 10).split('-');

  const year = Number(partes[0]);
  const month = Number(partes[1]);
  const day = Number(partes[2]);

  // 🔥 Crear fecha LOCAL SIN timezone
  const fechaLocal = new Date(year, month - 1, day);

  const dow = fechaLocal.getDay(); // 0=Domingo ... 6=Sábado

  return this.diasDisponibles.includes(dow);
};



  buscarClientePorTelefono() {

  if (!this.form.telefono || this.form.telefono.length < 10) {
    return;
  }

  this.clienteService
    .GetByTelefono(this.form.idEmpresa, this.form.telefono)
    .subscribe({
      next: (cliente: any) => {

        if (cliente) {
          // ✅ CLIENTE EXISTE
          this.clienteExistente = true;

          this.form.idCliente = cliente.idCliente;
          this.form.nombreCliente = cliente.nombre;
          this.form.correo = cliente.correo;
        } else {
          // 🆕 CLIENTE NUEVO
          this.clienteExistente = false;

          this.form.idCliente = 0;
          this.form.nombreCliente = '';
          this.form.correo = '';
        }
      },
      error: () => {
        this.clienteExistente = false;
      }
    });
}

}


