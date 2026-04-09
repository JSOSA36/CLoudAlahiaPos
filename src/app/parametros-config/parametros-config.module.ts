import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ParametrosConfigComponent } from './parametros-config.component';
import { PagoFacturaComponent } from '../pago-factura/pago-factura.component';


const routes: Routes = [
  {
    path: '',
    component: ParametrosConfigComponent
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
export class ParametrosConfigModule { }
