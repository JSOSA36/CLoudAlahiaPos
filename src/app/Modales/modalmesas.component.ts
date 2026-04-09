import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // CLI imports 
import { ModalController } from '@ionic/angular';
import { ClientesComponent } from '../Clientes/clientes/clientes.component';
import { ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { ParametrosService } from '../servicios/parametros.service';
import { FacturaHeaderService } from 'src/app/servicios/factura-header.service';
import { Mesas } from '../models/mesas';
import { MesasService } from '../servicios/mesas.service';

@Component({
  selector: 'app-modalmesas',
  templateUrl: './modalmesas.component.html',
  styleUrls: ['./modalmesas.component.scss'],
})
export class ModalmesasComponent  implements OnInit {
  @ViewChild(IonModal)
  _modal!: IonModal;
  CuentasActivas:boolean=false;
  NombreCliente:string="";
  constructor(private ruta:Router,private modal:ModalController,
    private _Parametro:ParametrosService, 
    private _FacturaHeader:FacturaHeaderService,
    private _MesaServices:MesasService,
    private alertController: AlertController) { }

  ngOnInit() {}

  CallCategorias()
  {
  
    this._Parametro.NombreCliente=this.NombreCliente;
    this.ruta.navigateByUrl('/Categoria');
    this._modal.dismiss();
    this.modal.dismiss();
     
  }
  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Alert',
      
      message: 'Esta Mesa aun tiene cuentas activas!',
      buttons: ['OK'],
    });

    
    await alert.present();
  }
  CallCliente()
  {
    this.ruta.navigateByUrl('/clientemodal');
  }
  MostrarCuentas()
  {
    this.ruta.navigateByUrl('/cuentaxcobrar');
    this._modal.dismiss();
    this.modal.dismiss();
  }
  async openModal() {
    const modal = await this.modal.create({
      component: ClientesComponent,
      cssClass: 'my-custom-class',
    });
    modal.present();


}
cancel() {
  this._modal.dismiss();
}

ValidateCuentas()
  {
    this._FacturaHeader.GetListadoOrdenes(this._Parametro.IdMesa).subscribe(c=>
      {
     
     if(c.length==0)
     {
    
      console.log(c);
      this.CuentasActivas=false;
      this._Parametro._Mesa.estado="Libre";

      this._MesaServices.UpdateMesa(this._Parametro._Mesa).subscribe(p=>{
         
        this._modal.dismiss();
        this.modal.dismiss();

      })


     }
     else
     {
      this.presentAlert()
     }
     
     
    });
  }

}

