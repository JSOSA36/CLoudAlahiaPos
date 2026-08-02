import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ReporteIt1Component } from './reporte-it1.component';

const routes: Routes = [
  {
    path: '',
    component: ReporteIt1Component
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
export class ReporteIt1Module { }
