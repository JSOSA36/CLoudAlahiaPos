import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ReporteIr17Component } from './reporte-ir17.component';

const routes: Routes = [
  {
    path: '',
    component: ReporteIr17Component
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
export class ReporteIr17Module { }
