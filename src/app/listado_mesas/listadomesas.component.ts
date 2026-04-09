import { Component, OnInit,ViewChild  } from '@angular/core';
import { AlertController } from '@ionic/angular';


import { Router, RouterModule } from '@angular/router'; // CLI imports 
import { ModalController } from '@ionic/angular';
import { ZonasService } from '../servicios/zonas.service';
import { LoadingController } from '@ionic/angular';
import { zonas } from '../models/zonas';
import { ParametrosService } from '../servicios/parametros.service';
import { Mesas } from '../models/mesas';
import { ModalmesasComponent } from '../Modales/modalmesas.component';

@Component({
  selector: 'app-listado-mesas',
  templateUrl: './listadomesas.component.html',
  styleUrls: ['./listadomesas.component.scss'],
})
export class ListadoMesasComponent   {
  isModalOpen = false;
  Carga:boolean=true;
  
  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
  constructor(private ruta:Router,private modalCtrl: ModalController,
     private _Zonas:ZonasService,private Loading:LoadingController,public _Parametro:ParametrosService
     ) {

      this._Parametro._ListadoZonas=[];
    this.ListadoZonas();
    //console.log('Entre');
   
   }
   handleRefresh(event: any) {
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
    }, 2000);
    this.ListadoZonas();

    
  }
  
  Test()
  {
    alert('ok');
  }
  //ngOnInit() {}
  async showLoading() {
    const loading = await this.Loading.create({
      message: 'Cargando Controles Favor Espere...',
      duration: 3000,
    });

    loading.present();
 if(this._Parametro._Result==true)
  {
    
this.SubMetodo(this._Parametro.IdZona);
}
    
  }
  
  
  CallCategorias()
  {
     this.ruta.navigateByUrl('/categoria');
  }
  async openModal(IdMesa:number,NumeroMesa:string,mesa:Mesas) {

    this._Parametro.IdMesa=IdMesa;
    this._Parametro.NumeroMesa=NumeroMesa;
    this._Parametro._Mesa=mesa;
    const modal = await this.modalCtrl.create({
      component: ModalmesasComponent,
      cssClass: 'my-custom-class',
    });
   
  modal.present();
  
  
    



   
    
  }
  SubMetodo(IdZona:number)
  {
    this._Parametro.IdZona=IdZona;
    this.ListadoMesasByZona(IdZona);
  }
  
AcordionEvent(IdZona:number)
{
  this.ListadoMesasByZona(IdZona);
}
ListadoZonas()
{
 
  //this.Carga=true;
  this._Zonas.GetListadoZonas().subscribe((res:zonas[]) => {
     
    this._Parametro._ListadoZonas=res;
    console.log(res);
    //this.Carga=false;
    
   });


}
ListadoMesasByZona(IdZona:number)
{
 
  
  this._Parametro.Carga=true;
  this._Parametro._ListadoMesas=[];
  this._Zonas.GetListadoMesas(IdZona).subscribe((res:Mesas[]) => {
     
    this._Parametro._ListadoMesas=res;
    console.log('res');
 this._Parametro.Carga=false;
    
   });


}
    
  }


