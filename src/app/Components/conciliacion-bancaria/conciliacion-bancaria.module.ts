import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ConciliacionBancariaComponent } from './conciliacion-bancaria.component';

const routes: Routes = [
  { path: '', component: ConciliacionBancariaComponent }
];

@NgModule({
  declarations: [],
  imports: [IonicModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }]
})
export class ConciliacionBancariaModule {}
