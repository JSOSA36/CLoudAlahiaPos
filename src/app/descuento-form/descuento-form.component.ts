import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DescuentoHeader } from 'src/app/models/descuento-header.model';
import { ProductoLite } from 'src/app/models/producto-lite.model';
import { Area } from 'src/app/models/area.model';

import { DescuentoHeaderService } from 'src/app/servicios/descuento-header.service';
import { ProductosService } from 'src/app/servicios/productos.service';
import { AreasService } from '../servicios/area.services';

@Component({
  selector: 'app-descuento-form',
  templateUrl: './descuento-form.component.html',
  styleUrls: ['./descuento-form.component.scss'],
})
export class DescuentoFormComponent implements OnInit {

  @Input() modo: 'crear' | 'editar' = 'crear';
  @Input() data!: DescuentoHeader;

  form!: FormGroup;

  productos: ProductoLite[] = [];
  areas: Area[] = [];

  idEmpresa: number = Number(localStorage.getItem("IdEmpresa")) || 0;

  diasSemana = [
    { id: 0, nombre: "Domingo" },
    { id: 1, nombre: "Lunes" },
    { id: 2, nombre: "Martes" },
    { id: 3, nombre: "Miércoles" },
    { id: 4, nombre: "Jueves" },
    { id: 5, nombre: "Viernes" },
    { id: 6, nombre: "Sábado" }
  ];

  serviciosSeleccionados: number[] = [];
  areasSeleccionadas: number[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private srv: DescuentoHeaderService,
    private prodSrv: ProductosService,
    private areaSrv: AreasService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.cargarProductos();
    this.cargarAreas();

    if (this.modo === "editar") {
      this.setFormData();
    }
  }

  buildForm() {
    this.form = this.fb.group({
      nombreEvento: ['', Validators.required],
      descripcion: [''],
      tipoDescuento: ['PORCENTAJE', Validators.required],
      valor: [0, Validators.required],
      aplicaATodos: [false],
      diasSemana: [''],
      fechaInicio: [''],
      fechaFin: [''],
      horaInicio: [''],
      horaFin: [''],
      activo: [true]
    });
  }

  cargarProductos() {
    this.prodSrv.getProductosLite(this.idEmpresa).subscribe(r => {
      this.productos = r;
    });
  }

  cargarAreas() {
    this.areaSrv.getAreas(this.idEmpresa).subscribe(r => {
      this.areas = r;
    });
  }

  setFormData() {
  this.form.patchValue({
    nombreEvento: this.data.nombreEvento,
    descripcion: this.data.descripcion,
    tipoDescuento: this.data.tipoDescuento,
    valor: this.data.valor,
    aplicaATodos: this.data.aplicaATodos,
    diasSemana: this.data.diasSemana,
    fechaInicio: this.data.fechaInicio,
    fechaFin: this.data.fechaFin,
    horaInicio: this.data.horaInicio,
    horaFin: this.data.horaFin,
    activo: this.data.activo
  });

  // 🔥 Recibir EXACTAMENTE lo que el backend envía
  // (listas de números: idProducto y idArea)
  this.serviciosSeleccionados = [...(this.data.servicios || [])];
  this.areasSeleccionadas = [...(this.data.areas || [])];
}

  toggleDia(dia: number) {
    let dias = this.form.value.diasSemana?.split(',').filter((d: any) => d) || [];

    if (dias.includes(dia.toString())) {
      dias = dias.filter((x: string) => x !== dia.toString());
    } else {
      dias.push(dia.toString());
    }

    this.form.patchValue({ diasSemana: dias.join(',') });
  }

  toggleServicio(id: number) {
    if (this.areasSeleccionadas.length > 0) this.areasSeleccionadas = [];

    if (this.serviciosSeleccionados.includes(id)) {
      this.serviciosSeleccionados = this.serviciosSeleccionados.filter(x => x !== id);
    } else {
      this.serviciosSeleccionados.push(id);
    }
  }

  toggleArea(id: number) {
    if (this.serviciosSeleccionados.length > 0) this.serviciosSeleccionados = [];

    if (this.areasSeleccionadas.includes(id)) {
      this.areasSeleccionadas = this.areasSeleccionadas.filter(x => x !== id);
    } else {
      this.areasSeleccionadas.push(id);
    }
  }

  guardar() {
    if (this.form.invalid) return;

    const v = this.form.value;

    const dto: DescuentoHeader = {
      idDescuentoHeader: this.modo === "editar" ? this.data.idDescuentoHeader : 0,
      idEmpresa: this.idEmpresa,

      ...v,

      fechaInicio: v.fechaInicio || null,
      fechaFin: v.fechaFin || null,
      horaInicio: v.horaInicio || null,
      horaFin: v.horaFin || null,

      servicios: this.serviciosSeleccionados,
      areas: this.areasSeleccionadas
    };

    if (this.modo === "crear") this.crear(dto);
    else this.editar(dto);
  }

  crear(dto: DescuentoHeader) {
    this.srv.create(dto).subscribe(() => {
      this.modalCtrl.dismiss("refresh");
    });
  }

  editar(dto: DescuentoHeader) {
    this.srv.update(dto.idDescuentoHeader, dto).subscribe(() => {
      this.modalCtrl.dismiss("refresh");
    });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
