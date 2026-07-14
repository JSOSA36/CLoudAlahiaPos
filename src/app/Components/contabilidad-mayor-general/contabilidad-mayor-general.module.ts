import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ContabilidadMayorGeneralComponent } from './contabilidad-mayor-general.component';

const routes: Routes = [
  { path: '', component: ContabilidadMayorGeneralComponent }
];

@NgModule({
  declarations: [],
  imports: [IonicModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
})
export class ContabilidadMayorGeneralModule {}
