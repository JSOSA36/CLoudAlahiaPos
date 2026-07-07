import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { RouteReuseStrategy } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { PagoEncargoComponent } from './pago-encargo.component';


const routes: Routes = [
  {
    path: '',
    component: PagoEncargoComponent
  }
];


@NgModule({
  declarations: [],
  imports: [
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
 
})
export class PagoEncargoModule { }
