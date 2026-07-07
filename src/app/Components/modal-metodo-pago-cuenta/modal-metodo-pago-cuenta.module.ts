import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ModalMetodoPagoCuentaComponent } from './modal-metodo-pago-cuenta.component';

const routes: Routes = [
  {
    path: '',
    component: ModalMetodoPagoCuentaComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    IonicModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
 
})
export class ModalMetodoPagoCuentaModule { }
