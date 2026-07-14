import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ListadoNotasCreditoComponent } from '../listado-notas-credito/listado-notas-credito.component';

const routes: Routes = [
  {
    path: '',
    component: ListadoNotasCreditoComponent,
    data: { soloConComprobante: true }
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
export class NotasCreditoAplicadasModule {}
