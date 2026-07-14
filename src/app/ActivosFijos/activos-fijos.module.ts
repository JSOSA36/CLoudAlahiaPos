import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ActivosFijosListComponent } from './activos-fijos-list/activos-fijos-list.component';
import { ActivoFijoDetalleComponent } from './activo-fijo-detalle/activo-fijo-detalle.component';

const routes: Routes = [
  { path: '', component: ActivosFijosListComponent },
  { path: ':id', component: ActivoFijoDetalleComponent },
];

@NgModule({
  declarations: [],
  imports: [IonicModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
})
export class ActivosFijosModule {}
