import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ListadoNotasCreditoComponent } from './listado-notas-credito.component';

const routes: Routes = [
  {
    path: '',
    component: ListadoNotasCreditoComponent,
    data: { soloConComprobante: false }
  }
];

@NgModule({
  declarations: [],
  imports: [
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
})
export class ListadoNotasCreditoModule {}
