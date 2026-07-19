import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { FacturasporcobrarComponent } from './facturasporcobrar.component';
import { EstadoCuentaClienteComponent } from './estado-cuenta-cliente/estado-cuenta-cliente.component';
import { AntiguedadSaldosComponent } from '../Reportes/antiguedad-saldos/antiguedad-saldos.component';

const routes: Routes = [
  {
    path: '',
    component: FacturasporcobrarComponent
  },
  {
    path: 'estado-cuenta',
    component: EstadoCuentaClienteComponent
  },
  {
    path: 'antiguedad',
    component: AntiguedadSaldosComponent,
    data: { modo: 'cxc' }
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
export class FacturasporcobrarModule { }
