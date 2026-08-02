import { Component, OnInit } from '@angular/core';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { categorias } from 'src/app/models/categorias';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { ModalController } from '@ionic/angular';
import { CategoriaAddComponent } from '../categoria-add/categoria-add.component';

@Component({
  selector: 'app-listadocategorias',
  templateUrl: './listadocategorias.component.html',
  styleUrls: ['./listadocategorias.component.scss'],
})
export class ListadocategoriasComponent implements OnInit {
  ListadoCategoria: categorias[] = [];

  /** Categorías cuya imagen falló al cargar → mostrar ícono genérico */
  private imagenFallida = new Set<number>();

  constructor(
    public parametro: ParametrosService,
    private _CategoriaServices: CategoriasService,
    public modal: ModalController
  ) {
    this.GetListadoCategorias();
  }

  ngOnInit(): void {}

  tieneImagen(categoria: categorias): boolean {
    const id = categoria?.idCategoria ?? 0;
    const path = (categoria?.imagenPath || '').trim();
    return !!path && !this.imagenFallida.has(id);
  }

  onImgError(categoria: categorias): void {
    const id = categoria?.idCategoria ?? 0;
    if (id) {
      this.imagenFallida.add(id);
    }
    // Forzar refresco de la fila
    categoria.imagenPath = '';
  }

  GetListadoCategorias() {
    this.imagenFallida.clear();
    this._CategoriaServices.GetListadoCategorias(this.parametro.GetIdEmpresa()).subscribe(c => {
      this.ListadoCategoria = c || [];
    });
  }

  DeleteCategoria(IdCategoria: number) {
    const index = this.ListadoCategoria.findIndex(cat => cat.idCategoria === IdCategoria);
    if (index >= 0) {
      this.ListadoCategoria.splice(index, 1);
    }
    this._CategoriaServices.DeleteIten(IdCategoria).subscribe({ error: () => this.GetListadoCategorias() });
  }

  async openModal(Cat: categorias | null) {
    this.parametro._Cat = Cat as any;
    const modal = await this.modal.create({
      component: CategoriaAddComponent,
    });
    modal.onDidDismiss().then(() => {
      this.GetListadoCategorias();
    });
    await modal.present();
  }
}
