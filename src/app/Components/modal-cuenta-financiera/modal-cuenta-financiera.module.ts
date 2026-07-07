import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ModalCuentaFinancieraComponent } from './modal-cuenta-financiera.component';

const routes: Routes = [
  {
    path: '',
    component: ModalCuentaFinancieraComponent
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
export class ModalCuentaFinancieraModule { }
