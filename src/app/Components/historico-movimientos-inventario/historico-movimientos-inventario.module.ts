import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HistoricoMovimientosInventarioComponent } from './historico-movimientos-inventario.component';


const routes: Routes = [
  {
    path: '',
    component: HistoricoMovimientosInventarioComponent
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
export class HistoricoMovimientosInventarioModule { }
