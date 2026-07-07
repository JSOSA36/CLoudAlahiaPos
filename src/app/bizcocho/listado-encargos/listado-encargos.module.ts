import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { RouteReuseStrategy } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ListadoEncargosComponent } from './listado-encargos.component';


const routes: Routes = [
  {
    path: '',
    component: ListadoEncargosComponent
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
export class ListadoEncargosModule { }
