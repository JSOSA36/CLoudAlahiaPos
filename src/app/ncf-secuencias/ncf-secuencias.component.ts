import { Component, OnInit } from '@angular/core';
import { NcfSecuenciasService } from 'src/app/servicios/ncf-secuencias.service';
import { NCF_Secuencia } from '../models/NCF_Secuencia.models';

@Component({
  selector: 'app-ncf-secuencias',
  templateUrl: './ncf-secuencias.component.html',
  styleUrls: ['./ncf-secuencias.component.scss'] // 👈 ESTO
})
export class NcfSecuenciasComponent implements OnInit {

  secuencias: NCF_Secuencia[] = [];
  idEmpresa: number = 1; // 🔥 luego lo puedes tomar del login
isModalOpen = false;

openModal() {
  this.secuencia = new NCF_Secuencia(); // limpio
  this.isModalOpen = true;
}

closeModal() {
  this.isModalOpen = false;
}

edit(item: any) {
  this.secuencia = { ...item };
  this.isModalOpen = true;
}
  secuencia: NCF_Secuencia = new NCF_Secuencia();

  loading: boolean = false;

  constructor(private service: NcfSecuenciasService) {}

  ngOnInit(): void {
    this.getSecuencias();
  }

  // 🔹 Cargar lista
  getSecuencias(): void {
    this.loading = true;

    this.service.getSecuencias(this.idEmpresa)
      .subscribe({
        next: (data) => {
          this.secuencias = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }
onTipoChange(event: any) {
  const select = event.target;

  const codigo = select.value; // 👉 31
  const texto = select.options[select.selectedIndex].text; // 👉 nombre

  this.secuencia.serie = codigo;
  this.secuencia.tipoNCF = texto;
}
  // 🔹 Guardar (crear o actualizar)
  save(): void {

  this.secuencia.idEmpresa = this.idEmpresa;

  if (this.secuencia.idSecuencia === 0) {

    // ➕ Crear
    this.service.create(this.secuencia)
      .subscribe(() => {
        this.getSecuencias();
        this.closeModal();   // 🔥 cerrar modal
        this.reset();
      });

  } else {

    // ✏️ Editar
    this.service.update(this.secuencia.idSecuencia, this.secuencia)
      .subscribe(() => {
        this.getSecuencias();
        this.closeModal();   // 🔥 cerrar modal
        this.reset();
      });
  }
}
 

  // 🔹 Eliminar
  delete(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar esta secuencia?')) return;

    this.service.delete(id)
      .subscribe(() => this.getSecuencias());
  }

  // 🔥 Generar NCF
  generar(tipoNCF: string): void {
    this.service.generarNCF(this.idEmpresa, tipoNCF)
      .subscribe({
        next: (res) => {
          alert(`NCF generado: ${res.ncf || res.NCF}`);
          this.getSecuencias();
        },
        error: (err) => {
          alert(err.error || 'Error al generar NCF');
        }
      });
  }

  // 🔹 Reset formulario
  reset(): void {
    this.secuencia = new NCF_Secuencia();
  }
}