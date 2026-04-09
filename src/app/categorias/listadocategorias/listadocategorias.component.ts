import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // CLI imports 
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { categorias } from 'src/app/models/categorias';
import { CategoriasService } from 'src/app/servicios/categorias.service';
import { ModalController } from '@ionic/angular';
import { productos } from 'src/app/models/productos';
import { ProductosService } from 'src/app/servicios/productos.service';
import { Camera, CameraResultType } from '@capacitor/camera';
import { AlertController } from '@ionic/angular';
import { CategoriaAddComponent } from '../categoria-add/categoria-add.component';
import { categoriadto } from 'src/app/models/categoriadto';

@Component({
  selector: 'app-listadocategorias',
  templateUrl: './listadocategorias.component.html',
  styleUrls: ['./listadocategorias.component.scss'],
})
export class ListadocategoriasComponent  implements OnInit {

 public segment:string="";
  isSupported = false;
  PorductoCategory:boolean=false
  Result=false;
  ListadoCategoria:categorias[]=[];
  _IdCate:number=0;
  constructor(private ruta:Router,public parametro:ParametrosService,
     private _CategoriaServices:CategoriasService,public modal:ModalController
    )
   { 

    this.GetListadoCategorias();
  
    
  }
ngOnInit(): void {
  
}
GetListadoCategorias()
{
  this._CategoriaServices.GetListadoCategorias(this.parametro.GetIdEmpresa()).subscribe(c=>{
    this.ListadoCategoria=c;
  });
}
DeleteCategoria(IdCategoria:number)
{
  const index = this.ListadoCategoria.findIndex(cat => cat.idCategoria === IdCategoria);

  // Si se encuentra, eliminarla
  
    this.ListadoCategoria.splice(index, 1);

    this._CategoriaServices.DeleteIten(IdCategoria).subscribe(c=>{});
   
}
async openModal(Cat:any) {

  this.parametro._Cat=Cat;
    this.parametro.Buscar="Buscar Clientes"
    const modal = await this.modal.create({
      component: CategoriaAddComponent,
      cssClass: '',
    });
    modal.onDidDismiss().then(() => {
      // Aquí recargamos la lista de categorías
      this.GetListadoCategorias();
    });

    await modal.present();
  }
}
   